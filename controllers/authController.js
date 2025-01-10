const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Importa el modelo User desde Sequelize
const Token = require("../models/token");
const sendMessage = require("../helpers/sendgrid");

const SKJWT = 'HelloMexico2024';
const FORGOT_PASSWORD_URL = 'https://example.com/';

exports.register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    try {   
        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        console.log(existingUser);
        if (existingUser) {

            // Hashea la contraseña y crea el usuario en la base de datos
            const hashedPassword = await bcrypt.hash(password, 10);
            // await User.create({ email, password: hashedPassword, name: '' });
            existingUser.password = hashedPassword;
            await existingUser.save();

            const userUpdated = await User.findOne({ where: { email } });
            const to = userUpdated.email;
            const subject = 'Registro exitoso';
            const text = userUpdated.name;
            const isSendEmail = await sendMessage.sendMessage(to,subject,text);
            return res.status(201).json({ message: "Usuario registrado con éxito.", user: userUpdated, statusEmail: isSendEmail });
        }
        return res.status(409).json({ message: "Por favor registre un correo electrónico corporativo válido, sólo las personas invitadas al evento podrán asistir." });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar el usuario" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    try {
        // Busca el usuario en la base de datos
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Compara la contraseña ingresada con la almacenada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Genera un token JWT
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Inicio de sesión exitoso", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "El correo electrónico es requerido" });
    }

    try {
        // Busca el usuario en la base de datos
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const resetToken = jwt.sign({ email: user.email }, SKJWT, { expiresIn: "15m" });
        const resetLink = `${FORGOT_PASSWORD_URL}?token=${resetToken}`;

        await Token.create({token: resetToken, type: 1, status: 1})

        const to = user.email;
        const subject = 'Recuperación de contraseña';
        const text = resetLink;

        await sendMessage.sendMessagePassword(to,subject,text);

        res.status(200).json({ message: "Enlace de restablecimiento enviado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al procesar la solicitud de restablecimiento de contraseña" });
    }
};

exports.updatePassword = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    try {   
        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        console.log(existingUser);
        if (existingUser) {

            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.password = hashedPassword;
            await existingUser.save();

            const userUpdated = await User.findOne({ where: { email } });
            return res.status(201).json({ message: "Contraseña actualizada con éxito.", user: userUpdated });
        }
        return res.status(409).json({ message: "Por favor registre un correo electrónico corporativo válido, sólo las personas invitadas al evento podrán asistir." });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar la contraseña." });
    }
};