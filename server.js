const express = require("express");

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://zany-pay.onrender.com"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const PORT = process.env.PORT || 10000;
const ARCADEZY_API_KEY = process.env.ARCADEZY_API_KEY;

// ===============================
// ТЕСТОВЫЕ ДАННЫЕ БАЛАНСА
// ===============================

const balances = {
  demo_user: 12450
};

const orders = [];
const topups = [];

// ===============================
// HEALTH
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true
  });
});

// ===============================
// ПОЛУЧИТЬ БАЛАНС
// ===============================

app.post("/api/balance", (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      ok: false,
      error: "Не указан пользователь"
    });
  }

  const balance = balances[user_id] ?? 0;

  res.json({
    ok: true,
    balance
  });
});

// ===============================
// СОЗДАТЬ ЗАКАЗ И СПИСАТЬ БАЛАНС
// ===============================

app.post("/api/order", (req, res) => {
  try {
    const {
      user_id,
      game,
      product,
      price,
      player_id,
      server_id,
      player_name
    } = req.body;

    if (
      !user_id ||
      !game ||
      !product ||
      !price ||
      !player_id ||
      !server_id
    ) {
      return res.status(400).json({
        ok: false,
        error: "Недостаточно данных для заказа"
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Некорректная цена"
      });
    }

    const balance = balances[user_id] ?? 0;

    // Проверяем баланс
    if (balance < numericPrice) {
      return res.status(400).json({
        ok: false,
        error: "Недостаточно средств",
        balance
      });
    }

    // Списываем деньги
    balances[user_id] = balance - numericPrice;

    // Создаём заказ
    const order = {
      id: "ZP-" + Date.now(),
      user_id,
      game,
      product,
      price: numericPrice,
      player_id: String(player_id),
      server_id: String(server_id),
      player_name: player_name || "Без имени",
      status: "paid",
      created_at: new Date().toISOString()
    };

    orders.push(order);

    res.json({
      ok: true,
      message: "Оплата успешно выполнена",
      order,
      balance: balances[user_id]
    });

  } catch (error) {
    console.error("Order error:", error);

    res.status(500).json({
      ok: false,
      error: "Ошибка создания заказа"
    });
  }
});

// ===============================
// ИСТОРИЯ ЗАКАЗОВ
// ===============================

app.post("/api/orders", (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      ok: false,
      error: "Не указан пользователь"
    });
  }

  const userOrders = orders.filter(
    order => order.user_id === user_id
  );

  res.json({
    ok: true,
    orders: userOrders
  });
});

// ===============================
// ТЕСТОВОЕ ПОПОЛНЕНИЕ
// ===============================

app.post("/api/topup/test", (req, res) => {
  const { user_id, amount } = req.body;
  const numericAmount = Number(amount);

  if (!user_id || !Number.isFinite(numericAmount)) {
    return res.status(400).json({
      ok: false,
      error: "Некорректные данные"
    });
  }

  if (numericAmount < 3000) {
    return res.status(400).json({
      ok: false,
      error: "Минимальная сумма — 3 000 сум"
    });
  }

  if (balances[user_id] === undefined) {
    balances[user_id] = 0;
  }

  balances[user_id] += numericAmount;

  res.json({
    ok: true,
    message: "Тестовое пополнение успешно",
    balance: balances[user_id],
    amount: numericAmount
  });
});

// ===============================
// MOBILE LEGENDS
// ===============================

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


/* ===============================
   ARCADEZY CATALOG
================================ */

// Список категорий Arcadezy
app.get("/api/catalog", async (req, res) => {
  try {
    if (!ARCADEZY_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "ARCADEZY_API_KEY не настроен"
      });
    }

    const allowedTypes = [
      "topup",
      "giftcard",
      "gamekey",
      "telegram",
      "steam"
    ];

    const type = String(req.query.type || "topup");
    const page = Math.max(
      1,
      Math.min(10000, Number(req.query.page) || 1)
    );
    const sort = String(req.query.sort || "az");
    const q = String(req.query.q || "").slice(0, 100);

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        error: "Неизвестный тип каталога"
      });
    }

    if (!["az", "lo", "hi"].includes(sort)) {
      return res.status(400).json({
        ok: false,
        error: "Неизвестная сортировка"
      });
    }

    const params = new URLSearchParams({
      type,
      page: String(page),
      sort
    });

    if (q) params.set("q", q);

    const response = await fetch(
      `https://arcadezy.com/api/v1/categories?${params}`,
      {
        headers: {
          "X-API-Key": ARCADEZY_API_KEY
        },
        signal: AbortSignal.timeout(15000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Arcadezy catalog error:", response.status, data);

      return res.status(
        response.status >= 400 && response.status < 600
          ? response.status
          : 502
      ).json({
        ok: false,
        error: data.error || "Не удалось загрузить каталог",
        code: data.code || "ARCADEZY_ERROR"
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Catalog error:", error.message);

    return res.status(502).json({
      ok: false,
      error: "Arcadezy временно недоступен"
    });
  }
});

// Пакеты и цены выбранной категории
app.get("/api/catalog/:slug/offers", async (req, res) => {
  try {
    if (!ARCADEZY_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "ARCADEZY_API_KEY не настроен"
      });
    }

    const slug = String(req.params.slug);

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return res.status(400).json({
        ok: false,
        error: "Некорректная категория"
      });
    }

    const response = await fetch(
      `https://arcadezy.com/api/v1/categories/${encodeURIComponent(slug)}/offers`,
      {
        headers: {
          "X-API-Key": ARCADEZY_API_KEY
        },
        signal: AbortSignal.timeout(15000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Arcadezy offers error:", response.status, data);

      return res.status(response.status).json({
        ok: false,
        error: data.error || "Не удалось загрузить товары",
        code: data.code || "ARCADEZY_ERROR"
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Offers error:", error.message);

    return res.status(502).json({
      ok: false,
      error: "Не удалось получить товары Arcadezy"
    });
  }
});


// ===============================
// START
// ===============================

app.listen(PORT, () => {
  console.log(
    `ZANY PAY backend running on port ${PORT}`
  );
});
