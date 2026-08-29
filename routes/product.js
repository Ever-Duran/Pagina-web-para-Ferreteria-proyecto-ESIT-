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

        // Solo mostrar productos que tengan código
        let where = `WHERE "Codigo" IS NOT NULL
                     AND TRIM(CAST("Codigo" AS TEXT)) <> ''`;

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

        // =============================
        // OBTENER EL TOTAL DE PRODUCTOS
        // =============================

        const totalQuery = `
            SELECT COUNT(*) AS total
            FROM productos
            ${where}
        `;

        const totalResult = await db.query(totalQuery, values);

        const totalProductos =
            parseInt(totalResult.rows[0].total);

        const totalPaginas =
            Math.ceil(totalProductos / limit);


        // =============================
        // CONSULTA PAGINADA
        // =============================

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

        const result =
            await db.query(dataQuery, values);


        // =============================
        // RESPUESTA
        // =============================

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
