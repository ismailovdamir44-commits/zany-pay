const app = document.querySelector(".app");

function setPage(content) {
    app.innerHTML = content;
}

function homePage() {
    setPage(`
        <div class="page">
            <div class="header">ZANY PAY</div>

            <div class="balance">
                <div class="balance-title">Ваш баланс</div>
                <div class="balance-value">0 сум</div>
                <button class="btn" onclick="topUp()">＋ Пополнить</button>
            </div>

            <div class="section-title">Магазин</div>

            <div class="categories">
                <button class="category" onclick="shopPage()">
                    🎮
                    <span>Игры</span>
                </button>

                <button class="category" onclick="shopPage()">
                    🎁
                    <span>Подарочные карты</span>
                </button>

                <button class="category" onclick="shopPage()">
                    🎟️
                    <span>Подписки</span>
                </button>

                <button class="category" onclick="shopPage()">
                    •••
                    <span>Прочее</span>
                </button>
            </div>

            <div class="section-title">Популярные товары</div>

            <div class="product" onclick="productPage('Mobile Legends')">
                <div class="product-name">Mobile Legends</div>
                <div class="product-info">Алмазы</div>
            </div>

            <div class="product" onclick="productPage('Free Fire')">
                <div class="product-name">Free Fire</div>
                <div class="product-info">Алмазы</div>
            </div>

            <div class="product" onclick="productPage('Telegram Stars')">
                <div class="product-name">Telegram Stars</div>
                <div class="product-info">Звёзды Telegram</div>
            </div>

            <div class="product" onclick="productPage('Telegram Premium')">
                <div class="product-name">Telegram Premium</div>
                <div class="product-info">Подписка</div>
            </div>
        </div>
    `);

    setActiveNav(0);
}

function shopPage() {
    setPage(`
        <div class="page">
            <button class="back" onclick="homePage()">← Назад</button>

            <div class="header">Магазин</div>

            <div class="product" onclick="productPage('Mobile Legends')">
                <div class="product-name">🎮 Mobile Legends</div>
                <div class="product-info">Алмазы</div>
            </div>

            <div class="product" onclick="productPage('Free Fire')">
                <div class="product-name">🔥 Free Fire</div>
                <div class="product-info">Алмазы</div>
            </div>

            <div class="product" onclick="productPage('Telegram Stars')">
                <div class="product-name">⭐ Telegram Stars</div>
                <div class="product-info">Звёзды</div>
            </div>

            <div class="product" onclick="productPage('Telegram Premium')">
                <div class="product-name">💎 Telegram Premium</div>
                <div class="product-info">Подписка</div>
            </div>
        </div>
    `);

    setActiveNav(1);
}

function productPage(product) {
    setPage(`
        <div class="page">
            <button class="back" onclick="shopPage()">← Назад</button>

            <div class="header">${product}</div>

            <div class="card">
                <h3>Данные аккаунта</h3>

                <input
                    class="input"
                    id="playerId"
                    placeholder="Введите ID"
                >

                <input
                    class="input"
                    id="serverId"
                    placeholder="Введите Server ID"
                >

                <button class="btn" onclick="checkPlayer()">
                    Проверить
                </button>
            </div>

            <div id="packages"></div>
        </div>
    `);
}

async function checkPlayer() {
  const playerId = document.getElementById("playerId").value.trim();
  const serverId = document.getElementById("serverId").value.trim();
  const result = document.getElementById("playerResult");

  if (!playerId || !serverId) {
    result.innerHTML = "❌ Введите ID игрока и Server ID";
    return;
  }

  result.innerHTML = "⏳ Проверяем игрока...";

  try {
    const response = await fetch(
      "https://zany-pay-hwr9.onrender.com/api/mobile-legends/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          player_id: playerId,
          server_id: serverId
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.valid) {
      result.innerHTML = `
        <div style="color:#42d392;">
          ✅ Игрок найден
        </div>
        <div style="margin-top:6px;">
          Ник: <b>${data.player_name || "Не указан"}</b>
        </div>
      `;

      showPackages();
    } else {
      result.innerHTML = `
        <div style="color:#ff5c5c;">
          ❌ Игрок не найден
        </div>
        <div style="margin-top:6px;">
          ${data.error || "Проверьте ID и Server ID"}
        </div>
      `;
    }

  } catch (error) {
    console.error(error);

    result.innerHTML = `
      <div style="color:#ff5c5c;">
        ❌ Ошибка соединения с сервером
      </div>
    `;
  }
}

function buyProduct(name, price) {
    alert(
        `Товар: ${name}\n` +
        `Цена: ${price.toLocaleString()} сум\n\n` +
        `Следующим этапом подключим оплату с баланса.`
    );
}

function topUp() {
    alert("Раздел пополнения баланса подключим следующим этапом.");
}

function historyPage() {
    setPage(`
        <div class="page">
            <div class="header">История</div>

            <div class="empty">
                Пока нет операций
            </div>
        </div>
    `);

    setActiveNav(2);
}

function profilePage() {
    setPage(`
        <div class="page">
            <div class="header">Профиль</div>

            <div class="card">
                <h3>👤 Пользователь</h3>
                <p style="color:#9ca4b9">
                    Telegram ID будет подключён автоматически.
                </p>
            </div>

            <div class="card">
                <h3>💰 Баланс</h3>
                <p>0 сум</p>
            </div>
        </div>
    `);

    setActiveNav(3);
}

function setActiveNav(index) {
    document.querySelectorAll(".nav-btn").forEach((button, i) => {
        button.classList.toggle("active", i === index);
    });
}

function createNavigation() {
    const nav = document.createElement("div");

    nav.className = "bottom-nav";

    nav.innerHTML = `
        <button class="nav-btn active" onclick="homePage()">
            🏠<br>Главная
        </button>

        <button class="nav-btn" onclick="shopPage()">
            🛒<br>Магазин
        </button>

        <button class="nav-btn" onclick="historyPage()">
            📋<br>История
        </button>

        <button class="nav-btn" onclick="profilePage()">
            👤<br>Профиль
        </button>
    `;

    document.body.appendChild(nav);
}

createNavigation();
homePage();
