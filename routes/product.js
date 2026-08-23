const express = require("express");
const router = express.Router();

const db = require("../database/db");

router.get("/", async (req, res) => {

    try {

        const search = req.query.search || "";
        const category = req.query.category || "";

        const page = parseInt(req.query.page) || 1;

        const limit = 20;

        const offset = (page - 1) * limit;

        let where = "WHERE 1=1";

        const values = [];

        if (search !== "") {

            values.push(`%${search}%`);

            where += `
                AND (
                    "Nombre en pantalla" ILIKE $${values.length}
                    OR CAST("Codigo" AS TEXT) ILIKE $${values.length}
                )
            `;

        }

        if (category !== "") {

            values.push(category);

            where += `
                AND "Categoría de producto" = $${values.length}
            `;

        }

        // Obtener el total de productos
        const totalQuery = `
            SELECT COUNT(*) AS total
            FROM productos
            ${where}
        `;

        const totalResult = await db.query(totalQuery, values);

        const totalProductos = parseInt(totalResult.rows[0].total);

        const totalPaginas = Math.ceil(totalProductos / limit);

        // Consulta paginada
        values.push(limit);
        values.push(offset);

        const dataQuery = `
            SELECT *
            FROM productos
            ${where}
            ORDER BY "Nombre en pantalla"
            LIMIT $${values.length - 1}
            OFFSET $${values.length}
        `;

        const result = await db.query(dataQuery, values);

        res.json({

            productos: result.rows,

            pagina: page,

            totalPaginas,

            totalProductos

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Error consultando productos"

        });

    }

});

module.exports = router;