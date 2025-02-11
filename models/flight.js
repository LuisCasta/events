const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Flight = sequelize.define('Flight', {
    idFlight: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    firstNameAirline: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    firstFlightNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    firstDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    firstBoardingTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastNameAirline: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastFlightNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lastDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastBoardingTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    arrivalType: {
        type: DataTypes.TINYINT, // 1, 2, 3
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'Flight',
    timestamps: false,
});

module.exports = Flight;
