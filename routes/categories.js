const express = require("express");
const router = express.Router();

const db = require("../database/db");

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT DISTINCT "Categoría de producto"
            FROM productos
            WHERE "Categoría de producto" IS NOT NULL
            ORDER BY "Categoría de producto"
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error obteniendo categorías"
        });

    }

});

module.exports = router;