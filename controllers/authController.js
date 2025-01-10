const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Importa el modelo User desde Sequelize
const sendMessage = require("../helpers/sendgrid");

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
        return res.status(409).json({ message: "El usuario no existe en la base de datos." });

        
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

        // Genera un token de restablecimiento
        const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Simula el envío del correo
        // await sendEmail(email, "Restablecimiento de contraseña", `Enlace para restablecer contraseña: ${resetLink}`);
        console.log(`Enlace para restablecer contraseña: ${resetLink}`);

        res.status(200).json({ message: "Enlace de restablecimiento enviado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al procesar la solicitud de restablecimiento de contraseña" });
    }
};
