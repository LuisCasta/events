const jwt = require("jsonwebtoken");
const Flight = require("../models/flight"); // Importa el modelo User desde Sequelize
const sendMessage = require("../helpers/sendgrid");
const User = require("../models/user");
const Invitation = require("../models/invitation");
const Room = require("../models/room");
const { Sequelize, Op } = require('sequelize');
const dotenv = require("dotenv");
const sequelize = require('../config/database');


dotenv.config();


const urlConfirmOrDeniedRoom = 'https://acelerandooportunidades2025.com?step=2';
const templates = {
    confirmOrDeniedRoom : process.env.SG_TEMPLATE_confirmOrDeniedRoom,
    confirmOrDeniedRoomForSenderUser : process.env.SG_TEMPLATE_confirmOrDeniedRoomForSenderUser,
    confirmEvent: process.env.SG_TEMPLATE_confirmEvent,
    confirmOrDeniedResponse: process.env.SG_TEMPLATE_confirmRoom,
    confirmSolo: process.env.SG_TEMPLATE_confirmSolo,
    rejectInvitation: process.env.SG_TEMPLATE_rejectInvitation,
    aceptInvitation: process.env.SG_TEMPLATE_aceptInvitation,
};

exports.confirm = async (req, res) => {

    try {
        const { 
            userId,
            firstNameAirline = '',
            firstFlightNumber = '',
            firstDate,
            firstBoardingTime,
            lastNameAirline = '',
            lastFlightNumber = '',
            lastDate,
            lastBoardingTime,
            wantsRoom, // 1 = si quiere habitación, 0 = no quiere habitación
            wantsToShare, // 1= si quiere compartir, 0= no quiere compartir
            emailCompanion, // email del socio con el que quiere compartir
            arrivalType, // 1= avión, 2= directo a hotel, 3 = en otro transporte al aeropuerto
        } = req.body || {};

        let bodyRoom = {};
        let bodyInvitation = {};
        let userCompanion = {};

        if (!userId) return res.status(400).json({ message: "El campo userId es requerido" });

        const user = await User.findByPk(userId);
        if (!user) return res.status(400).json({ message: "Usuario no encontrado.", user });

        if (wantsRoom > 1) return res.status(400).json({ message: "El parámetro wantsRoom es inválido", user });

        /* const isFlightSend = await Flight.findOne({where: {userId}});
        if (isFlightSend) return res.status(400).json({ message: "Ya has confirmado el evento.", user }); */

        if(wantsToShare == 1){
            userCompanion = await User.findOne({where:{ email: emailCompanion}})
            if (!userCompanion) return res.status(400).json({ message: "No fué posible enviar tu solicitud, el correo que intentas compartir no es válido.", emailCompanion });

        }
        

        const flight = await Flight.create({
            userId,
            firstNameAirline,
            firstFlightNumber,
            firstDate,
            firstBoardingTime,
            lastNameAirline,
            lastFlightNumber,
            lastDate,
            lastBoardingTime,
            arrivalType
        });

        if (!flight) return res.status(400).json({ message: "Error al confirmar asistencia.", flight });


        if(wantsRoom == 1){

            const invited = await Invitation.findOne({where: {userSenderId: userId, status: 'confirm'}})
            if (invited) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", invited });

            const haveInvitation = await Invitation.findOne({where: {userReceiverId: userId, status: 'confirm'}})
            if (haveInvitation) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", haveInvitation });

            const room = await Room.create({userId, isIndividualRoom: 1,})
            const to = user.email;
            const subject = 'Confirmación de asistencia exitosa';
            const text = 'Confirmación exitosa.';
            const templateId = templates.confirmSolo;
            const dynamicTemplateData = { subject };
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            return res.status(200).json({ message: "Confirmación de asistencia exitosa.", details: {
                flight,
                room
            } });

        }else if (wantsToShare == 1){

                bodyInvitation = {
                    userSenderId: userId,
                    userReceiverId: userCompanion.idUser,
                    status: 'pending',
                    sentAt: new Date(),
                };

                // valida que el usuario previamente ya haya sido confirmado
                const confirmed = await Flight.findOne({where:{userId: userCompanion.idUser}});
                if(!confirmed) return res.status(400).json({message: 'El usuario que tratas de invitar, no ha confirmado su asistencia al evento, espera a que confirme o invita a otro asistente.'});

                // Valida que mi usuario o el del invitado no tenga habitación privada ya reservada
                const room = await Room.findOne({where: {userId}})
                if (room) return res.status(400).json({ message: "El usuario que tratas de invitar no está disponible.", room });

                const roomCompanion = await Room.findOne({where: {userId: userCompanion.idUser}})
                if (roomCompanion) return res.status(400).json({ message: "El usuario que tratas de invitar no está disponible.", roomCompanion });

                // Valida que mi usuario no tenga habitación compartida, ya sea que yo invité o fuí invitado
                const invited = await Invitation.findOne({where: {userSenderId: userId, status: {
                    [Op.or]: ['confirm', 'pending'] // Soporta ambos estados: confirm y pending
                }}})
                if (invited) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", invited });

                const haveInvitation = await Invitation.findOne({where: {userReceiverId: userId, status: {
                    [Op.or]: ['confirm', 'pending'] // Soporta ambos estados: confirm y pending
                }}})
                if (haveInvitation) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", haveInvitation });

                // Valida que el usuario al que se pretende invitar no tenga habitación compartida, ya sea que el invitó o fué invitado
                const invitedReceiver = await Invitation.findOne({where: {userSenderId: userCompanion.idUser, status: {
                    [Op.or]: ['confirm', 'pending'] // Soporta ambos estados: confirm y pending
                }}})
                if (invitedReceiver) return res.status(400).json({ message: "El usuario que intentas invitar ya cuenta con una habitación compartida.", invitedReceiver });

                const haveInvitationReceiver = await Invitation.findOne({where: {userReceiverId: userCompanion.idUser, status: {
                    [Op.or]: ['confirm', 'pending'] // Soporta ambos estados: confirm y pending
                }}})
                if (haveInvitationReceiver) return res.status(400).json({ message: "El usuario que intentas invitar ya cuenta con una habitación compartida.", haveInvitationReceiver });

                const invitation = await Invitation.create(bodyInvitation);
                if (!invitation) return res.status(400).json({ message: "Error al enviar la invitación de habitación compartida.", invitation });

                const to = emailCompanion;
                const subject = 'Solicitud de habitación';
                const text = 'Esta es una solicitud de habitación compartida';
                const templateIdInvitation = templates.confirmOrDeniedRoom;
                const dynamicTemplateDataInvitation = {
                    Correo_Destinatario: userCompanion.name,
                    Correo_Solicitante: user.name,
                    Confirmar_Denegar: urlConfirmOrDeniedRoom,
                    subject,
                };
                await sendMessage.sendEmailWithTemplate(to,subject,text,templateIdInvitation, dynamicTemplateDataInvitation);

                const toConfirmed = user.email;
                const subjectConfirmed = 'Confirmación de asistencia exitosa';
                const textConfirmed = 'Confirmación exitosa.';
                const templateIdConfirmed = templates.confirmEvent;
                const dynamicTemplateDataConfirmed = { subject: subjectConfirmed};
                await sendMessage.sendEmailWithTemplate(toConfirmed,subjectConfirmed,textConfirmed,templateIdConfirmed, dynamicTemplateDataConfirmed);

                return res.status(200).json({ message: "Confirmación de asistencia exitosa. Haz solicitado una habitación compartida, revisa tu correo.", details: {
                    invitation,
                    flight,
                } });

        }else{
            const to = user.email;
            const subject = 'Confirmación de asistencia exitosa';
            const text = 'Confirmación exitosa.';
            const templateId = templates.confirmEvent;
            const dynamicTemplateData = { subject };
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            return res.status(200).json({ message: "Confirmación de asistencia exitosa.", details: {
                flight,
            } });
        }
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al confirmar la asistencia al evento.", error });
    }
};

