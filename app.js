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
  const packages = document.getElementById("packages");

  if (!playerId || !serverId) {
    alert("Введите ID и Server ID");
    return;
  }

  packages.innerHTML = `
    <div class="card">
      <h3>🔄 Проверяем игрока...</h3>
      <p style="color:#9ca4b9">
        Подождите немного
      </p>
    </div>
  `;

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

    console.log("Mobile Legends validation:", data);

    if (!response.ok || !data.ok || data.valid !== true) {
      packages.innerHTML = `
        <div class="card">
          <h3>❌ Игрок не найден</h3>
          <p style="color:#9ca4b9">
            ${data.error || "Проверьте ID игрока и Server ID"}
          </p>
        </div>
      `;
      return;
    }

    const playerName = data.player_name || "Без имени";
    window.currentPlayerName = playerName;
      
    packages.innerHTML = `
      <div class="card">
        <h3>✅ Игрок найден</h3>

        <p>
          Ник: <b>${playerName}</b>
        </p>

        <p style="color:#9ca4b9">
          ID: ${playerId}<br>
          Server ID: ${serverId}
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

  } catch (error) {
    console.error("Ошибка проверки игрока:", error);

    packages.innerHTML = `
      <div class="card">
        <h3>⚠️ Ошибка проверки</h3>
        <p style="color:#9ca4b9">
          Не удалось связаться с сервером. Попробуйте ещё раз.
        </p>
      </div>
    `;
  }
}

function buyProduct(name, price) {
    const playerId = document.getElementById("playerId")?.value.trim();
    const serverId = document.getElementById("serverId")?.value.trim();

    if (!playerId || !serverId) {
        alert("Сначала проверьте игрока.");
        return;
    }

    const oldModal = document.getElementById("purchaseModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "purchaseModal";

    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.65);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            z-index:9999;
        ">
            <div style="
                width:100%;
                max-width:420px;
                background:#111827;
                border:1px solid #26324d;
                border-radius:20px;
                padding:24px;
                box-sizing:border-box;
            ">
                <h2 style="margin-top:0">
                    🛒 Подтверждение покупки
                </h2>

                <div style="
                    background:#0b1020;
                    border-radius:14px;
                    padding:16px;
                    margin:16px 0;
                ">
                    <p style="margin:0 0 10px">
                        🎮 Mobile Legends
                    </p>

                    <p style="margin:6px 0">
                        👤 ID: ${playerId}
                    </p>

                    <p style="margin:6px 0">
                        🌐 Server ID: ${serverId}
                    </p>

                    <p style="margin:6px 0">
                        💎 Пакет: <b>${name}</b>
                    </p>

                    <p style="margin:6px 0">
                        💰 Цена:
                        <b>${price.toLocaleString()} сум</b>
                    </p>
                </div>

                <button
                    class="btn"
                    style="width:100%;margin-bottom:10px"
                    onclick="confirmPurchase('${name}', ${price})"
                >
                    Оплатить ${price.toLocaleString()} сум
                </button>

                <button
                    class="btn"
                    style="
                        width:100%;
                        background:#252d40;
                    "
                    onclick="closePurchaseModal()"
                >
                    Отмена
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closePurchaseModal() {
    const modal = document.getElementById("purchaseModal");

    if (modal) {
        modal.remove();
    }
}

async function confirmPurchase(name, price) {
    const playerId = document.getElementById("playerId")?.value.trim();
    const serverId = document.getElementById("serverId")?.value.trim();

    if (!playerId || !serverId) {
        alert("Сначала проверьте игрока.");
        return;
    }

    const button = document.querySelector(
        '#purchaseModal button[onclick^="confirmPurchase"]'
    );

    if (button) {
        button.disabled = true;
        button.textContent = "Оплата...";
    }

    try {
        const response = await fetch(
            "https://zany-pay-hwr9.onrender.com/api/order",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: "demo_user",
                    game: "Mobile Legends",
                    product: name,
                    price: price,
                    player_id: playerId,
                    server_id: serverId,
                    player_name: window.currentPlayerName || "Без имени"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            alert(
                data.error || "Не удалось выполнить оплату."
            );
            return;
        }

        closePurchaseModal();

        alert(
            "✅ Оплата успешно выполнена!\n\n" +
            `🎮 ${name}\n` +
            `💰 Списано: ${price.toLocaleString()} сум\n` +
            `💳 Остаток: ${data.balance.toLocaleString()} сум\n\n` +
            `🧾 Заказ: ${data.order.id}`
        );

    } catch (error) {
        console.error("Ошибка оплаты:", error);

        alert(
            "⚠️ Не удалось связаться с сервером.\n" +
            "Попробуйте ещё раз."
        );
    }
}
function topUp() {
    alert("Раздел пополнения баланса подключим следующим этапом.");
}

async function historyPage() {
    setPage(`
        <div class="page">
            <div class="header">История</div>

            <div id="historyList">
                <div class="empty">
                    🔄 Загружаем историю...
                </div>
            </div>
        </div>
    `);

    setActiveNav(2);

    try {
        const response = await fetch(
            "https://zany-pay-hwr9.onrender.com/api/orders",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: "demo_user"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Ошибка загрузки");
        }

        const historyList = document.getElementById("historyList");

        if (!data.orders || data.orders.length === 0) {
            historyList.innerHTML = `
                <div class="empty">
                    Пока нет операций
                </div>
            `;
            return;
        }

        historyList.innerHTML = data.orders
            .slice()
            .reverse()
            .map(order => `
                <div class="card">
                    <h3>🎮 ${order.game}</h3>

                    <p>
                        💎 <b>${order.product}</b>
                    </p>

                    <p>
                        👤 ${order.player_name}
                    </p>

                    <p style="color:#9ca4b9">
                        ID: ${order.player_id}<br>
                        Server ID: ${order.server_id}
                    </p>

                    <p>
                        💰 ${Number(order.price).toLocaleString()} сум
                    </p>

                    <p style="color:#4ade80">
                        ✅ Оплачено
                    </p>

                    <p style="color:#9ca4b9;font-size:13px">
                        🧾 ${order.id}
                    </p>
                </div>
            `)
            .join("");

    } catch (error) {
        console.error("Ошибка истории:", error);

        document.getElementById("historyList").innerHTML = `
            <div class="card">
                <h3>⚠️ Ошибка</h3>
                <p style="color:#9ca4b9">
                    Не удалось загрузить историю.
                </p>
            </div>
        `;
    }
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
