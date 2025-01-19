const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
    idRoom: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    isIndividualRoom: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    wantsToShare : {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    companionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    invitationStatus: {
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
    tableName: 'Room',
    timestamps: false,
});

module.exports = Room;
