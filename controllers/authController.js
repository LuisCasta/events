const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Importa el modelo User desde Sequelize
const TokenEmail = require("../models/tokenEmail");
const sendMessage = require("../helpers/sendgrid");

const SKJWT = 'HelloMexico2024';
const FORGOT_PASSWORD_URL = 'https://acelerandooportunidades2025.com/';

const templates = {
    confirmOrDeniedRoom : process.env.SG_TEMPLATE_confirmOrDeniedRoom,
    confirmOrDeniedRoomForSenderUser : process.env.SG_TEMPLATE_confirmOrDeniedRoomForSenderUser,
    confirmEvent: process.env.SG_TEMPLATE_confirmEvent,
    confirmOrDeniedResponse: process.env.SG_TEMPLATE_confirmRoom,
    recoveryPassword: process.env.SG_TEMPLATE_recoveryPassword,
    confirmSignUp: process.env.SG_TEMPLATE_confirmSignUp
};

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

            existingUser.password = hashedPassword;
            await existingUser.save();

            const userUpdated = await User.findOne({ where: { email } });
            const to = userUpdated.email;
            const subject = 'Registro exitoso';
            const templateId = templates.confirmSignUp;
            const text = '';
            const dynamicTemplate = {
                subject,
                Iniciar_Sesion: 'https://acelerandooportunidades2025.com/?iniciarsesion=true'
            };
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplate);

            const token = jwt.sign({
                id: userUpdated.id,
                email: userUpdated.email,
                name: userUpdated.name,
                company: userUpdated.company,
                position: userUpdated.position,
                group: userUpdated.group,
                distributor: userUpdated.distributor,
                mobile: userUpdated.mobile,
                origin: userUpdated.origin,
                isVip: userUpdated.isVip,
                createdAt: userUpdated.createdAt,
            }, process.env.JWT_SECRET_KEY || SKJWT, { expiresIn: "1h" });

            return res.status(201).json({ message: "Usuario registrado con éxito.", user: userUpdated, token });
        }
        return res.status(409).json({ message: "Por favor registre un correo electrónico corporativo válido, sólo las personas invitadas al evento podrán asistir." });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar el usuario", error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "El campo email y contraseña son obligatorios." });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }


        const token = jwt.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            company: user.company,
            position: user.position,
            group: user.group,
            distributor: user.distributor,
            mobile: user.mobile,
            origin: user.origin,
            isVip: user.isVip,
            createdAt: user.createdAt,
        }, process.env.JWT_SECRET_KEY || SKJWT, { expiresIn: "1h" });
        res.status(200).json({
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.idUser,
                email: user.email,
                name: user.name,
                company: user.company,
                position: user.position,
                group: user.group,
                distributor: user.distributor,
                mobile: user.mobile,
                origin: user.origin,
                isVip: user.isVip,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                deletedAt: user.deletedAt,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al iniciar sesión", error });
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
        const resetLink = `${FORGOT_PASSWORD_URL}recovery-password?token=${resetToken}`;

        await TokenEmail.create({token: resetToken, type: 1, status: 1, email})


        const to = user.email;
        const subject = 'Recuperación de contraseña';
        const templateId = templates.recoveryPassword;
        const text = '';
        const dynamicTemplate = {
            Recuperar_Contra: resetLink,
            subject
        };
        await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplate);

        // await sendMessage.sendMessagePassword(to,subject,text);

        res.status(200).json({ message: "Se ha enviado un enlace de recuperación a tu correo." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al procesar la solicitud de restablecimiento de contraseña" });
    }
};

exports.updatePassword = async (req, res) => {
    const { password, token } = req.body;

    if (!password) {
        return res.status(400).json({ message: "El campo password es requerido." });
    }

    if (!token) {
        return res.status(401).json({ message: "El campo token es requerido" });
    }

    try {
        
        const isValidToken = await TokenEmail.findOne({where: { token }});
        console.log('IS VALID TOKEN ', isValidToken);
        if (!isValidToken || isValidToken === null ) return res.status(409).json({ message: "El token es inválido, vuelve a solicitar la recuperación de tu contraseña." });

        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ where: { email: isValidToken.email } });
        console.log(existingUser);
        if (existingUser) {

            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.password = hashedPassword;
            await existingUser.save();

            const userUpdated = await User.findOne({ where: { email: isValidToken.email } });
            return res.status(201).json({ message: "Contraseña actualizada con éxito.", user: userUpdated });
        }
        return res.status(409).json({ message: "El correo solicitado es inválido." });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar la contraseña." });
    }
};