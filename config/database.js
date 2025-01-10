const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: 'mysql-6286d70-hellomexico-6490.f.aivencloud.com',
    port: 12208,
    username: 'avnadmin',
    password: 'AVNS_jBCcfAqA__hZLO_67nr',
    dialect: 'mysql',
    database: 'defaultdb',

});

module.exports = sequelize;