exports.confirmOrDecline = async (req, res) => {

    try {
        const { 
            userId,
            isConfirm, // 1 o 0
            token,
        } = req.body;

        let updatedInvitation = {};
        let messageInvitation = '';

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decoded) {
            return res.status(401).json({ message: "Token inválido" });
        }

        if (!userId) return res.status(400).json({ message: "El campo userId es requerido" });

        if (isConfirm > 1) return res.status(400).json({ message: "El campo confirm no es correcto, solo puede aceptar o declinar." });

        // este es el usuario que hace login e intenta confirmar/rechazar
        const user = await User.findByPk(userId);
        if (!user) return res.status(400).json({ message: "Usuario no encontrado.", user });

        // valida que el usuario previamente ya haya sido confirmado
        const confirmed = await Flight.findOne({where:{userId}});
        if(!confirmed) return res.status(400).json({message: 'Debes confirmar tu asistencia antes de aceptar o rechazar compartir habitación'});

        // valida que la invitación exista, suponiendo que mi userId es como invitado
        const ExistInvitation = await Invitation.findOne(
            {
                where:{
                    userReceiverId: userId, 
                    status: 'pending'
                },
                order: [['idInvitation', 'DESC']]
            });
        if (!ExistInvitation) return res.status(400).json({ message: "Invitación no encontrada.", ExistInvitation });

        // validaciones para que no exista en room
        const room = await Room.findOne({where: {userId}})
        if (room) return res.status(400).json({ message: "Ya cuentas con una habitación privada.", room });

        const roomUserSender = await Room.findOne({where: {userId: ExistInvitation.userSenderId}})
        if (roomUserSender) return res.status(400).json({ message: "El usuario que solicitó habitación compartida, ya cuenta con una habitación privada.", roomUserSender });

        // validaciones para saber que no ha compartido habitación con otros usuarios

        // Valida que mi usuario no tenga habitación compartida, ya sea que yo invité o fuí invitado
        const invited = await Invitation.findOne({where: {userSenderId: userId, status: 'confirm'}})
        if (invited) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", invited });

        const haveInvitation = await Invitation.findOne({where: {userReceiverId: userId, status: 'confirm'}})
        if (haveInvitation) return res.status(400).json({ message: "Ya cuentas con una solicitud de habitación compartida.", haveInvitation });

        // Valida que el usuario al que se pretende invitar no tenga habitación compartida, ya sea que el invitó o fué invitado
        const invitedReceiver = await Invitation.findOne({where: {userSenderId: ExistInvitation.userSenderId, status: 'confirm'}})
        if (invitedReceiver) return res.status(400).json({ message: "El usuario que intentas invitar ya cuenta con una habitación compartida.", invitedReceiver });

        const haveInvitationReceiver = await Invitation.findOne({where: {userReceiverId: ExistInvitation.userSenderId, status: 'confirm'}})
        if (haveInvitationReceiver) return res.status(400).json({ message: "El usuario que intentas invitar ya cuenta con una habitación compartida.", haveInvitationReceiver });

        const userSender = await User.findByPk(ExistInvitation.userSenderId);

        if (isConfirm == 1){
    
            ExistInvitation.status = 'confirm';
            ExistInvitation.respondedAt = new Date();
            await ExistInvitation.save();

            /* updatedInvitation = await Invitation.update({
                status: 'confirm',
                respondedAt: new Date()
            }, {where:{userReceiverId: userId}}) */
    
            // if (!updatedInvitation) return res.status(400).json({ message: "Invitación no actualizada.", updatedInvitation });
    
            const to = userSender.email;
            const subject = 'Confirmación de conexión de habitación';
            const text = 'Confirmación exitosa.';
            const templateId = templates.aceptInvitation;
            const dynamicTemplateData = { subject, Correo_Solicitante: user.name};
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            messageInvitation = "Confirmación de conexión de habitación exitosa";
    
        }else{    
    
            ExistInvitation.status = 'rejected';
            ExistInvitation.respondedAt = new Date();
            await ExistInvitation.save();

            /* const updatedInvitation = await Invitation.update({
                status: 'rejected',
                respondedAt: new Date()
            }, {where:{userReceiverId: userId}})
    
            if (!updatedInvitation) return res.status(400).json({ message: "Invitación no actualizada.", updatedInvitation });
             */
            const to = userSender.email;
            const subject = 'Respuesta de conexión de habitación.';
            const text = 'Respuesta de conexión de habitación...';
            const templateId = templates.rejectInvitation;
            const dynamicTemplateData = { subject };
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            messageInvitation = "Respuesta de conexión de habitación.";
    
        }
        return res.status(200).json({
            message: messageInvitation,
            // updatedInvitation
        });

        
    } catch (error) {
        console.error(error);
        if (error instanceof jwt.TokenExpiredError) {
            // Manejar el caso en que el token ha expirado
            return res.status(401).json({ message: "Tu token ha expirado, comunicate a info@acelerandooportunidades2025.com" });
        } else {
            // Manejar otros posibles errores (por ejemplo, token mal formado)
            return res.status(500).json({ message: "No fué posible confirmar o rechazar la invitación.", error});
        }
    
    }
};

