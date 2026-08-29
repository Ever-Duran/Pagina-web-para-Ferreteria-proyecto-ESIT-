let paginaActual = 1;
let totalPaginas = 1;

// =============================
// MOSTRAR PRODUCTOS
// =============================

function mostrarProductos(productos) {

    const productGrid = document.getElementById("productGrid");

    productGrid.innerHTML = "";

    if (productos.length === 0) {

        productGrid.innerHTML = `a
            <p id="loadingMessage">
                No se encontraron productos.
            </p>
        `;

        return;
    }

    productos.forEach(producto => {

        const card = document.createElement("div");

        card.className = "product-card";

        const codigo = producto.Codigo || "No disponible";
        const nombre = producto["Nombre en pantalla"] || "Sin nombre";
        const categoria = producto["Categoría de producto"] || "Sin categoría";
        const existencia = producto["Cantidad a la mano"] || "0.00";

        const costo = parseFloat(
            producto["Costo promedio"] || 0
        ).toFixed(2);

        const imagen = `images/products/${codigo}.jpg`;

        const imagenAlternativa = `images/products/${codigo}.jpeg`;

        card.innerHTML = `

            <div class="product-image">

                <img
    src="${imagen}"
    alt="${nombre}"
    onerror="if(this.src.includes('.jpg')){this.src='${imagenAlternativa}';}else{this.onerror=null;this.src='images/no-image.jpg';}">

            </div>

            <div class="product-info">

                <h3>${nombre}</h3>

                <p><strong>Código:</strong> ${codigo}</p>

                <p><strong>Categoría:</strong> ${categoria}</p>

                <p><strong>Costo:</strong> $${costo}</p>

                <p><strong>Existencias:</strong> ${existencia}</p>

                <button class="product-button consultar-btn">
                    Consultar
                </button>

            </div>

        `;

        // =============================
        // ABRIR MODAL
        // =============================

        card.querySelector(".consultar-btn").addEventListener("click", () => {

            console.log("CLICK FUNCIONA");
            document.getElementById("modalName").textContent = nombre;
            document.getElementById("modalCode").textContent = codigo;
            document.getElementById("modalCategory").textContent = categoria;
            document.getElementById("modalPrice").textContent = costo;
            document.getElementById("modalStock").textContent = existencia;

            const img = document.getElementById("modalImage");

            img.src = imagen;

            img.onerror = function () {

        // Si no existe JPG, intenta JPEG
        if (this.src.endsWith(".jpg")) {

            this.src = `images/products/${codigo}.jpeg`;

        } else {

            // Si tampoco existe JPEG
            this.onerror = null;
            this.src = "images/no-image.jpg";

        }

    };

            document.getElementById("productModal").style.display = "flex";

        });

        productGrid.appendChild(card);

    });

}

// =============================
// CARGAR CATEGORÍAS
// =============================

async function cargarCategorias() {

    try {

        const respuesta = await fetch("/api/categories");

        if (!respuesta.ok) {

            throw new Error("No se pudieron cargar las categorías.");

        }

        const categorias = await respuesta.json();

        const filtro = document.getElementById("categoryFilter");

        filtro.innerHTML = `
            <option value="">Todas las categorías</option>
        `;

        categorias.forEach(categoria => {

            const option = document.createElement("option");

            option.value = categoria["Categoría de producto"];

            option.textContent = categoria["Categoría de producto"];

            filtro.appendChild(option);

        });

    } catch (error) {

        console.error(error);

    }

}

// =============================
// BUSCAR PRODUCTOS
// =============================

async function buscarProductos() {

    try {

        const texto = document
            .getElementById("searchInput")
            .value
            .trim();

        const categoria = document
            .getElementById("categoryFilter")
            .value;

        const respuesta = await fetch(
            `/api/products?search=${encodeURIComponent(texto)}&category=${encodeURIComponent(categoria)}&page=${paginaActual}`
        );

        if (!respuesta.ok) {

            throw new Error("Error consultando productos.");

        }

        const data = await respuesta.json();

        mostrarProductos(data.productos);

        paginaActual = data.pagina;

        totalPaginas = data.totalPaginas;

        actualizarPaginacion();

    } catch (error) {

        console.error(error);

    }

}

// =============================
// PAGINACIÓN
// =============================

function actualizarPaginacion() {

    document.getElementById("pageInfo").textContent =
        `Página ${paginaActual} de ${totalPaginas}`;

    document.getElementById("prevPage").disabled =
        paginaActual <= 1;

    document.getElementById("nextPage").disabled =
        paginaActual >= totalPaginas;

}

document.getElementById("prevPage").addEventListener("click", () => {

    if (paginaActual > 1) {

        paginaActual--;

        buscarProductos();

        

    }

});

document.getElementById("nextPage").addEventListener("click", () => {

    if (paginaActual < totalPaginas) {

        paginaActual++;

        buscarProductos();

        

    }

});

// =============================
// BUSCADOR
// =============================

document.getElementById("searchInput").addEventListener("input", () => {

    paginaActual = 1;

    buscarProductos();

});

// =============================
// FILTRO
// =============================

document.getElementById("categoryFilter").addEventListener("change", () => {

    paginaActual = 1;

    buscarProductos();

});

// =============================
// FORMULARIO
// =============================

document.getElementById("searchForm").addEventListener("submit", (e) => {

    e.preventDefault();

    paginaActual = 1;

    buscarProductos();

});

// =============================
// INICIAR
// =============================

async function iniciar() {

    await cargarCategorias();

    await buscarProductos();

}

iniciar();

// =============================
// CERRAR MODAL
// =============================

window.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("productModal");

    const closeButton = document.querySelector(".close-modal");

    closeButton.addEventListener("click", () => {

        modal.style.display = "none";

    });

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            modal.style.display = "none";

        }

    });

});
