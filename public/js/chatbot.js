// =====================================================
// HISTORIAL DE CONVERSACIÓN
// =====================================================

const historial = [];


// =====================================================
// BOTÓN DEL CHAT
// =====================================================

const chatButton = document.createElement("button");

chatButton.id = "chat-button";

chatButton.innerHTML = "💬";

chatButton.title = "Chat con Ferretería Alex";

document.body.appendChild(chatButton);


// =====================================================
// VENTANA DEL CHAT
// =====================================================

const chatWindow = document.createElement("div");

chatWindow.id = "chat-window";

chatWindow.innerHTML = `
    <div class="chat-header">
        <span>🤖 Ferretería Alex</span>
        <button id="chat-close">×</button>
    </div>

    <div id="chat-messages">
        <div class="bot-message">
            ¡Hola! 👋 Bienvenido a Ferretería Alex.
            ¿En qué puedo ayudarte?
        </div>
    </div>

    <div class="chat-input-container">
        <input
            type="text"
            id="chat-input"
            placeholder="Escribe tu pregunta..."
        />

        <button id="chat-send">
            ➤
        </button>
    </div>
`;

document.body.appendChild(chatWindow);


// =====================================================
// ABRIR CHAT
// =====================================================

chatButton.addEventListener("click", () => {

    chatWindow.classList.add("open");

    document.getElementById("chat-input").focus();

});


// =====================================================
// CERRAR CHAT
// =====================================================

document.getElementById("chat-close").addEventListener("click", () => {

    chatWindow.classList.remove("open");

});


// =====================================================
// ENVIAR MENSAJE
// =====================================================

async function enviarMensaje() {

    const input = document.getElementById("chat-input");

    const message = input.value.trim();

    if (!message) return;


    // Mostrar mensaje del usuario

    agregarMensaje(message, "user");

    input.value = "";


    // Guardar mensaje en el historial

    historial.push({
        role: "user",
        content: message
    });


    // Mostrar mensaje temporal

    const loading = agregarMensaje(
        "Escribiendo...",
        "bot"
    );


    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            // Enviar mensaje + historial

            body: JSON.stringify({
                message: message,
                historial: historial
            })

        });


        const data = await response.json();


        loading.remove();


        // =================================================
        // RESPUESTA DE GEMINI
        // =================================================

        if (data.reply) {

            agregarMensaje(
                data.reply,
                "bot"
            );


            // Guardar respuesta de Gemini

            historial.push({
                role: "model",
                content: data.reply
            });


        } else {

            agregarMensaje(
                "Lo siento, ocurrió un error.",
                "bot"
            );

        }


    } catch (error) {

        console.error(error);

        loading.remove();

        agregarMensaje(
            "No pude conectarme con el servidor.",
            "bot"
        );

    }

}


// =====================================================
// CREAR MENSAJES
// =====================================================

function agregarMensaje(texto, tipo) {

    const messages =
        document.getElementById("chat-messages");


    const messageElement =
        document.createElement("div");


    messageElement.classList.add(
        tipo === "user"
            ? "user-message"
            : "bot-message"
    );


    messageElement.textContent = texto;


    messages.appendChild(messageElement);


    messages.scrollTop =
        messages.scrollHeight;


    return messageElement;

}


// =====================================================
// BOTÓN ENVIAR
// =====================================================

document.getElementById("chat-send")
    .addEventListener(
        "click",
        enviarMensaje
    );


// =====================================================
// ENTER PARA ENVIAR
// =====================================================

document.getElementById("chat-input")
    .addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                enviarMensaje();

            }

        }
    );