exports.getInvitationData = async (req, res) => {

    try {
        const { userId } = req.body;

        const user = await User.findByPk(userId);
        if(!user) return res.status(400).json({ message: "Usuario no encontrado.", user, code: 409 });

        const dataInvitation = await Invitation.findOne({where:{userReceiverId: userId}})
        if(!dataInvitation) return res.status(400).json({ message: "Invitación no encontrada para el usuario.", dataInvitation, code: 411 });

        const userData = await User.findByPk(dataInvitation.userSenderId);
        if(!userData) return res.status(400).json({ message: "usuario anfitrión no encontrado.", userData, code: 412 });  

        return res.status(200).json({
            message: "Usuario anfitrión encontrado exitosamente.",
            hostUser: userData,
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error al buscar los datos del anfitrión.", error });
    }
};

exports.getRecords = async (req, res) => {

    try {
        const users = await User.findAll({
            where: {
              password: {
                [Sequelize.Op.ne]: null
              },
              idUser: {
                [Sequelize.Op.notBetween]: [1, 7]
              }
            },
            attributes:['name','company', 'position', 'group', 'distributor', 'email', 'isVip',]
          });
          
        return res.status(200).json(users);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error al obtener los usuarios.", error });
    }
};

exports.getRecordsConfirmed = async (req, res) => {
    try {
        // Ejecutar la consulta SQL directamente con sequelize.query
        const results = await sequelize.query(`
          SELECT DISTINCT
              u.name, 
              u.company, 
              u.position, 
              u.group, 
              u.distributor, 
              u.email, 
              u.isVip
          FROM 
              User u
          INNER JOIN 
              Flight f ON u.idUser = f.userId
          WHERE 
              u.idUser NOT BETWEEN 1 AND 7
              AND f.userId IS NOT NULL;
        `, { type: sequelize.QueryTypes.SELECT });

        // Retornar los resultados
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error al obtener los usuarios.", error });
    }
};

exports.getRecordsConfirmedWithDetails = async (req, res) => {
    try {
        // Ejecutar la consulta SQL directamente con sequelize.query
        const results = await sequelize.query(`
          SELECT DISTINCT 
            u.name, 
            u.company, 
            u.position, 
            u.group, 
            u.distributor, 
            u.email,
            u.isVip,
            f.firstNameAirline as 'Aerolinea Llegada',
            f.firstFlightNumber as 'Vuelo Llegada',
            f.firstDate as 'Fecha Llegada',
            f.firstBoardingTime as 'Hora Llegada',
            f.lastNameAirline as 'Aerolinea Salida',
            f.lastFlightNumber as 'Vuelo Salida',
            f.lastDate as 'Fecha Salida',
            f.lastBoardingTime as 'Hora Salida',
            CASE 
                WHEN f.arrivalType = 1 THEN 'Avión'
                WHEN f.arrivalType = 2 THEN 'Llega hotel'
                WHEN f.arrivalType = 3 THEN 'Particular a aeropuerto'
            ELSE 'Desconocido'
            END AS 'Medio de llegada',
            CASE
                WHEN r.userId IS NOT NULL THEN 'Habitación Privada'
                WHEN i.userSenderId = u.idUser THEN 'Habitación Compartida - Solicitud enviada'
                WHEN i.userReceiverId = u.idUser THEN 'Habitación Compartida - Solicitud recibida'
                ELSE 'Sin habitación, Sin Compartir'
            END AS 'Tipo de reservación',
             i.userSenderId,
             i.userReceiverId,
             i.status as 'Etatus de Invitación',
             us.name as 'Nombre del Remitente',
             us.email as 'Email del Remitente',
             ur.name as 'Nombre del Invitado',
             ur.email as 'Email del Invitado'
            FROM 
                User u
            INNER JOIN 
                Flight f ON u.idUser = f.userId
            LEFT JOIN 
                Room r ON u.idUser = r.userId
            LEFT JOIN 
                invitation i ON i.userSenderId = u.idUser OR i.userReceiverId = u.idUser
            LEFT JOIN
                User us ON i.userSenderId = us.idUser
            LEFT JOIN 
                User ur ON i.userReceiverId = ur.idUser
            WHERE 
                u.idUser NOT BETWEEN 1 AND 7;`, 
        { type: sequelize.QueryTypes.SELECT });

        // Retornar los resultados
        return res.status(200).json(results);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error al obtener los usuarios.", error });
    }
};