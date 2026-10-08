const express = require("express");

const app = express();
app.use(express.json());

// Разрешаем запросы от нашего сайта
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://zany-pay.onrender.com"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const PORT = process.env.PORT || 10000;
const ARCADEZY_API_KEY = process.env.ARCADEZY_API_KEY;

// Проверка сервера
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Проверка игрока Mobile Legends
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

console.log("Arcadezy validation:", {
  status: response.status,
  data
});

if (!response.ok) {
  return res.status(response.status).json({
    ok: false,
    error: data.error || "Не удалось проверить игрока",
    code: data.code || "VALIDATION_ERROR"
  });
}

res.json(data);

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
