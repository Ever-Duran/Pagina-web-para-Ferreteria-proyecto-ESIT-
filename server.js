const express = require("express");
const path = require("path");

require("dotenv").config();

const db = require("./database/db");

const productsRoutes = require("./routes/product");
const categoriesRoutes = require("./routes/categories");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3000;

// Permite recibir JSON
app.use(express.json());

// Archivos públicos
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});