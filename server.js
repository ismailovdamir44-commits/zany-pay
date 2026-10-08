const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const ARCADEZY_API_KEY = process.env.ARCADEZY_API_KEY;

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/mobile-legends/validate", async (req, res) => {
  try {
    const { player_id, server_id } = req.body;

    if (!player_id || !server_id) {
      return res.status(400).json({
        ok: false,
        error: "Введите ID и Server ID"
      });
    }

    if (!ARCADEZY_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "API ключ сервера не настроен"
      });
    }

    const response = await fetch(
      "https://arcadezy.com/api/v1/categories/mobile-legends-global/validate-id",
      {
        method: "POST",
        headers: {
          "X-API-Key": ARCADEZY_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            player_id: String(player_id),
            server_id: String(server_id)
          }
        })
      }
    );

    const data = await response.json();

    res.status(response.status).json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: "Ошибка проверки игрока"
    });
  }
});

app.listen(PORT, () => {
  console.log(`ZANY PAY backend running on port ${PORT}`);
});
