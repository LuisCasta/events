const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const sequelize = require('./config/database'); // Conexión DB


// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 0;

// Middlewares
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



const server = app.listen(0, () => {
    const { port } = server.address(); // Captura correctamente el puerto
    console.log(`Servidor corriendo en http://localhost:${port}`);
});