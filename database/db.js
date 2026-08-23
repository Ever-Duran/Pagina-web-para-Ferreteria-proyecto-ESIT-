const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

pool.connect()
    .then(client => {
        console.log("Conectado a PostgreSQL");
        client.release();
    })
    .catch(error => {
        console.error("Error conectando a PostgreSQL:", error.message);
    });

module.exports = pool;