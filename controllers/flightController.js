const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Flight = require("../models/flight"); // Importa el modelo User desde Sequelize
const sendMessage = require("../helpers/sendgrid");
const User = require("../models/user");
const Invitation = require("../models/invitation");
const Room = require("../models/room");
const dotenv = require("dotenv");
dotenv.config();


const urlConfirmOrDeniedRoom = 'https://acelerandooportunidades2025.com/step2';
const templates = {
    confirmOrDeniedRoom : process.env.SG_TEMPLATE_confirmOrDeniedRoom,
    confirmOrDeniedRoomForSenderUser : process.env.SG_TEMPLATE_confirmOrDeniedRoomForSenderUser,
    confirmEvent: process.env.SG_TEMPLATE_confirmEvent,
};
exports.confirm = async (req, res) => {

    try {
        const { 
            userId,
            firstNameAirline,
            firstFlightNumber,
            firstDate,
            firstBoardingTime,
            lastNameAirline,
            lastFlightNumber,
            lastDate,
            lastBoardingTime,
            wantsRoom, // 1 = si quiere habitación, 0 = no quiere habitación
            wantsToShare, // 1= si quiere compartir, 0= no quiere compartir
            emailCompanion, // email del socio con el que quiere compartir
        } = req.body;

        let bodyRoom = {};
        let bodyInvitation = {};
        let userCompanion = {};

        if (!userId) return res.status(400).json({ message: "El campo userId es requerido" });

        const user = await User.findByPk(userId);
        if (!user) return res.status(400).json({ message: "Usuario no encontrado.", user });

        const isFlightSend = await Flight.findOne({where: {userId}});
        if (isFlightSend) return res.status(400).json({ message: "Ya has confirmado el evento.", user });

        if(wantsToShare == 1){
            userCompanion = await User.findOne({where:{ email: emailCompanion}})
            if (!userCompanion) return res.status(400).json({ message: "No fué posible enviar solicitud de compartir, el correo que intenta compartir no es válido.", emailCompanion });

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
        });

        if (!flight) return res.status(400).json({ message: "Error al confirmar asistencia.", flight });


        if(wantsRoom == 1){

            if(wantsToShare == 1){

                bodyInvitation = {
                    userSenderId: userId,
                    userReceiverId: userCompanion.idUser,
                    status: 'pending',
                    sentAt: new Date(),
                }

                bodyRoom = {
                    userId: userId,
                    isIndividualRoom: 0,
                    wantsToShare: 1,
                    companionId: userCompanion.idUser,
                    invitationStatus: 'pending',
                }

                const room = await Room.create(bodyRoom);
                if (!room) return res.status(400).json({ message: "Error al solicitar la habitación.", room });


                const invitation = await Invitation.create(bodyInvitation);
                if (!invitation) return res.status(400).json({ message: "Error al enviar la invitación de habitación compartida.", invitation });

                const to = emailCompanion;
                const subject = 'Solicitud de habitación';
                const text = 'Esta es una solicitud de habitación compartida';
                const templateIdInvitation = templates.confirmOrDeniedRoom;
                const dynamicTemplateDataInvitation = {
                    "Correo_Destinatario": to,
                    "Correo_Solicitante": user.email,
                    "Confirmar_Denegar": urlConfirmOrDeniedRoom,
                };
                await sendMessage.sendMessage(to,subject,text,templateIdInvitation, dynamicTemplateDataInvitation);

                const toUserRemitent = user.email;
                const subjectRemitent = 'Solicitud de habitación Enviada';
                const textRemitent = `Haz enviado una solicitud de habitación a ${emailCompanion}`;
                const templateIdInvitation2 = templates.confirmOrDeniedRoomForSenderUser;
                const dynamicTemplateDataInvitation2 = {};
                await sendMessage.sendMessage(toUserRemitent,subjectRemitent,textRemitent, templateIdInvitation2, dynamicTemplateDataInvitation2);

                const toConfirmed = emailCompanion;
                const subjectConfirmed = 'Confirmación de asistencia exitosa';
                const textConfirmed = 'Confirmación exitosa.';
                const templateIdConfirmed = templates.confirmEvent;
                const dynamicTemplateDataConfirmed = {};
                await sendMessage.sendMessage(toConfirmed,subjectConfirmed,textConfirmed,templateIdConfirmed, dynamicTemplateDataConfirmed);

                return res.status(200).json({ message: "Confirmación de asistencia exitosa. Haz solicitado una habitación compartida, revisa tu correo.", details: {
                    room,
                    invitation,
                    flight,
                } });

            }else{
                bodyRoom = {
                    userId: userId,
                    isIndividualRoom: 1,
                }

                const room = await Room.create(bodyRoom);
                if (!room) return res.status(400).json({ message: "Error al solicitar la habitación.", room });

                const to = user.email;
                const subject = 'Confirmación de asistencia exitosa';
                const text = 'Confirmación exitosa.';
                const templateId = templates.confirmEvent;
                const dynamicTemplateData = {};
                await sendMessage.sendMessage(to,subject,text,templateId, dynamicTemplateData);

                return res.status(200).json({ message: "Confirmación de asistencia exitosa. Haz solicitado una habitación para ti.", details: {
                    room,
                    flight,
                } });

            }
        }else{

            const to = user.email;
            const subject = 'Confirmación de asistencia exitosa';
            const text = 'Confirmación exitosa.';
            const templateId = templates.confirmEvent;
            const dynamicTemplateData = {};
            await sendMessage.sendMessage(to,subject,text,templateId, dynamicTemplateData);

            return res.status(200).json({ message: "Confirmación de asistencia exitosa.", details: {
                flight,
            } });
        }
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar el usuario", error });
    }
};
