const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Flight = require("../models/flight"); // Importa el modelo User desde Sequelize
const sendMessage = require("../helpers/sendgrid");

const SKJWT = 'HelloMexico2024';
const FORGOT_PASSWORD_URL = 'https://acelerandooportunidades2025.com/';

exports.confirm = async (req, res) => {
    const { 
        email,
        firstNameAirline,
        firstFlightNumber,
        firstDate,
        firstBoardingTime,
        lastNameAirline,
        lastFlightNumber,
        lastDate,
        lastBoardingTime,
     } = req.body;

    if (!email) return res.status(400).json({ message: "El campo email es requeridos" });

    try {
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar el usuario", error });
    }
};
