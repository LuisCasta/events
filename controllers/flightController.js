const jwt = require("jsonwebtoken");
const Flight = require("../models/flight"); // Importa el modelo User desde Sequelize
const sendMessage = require("../helpers/sendgrid");
const User = require("../models/user");
const Invitation = require("../models/invitation");
const Room = require("../models/room");
const dotenv = require("dotenv");
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

            const to = user.email;
            const subject = 'Confirmación de asistencia exitosa';
            const text = 'Confirmación exitosa.';
            const templateId = templates.confirmSolo;
            const dynamicTemplateData = { subject };
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            return res.status(200).json({ message: "Confirmación de asistencia exitosa.", details: {
                flight,
            } });

        }else if (wantsToShare == 1){

                bodyInvitation = {
                    userSenderId: userId,
                    userReceiverId: userCompanion.idUser,
                    status: 'pending',
                    sentAt: new Date(),
                }

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

        let room = {};
        let updatedInvitation = {};
        let messageInvitation = '';

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verificar el token

        if (!decoded) { // Verificación extra, aunque innecesaria
            return res.status(401).json({ message: "Token inválido" });
        }

        if (!userId) return res.status(400).json({ message: "El campo userId es requerido" });

        if (isConfirm > 1) return res.status(400).json({ message: "El campo confirm no es correcto, solo puede aceptar o declinar." });


        const user = await User.findByPk(userId);
        if (!user) return res.status(400).json({ message: "Usuario no encontrado.", user });

        const ExistInvitation = await Invitation.findOne({where:{userReceiverId: userId}});
        if (!ExistInvitation) return res.status(400).json({ message: "Invitación no encontrada.", ExistInvitation });

        const userSender = await User.findByPk(ExistInvitation.userSenderId);

        if (isConfirm == 1){


            room = await Room.update({
                invitationStatus: 'confirm'
            },
            {where:{companionId: userId}})
    
            if (!room) return res.status(400).json({ message: "Habitación no confirmada.", room });
    
    
            updatedInvitation = await Invitation.update({
                status: 'confirm',
                respondedAt: new Date()
            }, {where:{userReceiverId: userId}})
    
            if (!updatedInvitation) return res.status(400).json({ message: "Invitación no actualizada.", updatedInvitation });
    
            const to = userSender.email;
            const subject = 'Confirmación de conexión de habitación';
            const text = 'Confirmación exitosa.';
            const templateId = templates.aceptInvitation;
            const dynamicTemplateData = { subject, Correo_Solicitante: user.name};
            await sendMessage.sendEmailWithTemplate(to,subject,text,templateId, dynamicTemplateData);

            messageInvitation = "Confirmación de conexión de habitación exitosa";
    
        }else{

            const room = await Room.update({
                invitationStatus: 'rejected'
            },
            {where:{companionId: userId}})
    
            if (!room) return res.status(400).json({ message: "Habitación no confirmada.", room });
    
    
            const updatedInvitation = await Invitation.update({
                status: 'rejected',
                respondedAt: new Date()
            }, {where:{userReceiverId: userId}})
    
            if (!updatedInvitation) return res.status(400).json({ message: "Invitación no actualizada.", updatedInvitation });
    
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
            room,
            updatedInvitation
        });

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "No fué posible confirmar o rechazar la invitación.", error });
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

