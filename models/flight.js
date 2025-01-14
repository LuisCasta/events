const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Flight = sequelize.define('Flight', {
    idFlight: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstNameAirline: {
        type: DataTypes.STRING,
        allowNull: false,
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
        allowNull: false,
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
