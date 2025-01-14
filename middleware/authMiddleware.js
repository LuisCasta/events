const jwt = require("jsonwebtoken");

const SKJWT = process.env.JWT_SECRET || 'HelloMexico2024'; // Usa la misma clave secreta definida en tu controlador

const authMiddleware = (req, res, next) => {
    // Obtén el token del encabezado de la solicitud
    const token = req.headers.authorization?.split(" ")[1]; // Asegúrate de enviar el token como: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "No se proporcionó un token. Acceso denegado." });
    }

    try {
        // Verifica el token
        const decoded = jwt.verify(token, SKJWT);
        req.user = decoded; // Almacena la información del usuario en `req.user` para usarla en las rutas protegidas
        next(); // Continúa con la ejecución de la ruta
    } catch (error) {
        console.error("Error al verificar el token:", error);
        res.status(403).json({ message: "Token inválido o expirado. Acceso denegado." });
    }
};

module.exports = authMiddleware;
