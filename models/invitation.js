const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Flight = sequelize.define('invitation', {
    idInvitation: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userSenderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userReceiverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    respondedAt : {
        type: DataTypes.DATE,
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
    tableName: 'invitation',
    timestamps: false,
});

module.exports = Flight;
