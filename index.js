import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;

// Verificación del webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recepción de mensajes
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message?.text?.body) {
      const from = message.from;
      const text = message.text.body.toLowerCase();

      let reply = "🤖 Bot activo";

      if (text.includes("stock blox fruits")) {
        reply = "⏳ Consultando stock... (próximo paso)";
      }

      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply }
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }
  } catch (e) {
    console.error(e);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Bot activo en puerto", PORT);
});
