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

app.post('/validate-captcha', async (req, res) => {
  app.post("/validate-captcha", async (req, res) => {
    const { token } = req.body;
    const secretKey = "6LcnprcqAAAAAE8-QmdscQ6nL0FQZGxrxlHo4Wuu"; // Reemplaza con tu Secret Key
  
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
      }
    );
  
    const data = await response.json();
  
    if (data.success) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: data["error-codes"] });
    }
  });
});
  


const server = app.listen(0, () => {
    const { port } = server.address(); // Captura correctamente el puerto
    console.log(`Servidor corriendo en http://localhost:${port}`);
});