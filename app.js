const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require('cors');
const sequelize = require('./config/database'); // Conexión DB
const axios = require('axios');


// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 0;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rutas
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Ruta base
app.get("/", (req, res) => {
    res.send("Bienvenido a la API de autenticación");
});

// Iniciar el servidor y conectar a la base de datos
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');

        await sequelize.sync();
        console.log('Modelos sincronizados con la base de datos.');

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto: ${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
})();

app.post('/verify-captcha', async (req, res) => {
    const { token } = req.body; // El token enviado desde el frontend
  
    try {
      // Realizar la verificación con la API de Cloudflare Turnstile
      const response = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', null, {
        params: {
          secret: process.env.CF_SECRET_KEY, //'TU_SECRET_KEY',  // La clave secreta que obtuviste en Cloudflare
          response: token,
        },
      });
  
      if (response.data.success) {
        res.send('Captcha verificado correctamente');
      } else {
        res.status(400).send('Captcha inválido');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al verificar el captcha');
    }
  });
  


const server = app.listen(0, () => {
    const { port } = server.address(); // Captura correctamente el puerto
    console.log(`Servidor corriendo en http://localhost:${port}`);
});