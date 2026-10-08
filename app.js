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

function checkPlayer() {
  const playerId = document.getElementById("playerId").value.trim();
  const serverId = document.getElementById("serverId").value.trim();
  const packages = document.getElementById("packages");

  if (!playerId || !serverId) {
    alert("Введите ID и Server ID");
    return;
  }

  if (!/^\d+$/.test(playerId) || !/^\d+$/.test(serverId)) {
    alert("ID должен содержать только цифры");
    return;
  }

  packages.innerHTML = `
    <div class="card">
      <h3>⏳ Проверяем игрока...</h3>
      <p>ID: <b>${playerId}</b></p>
      <p>Server ID: <b>${serverId}</b></p>
    </div>
  `;

  setTimeout(() => {
    packages.innerHTML = `
      <div class="card">
        <h3>✅ Игрок найден</h3>
        <p>Ник: <b>Тестовый игрок</b></p>
        <p style="color:#9ca4b9">
          ID: ${playerId} · Server ID: ${serverId}
        </p>
      </div>

      <div class="section-title">Выберите пакет</div>

      <div class="product" onclick="buyProduct('50 алмазов', 10000)">
        <div class="product-name">💎 50 алмазов</div>
        <div class="product-info">10 000 сум</div>
      </div>

      <div class="product" onclick="buyProduct('150 алмазов', 25000)">
        <div class="product-name">💎 150 алмазов</div>
        <div class="product-info">25 000 сум</div>
      </div>

      <div class="product" onclick="buyProduct('500 алмазов', 70000)">
        <div class="product-name">💎 500 алмазов</div>
        <div class="product-info">70 000 сум</div>
      </div>
    `;
  }, 1000);
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
