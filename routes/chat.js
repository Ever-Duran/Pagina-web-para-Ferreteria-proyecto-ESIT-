const express = require("express");
const router = express.Router();

const { GoogleGenAI } = require("@google/genai");
const db = require("../database/db");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// =====================================================
// FUNCIÓN: buscar_productos
// =====================================================

async function buscarProductos(consulta) {

    const inicioDB = Date.now();

    // Normalizar la consulta
    let termino = (consulta || "")
        .toLowerCase()
        .trim();

    // Manejar plurales comunes
    if (termino.endsWith("es")) {
        termino = termino.slice(0, -2);
    } else if (termino.endsWith("s")) {
        termino = termino.slice(0, -1);
    }


    // =====================================================
    // SI NO HAY CONSULTA:
    // DEVOLVER PRODUCTOS DISPONIBLES
    // =====================================================

    if (!termino) {

        const result = await db.query(`
            SELECT
                "Codigo",
                "Nombre en pantalla",
                "Categoría de producto",
                "Cantidad a la mano",
                "Costo promedio"
            FROM productos
            WHERE "Cantidad a la mano" > 0
            ORDER BY "Nombre en pantalla"
            LIMIT 10
        `);

        console.log(
            `PostgreSQL tardó: ${Date.now() - inicioDB} ms`
        );

        return result.rows;
    }


    // =====================================================
    // SI HAY CONSULTA:
    // BUSCAR PRODUCTOS
    // =====================================================

    const searchTerm = `%${termino}%`;

    const result = await db.query(`
        SELECT
            "Codigo",
            "Nombre en pantalla",
            "Categoría de producto",
            "Cantidad a la mano",
            "Costo promedio"
        FROM productos
        WHERE
            "Nombre en pantalla" ILIKE $1
            OR CAST("Codigo" AS TEXT) ILIKE $1
            OR "Categoría de producto" ILIKE $1
        LIMIT 10
    `, [searchTerm]);


    console.log(
        `PostgreSQL tardó: ${Date.now() - inicioDB} ms`
    );


    return result.rows;
}


// =====================================================
// CHAT
// =====================================================

router.post("/", async (req, res) => {

    const inicioTotal = Date.now();

    try {

        const {
            message,
            historial = []
        } = req.body;


        if (!message || !message.trim()) {

            return res.status(400).json({
                error: "El mensaje está vacío."
            });

        }


        // =================================================
        // DEFINICIÓN DE LA FUNCIÓN
        // =================================================

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "buscar_productos",

                        description:
                            "Busca productos en el catálogo de Ferretería Alex. " +
                            "Úsala cuando el cliente pregunte por productos, precios, " +
                            "disponibilidad, cantidades, códigos o categorías. " +
                            "Si el cliente pide ver qué productos están disponibles " +
                            "en general, utiliza una consulta vacía.",

                        parameters: {
                            type: "OBJECT",

                            properties: {

                                consulta: {
                                    type: "STRING",

                                    description:
                                        "Producto, código, categoría o término que se desea buscar. " +
                                        "Déjalo vacío cuando el cliente quiera ver productos disponibles en general."
                                }

                            },

                            required: ["consulta"]
                        }
                    }
                ]
            }
        ];


        // =================================================
        // INSTRUCCIONES
        // =================================================

        const systemInstruction = `
Eres el asistente virtual de Ferretería Alex.

Tu trabajo es ayudar a los clientes de forma amable,
natural y breve.

REGLAS IMPORTANTES:

- Responde siempre en español.
- No inventes productos.
- No inventes precios.
- No inventes cantidades disponibles.
- No inventes códigos.
- Cuando el cliente pregunte por productos, precios,
  disponibilidad, cantidades, códigos o categorías,
  utiliza la función buscar_productos.
- Si el cliente simplemente saluda o hace conversación,
  no necesitas utilizar la función.
- Utiliza únicamente la información proporcionada por
  la base de datos para hablar de productos.
- Utiliza el historial de conversación para entender
  referencias como "ese producto", "el anterior",
  "¿cuánto cuesta?" o "¿cuántos tienen?".
`;


        // =================================================
        // CONSTRUIR CONTEXTO
        // =================================================

        let contexto = "";

        if (historial.length > 0) {

            contexto = `
Historial reciente de la conversación:

${historial
    .slice(-10)
    .map(mensaje => {
        const rol =
            mensaje.role === "user"
                ? "Cliente"
                : "Asistente";

        return `${rol}: ${mensaje.content}`;
    })
    .join("\n")}

`;

        }


        // =================================================
        // PRIMERA LLAMADA A GEMINI
        // =================================================

        const inicioGemini1 = Date.now();


        let response = await ai.models.generateContent({

            model: "gemini-3.6-flash",

            contents: `
${contexto}

Cliente:
${message}
`,

            config: {
                systemInstruction: systemInstruction,
                tools: tools
            }

        });


        console.log(
            `Primera llamada a Gemini: ${Date.now() - inicioGemini1} ms`
        );


        // =================================================
        // REVISAR FUNCTION CALLING
        // =================================================

        const functionCalls = response.functionCalls;


        if (functionCalls && functionCalls.length > 0) {

            const functionCall = functionCalls[0];


            console.log(
                "Gemini solicitó función:",
                functionCall.name,
                functionCall.args
            );


            // =================================================
            // EJECUTAR FUNCIÓN
            // =================================================

            if (functionCall.name === "buscar_productos") {

                const consulta =
                    functionCall.args.consulta;


                const productos =
                    await buscarProductos(consulta);


                console.log(
                    "Resultados encontrados:",
                    productos.length
                );


                // =================================================
                // SEGUNDA LLAMADA A GEMINI
                // =================================================

                const inicioGemini2 = Date.now();


                /*
                 * IMPORTANTE:
                 *
                 * Conservamos exactamente las partes que
                 * devolvió Gemini en la primera respuesta.
                 *
                 * Esto evita perder información necesaria
                 * para Function Calling.
                 */

                const partesGemini =
                    response.candidates[0].content.parts;


                response = await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    contents: [

                        {
                            role: "user",

                            parts: [
                                {
                                    text: `
${contexto}

Cliente:
${message}
`
                                }
                            ]
                        },

                        {
                            role: "model",

                            parts: partesGemini
                        },

                        {
                            role: "user",

                            parts: [
                                {
                                    functionResponse: {
                                        name: "buscar_productos",

                                        response: {
                                            productos: productos
                                        }
                                    }
                                }
                            ]
                        }

                    ],

                    config: {
                        systemInstruction:
                            systemInstruction,

                        tools: tools
                    }

                });


                console.log(
                    `Segunda llamada a Gemini: ${Date.now() - inicioGemini2} ms`
                );

            }

        }


        // =================================================
        // RESPUESTA FINAL
        // =================================================

        console.log(
            `Tiempo total de respuesta: ${Date.now() - inicioTotal} ms`
        );


        res.json({

            reply: response.text

        });


    } catch (error) {

        console.error(
            "Error con Gemini:",
            error
        );


        console.log(
            `Tiempo hasta el error: ${Date.now() - inicioTotal} ms`
        );


        res.status(500).json({

            error:
                "No se pudo obtener una respuesta de Gemini."

        });

    }

});


module.exports = router;