import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ===============================
// VARIABLES DE ENTORNO
// ===============================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// ===============================
// RUTA DE VERIFICACIÓN (OBLIGATORIA)
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Falló verificación del webhook");
    res.sendStatus(403);
  }
});

// ===============================
// RECEPCIÓN DE MENSAJES
// ===============================
app.post("/webhook", async (req, res) => {
  console.log("📩 Evento recibido:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body || "Mensaje recibido";

    // ===============================
    // RESPUESTA AUTOMÁTICA
    // ===============================
    await fetch(
      `https://graph.facebook.com/v22.0/${value.metadata.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: `🤖 Bot activo\n\nRecibí: "${text}"` },
        }),
      }
    );

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
    res.sendStatus(500);
  }
});

// ===============================
// SERVIDOR
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Bot escuchando en puerto ${PORT}`);
});
