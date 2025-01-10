const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, //'mysql-6286d70-hellomexico-6490.f.aivencloud.com',
    port: process.env.DB_PORT || 12208,
    username: process.env.DB_USER, // 'avnadmin',
    password: process.env.DB_PASSWORD, // 'AVNS_jBCcfAqA__hZLO_67nr',
    dialect: 'mysql',
    database: 'defaultdb',

});

module.exports = sequelize;
