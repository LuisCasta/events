const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    idUser: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    group: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    distributor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    origin: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isVip: {
        type: DataTypes.INTEGER,
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
    tableName: 'User',
    timestamps: false,
});

module.exports = User;
