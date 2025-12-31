import express from "express";

const app = express();
app.use(express.json());

// ===============================
// VARIABLES DE ENTORNO
// ===============================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// ===============================
// VERIFICACIÓN DEL WEBHOOK
// ===============================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    return res.status(200).send(challenge);
  }

  console.log("❌ Verificación fallida");
  res.sendStatus(403);
});

// ===============================
// RECEPCIÓN DE MENSAJES
// ===============================
app.post("/webhook", async (req, res) => {
  console.log("📩 Evento recibido:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || "Mensaje sin texto";
    const phoneNumberId = value.metadata.phone_number_id;

    await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: `🤖 Bot activo\n\nDijiste: ${text}` },
        }),
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err);
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
