
const API = "https://zany-pay-hwr9.onrender.com";
const USER_ID = "demo_user";

const app = document.querySelector(".app");

let catalogItems = [];
let currentGame = null;
let currentOffers = [];
let currentPlayer = null;
let catalogType = "topup";
let paymentTimerInterval = null;

const state = {
    balance: null,
    history: []
};

function money(value) {
    return Number(value || 0).toLocaleString("ru-RU") + " сум";
}

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function stopPaymentTimer() {
    if (paymentTimerInterval) {
        clearInterval(paymentTimerInterval);
        paymentTimerInterval = null;
    }
}

function setPage(content, active = "home") {
    stopPaymentTimer();

    app.innerHTML = `
        <div class="page" style="padding-bottom:100px;min-height:75vh">
            ${content}
        </div>

        <nav style="
            position:fixed;bottom:0;left:0;right:0;z-index:1000;
            display:flex;justify-content:space-around;gap:4px;
            padding:12px 5px calc(12px + env(safe-area-inset-bottom));
            background:#101522;border-top:1px solid #283047;
        ">
            ${[
                ["home","⌂","Главная"],
                ["shop","🎮","Магазин"],
                ["history","🧾","История"],
                ["profile","👤","Профиль"]
            ].map(([id, icon, label]) => `
                <button onclick="navigate('${id}')" style="
                    flex:1;border:0;border-radius:12px;padding:8px 2px;
                    background:${active === id ? "#283451" : "transparent"};
                    color:${active === id ? "#fff" : "#9ca8c0"};
                    font-size:12px;
                ">
                    <div style="font-size:21px;margin-bottom:4px">${icon}</div>
                    ${label}
                </button>
            `).join("")}
        </nav>
    `;
}

function navigate(page) {
    if (page === "home") homePage();
    if (page === "shop") shopPage();
    if (page === "history") historyPage();
    if (page === "profile") profilePage();
}

async function apiJSON(path, options = {}) {
    const response = await fetch(API + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
        throw new Error(data.error || `Ошибка сервера: ${response.status}`);
    }

    return data;
}

async function loadBalance() {
    try {
        const data = await apiJSON("/api/balance", {
            method: "POST",
            body: JSON.stringify({ user_id: USER_ID })
        });

        state.balance = Number(data.balance);
        return state.balance;
    } catch (error) {
        console.error("Ошибка баланса:", error);
        state.balance = null;
        return null;
    }
}

async function homePage() {
    setPage(`
        <header style="display:flex;justify-content:space-between;align-items:center">
            <div>
                <div style="font-size:25px;font-weight:800;letter-spacing:1px">ZANY PAY</div>
                <div style="color:#9ca8c0;font-size:13px">Игровые пополнения</div>
            </div>
            <div style="font-size:28px">⚡</div>
        </header>

        <section class="balance" style="margin-top:22px">
            <div class="balance-title">Ваш баланс</div>
            <div class="balance-value" id="homeBalance">🔄 Загрузка...</div>
            <button class="btn" onclick="topUp()" style="width:100%;margin-top:14px">
                + Пополнить баланс
            </button>
        </section>

        <div class="section-title" style="margin-top:28px">Быстрый доступ</div>

        <div class="categories">
            <button class="category" onclick="openCatalogType('topup')">🎮<span>Игры</span></button>
        </div>

        <div class="section-title" style="margin-top:25px">Магазин</div>
        <div class="card">
            <p>Ищи игру, выбери предложение и проверь данные аккаунта, если поставщик поддерживает такую проверку.</p>
            <button class="btn" style="width:100%" onclick="shopPage()">Открыть каталог →</button>
        </div>
    `, "home");

    const balance = await loadBalance();
    const element = document.getElementById("homeBalance");

    if (element) {
        element.textContent = balance === null
            ? "Не удалось загрузить баланс"
            : money(balance);
    }
}

function openCatalogType(type) {
    catalogType = type;
    shopPage();
}

async function shopPage() {
    setPage(`
        <button class="back" onclick="homePage()">← На главную</button>
        <div class="header">Магазин</div>

        <input id="catalogSearch" class="input"
            placeholder="🔎 Поиск игры или услуги..."
            oninput="filterCatalog()">

        <div class="categories" style="margin:15px 0">
            <button class="category" onclick="changeCatalogType('topup')">🎮<span>Игры</span></button>
        </div>

        <div id="catalogStatus" class="card">🔄 Загружаем каталог...</div>
        <div id="catalogList"></div>

        <button class="btn" onclick="loadCatalog()" style="width:100%;margin-top:12px">
            Обновить каталог
        </button>
    `, "shop");

    await loadCatalog();
}

function changeCatalogType(type) {
    catalogType = type;
    shopPage();
}

async function loadCatalog() {
    const status = document.getElementById("catalogStatus");
    const list = document.getElementById("catalogList");
    if (!status || !list) return;

    status.textContent = "🔄 Загружаем каталог Arcadezy...";
    list.innerHTML = "";

    try {
        const data = await apiJSON(
            `/api/catalog?type=${encodeURIComponent(catalogType)}&page=1&sort=az`
        );

        catalogItems = data.items || data.categories || data.results || [];
        status.textContent = catalogItems.length
    ? `Найдено: ${data.total ?? catalogItems.length}. Выберите игру.`
    : "Каталог поставщика пуст.";

filterCatalog();


function filterCatalog() {
    const list = document.getElementById("catalogList");
    const search = document.getElementById("catalogSearch");
    if (!list || !search) return;

    const games = [
        {
            names: ["mobile legends", "mobile-legends", "mlbb"],
            title: "Mobile Legends: Bang Bang",
            icon: "⚔️"
        },
        {
            names: ["free fire", "free-fire"],
            title: "Free Fire",
            icon: "🔥"
        },
        {
            names: ["pubg mobile", "pubg-mobile"],
            title: "PUBG Mobile",
            icon: "🎯"
        },
        {
            names: ["genshin impact", "genshin-impact"],
            title: "Genshin Impact",
            icon: "✨"
        },
        {
            names: ["fc mobile", "fc-mobile", "fifa mobile", "fifa-mobile"],
            title: "FC Mobile",
            icon: "⚽"
        },
        {
            names: ["magic chess", "magic-chess"],
            title: "Magic Chess",
            icon: "♟️"
        }
    ];

    const normalize = value =>
        String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const query = normalize(search.value);

    const filtered = games.map(game => {
        const item = catalogItems.find(product => {
            const fields = [
                product.name,
                product.title,
                product.slug
            ].map(normalize);

            return game.names.some(term =>
                fields.some(field => field.includes(normalize(term)))
            );
        });

        return item ? { ...item, _displayTitle: game.title, _gameIcon: game.icon } : null;
    }).filter(Boolean).filter(item =>
        !query || normalize(item._displayTitle).includes(query)
    );

    window.visibleCatalogItems = filtered;

    if (!filtered.length) {
        list.style.display = "block";
        list.innerHTML =
            '<div class="card">Не все выбранные игры найдены в каталоге поставщика. Проверим доступные названия.</div>';
        return;
    }

    list.style.display = "grid";
    list.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
    list.style.gap = "14px";

    list.innerHTML = filtered.map((item, index) => {
        const image = item.image_url || item.image || item.logo || item.icon;
        const price = item.from_price_usd;

        return `
            <button class="product"
                onclick="openCatalogProduct(${index})"
                style="
                    min-width:0;
                    min-height:220px;
                    padding:16px;
                    text-align:left;
                    border:1px solid #292d43;
                    border-radius:24px;
                    background:#151b2d;
                    color:#f4f5fb;
                    display:flex;
                    flex-direction:column;
                    align-items:flex-start;
                    gap:12px;
                ">
                ${
                    image
                    ? `<img src="${safe(image)}" alt=""
                        style="width:76px;height:76px;object-fit:cover;border-radius:18px"
                        onerror="this.style.display='none'">`
                    : `<div style="width:76px;height:76px;border-radius:18px;background:#252b42;display:flex;align-items:center;justify-content:center;font-size:38px">${item._gameIcon}</div>`
                }
                <div style="font-size:16px;font-weight:700;line-height:1.3">
                    ${safe(item._displayTitle)}
                </div>
                <div style="margin-top:auto;color:#9ca8c0;font-size:13px">
                    ${price != null ? "От $" + safe(price) : "Посмотреть цены"}
                </div>
            </button>
        `;
    }).join("");
            }


async function openCatalogProduct(index) {
    const item = window.visibleCatalogItems?.[index];
    if (!item || !item.slug) {
        alert("У товара отсутствует идентификатор поставщика.");
        return;
    }

    currentGame = item;
    currentPlayer = null;

    setPage(`
        <button class="back" onclick="shopPage()">← Назад</button>
        <div class="header">${safe(item.name || item.slug)}</div>
        <div class="card" id="offersStatus">🔄 Загружаем предложения...</div>
        <div id="offersList"></div>
    `, "shop");

    try {
        const data = await apiJSON(
            `/api/catalog/${encodeURIComponent(item.slug)}/offers`
        );

        currentOffers = data.offers || data.items || data.results || data.data || [];

        const status = document.getElementById("offersStatus");
        const list = document.getElementById("offersList");
        if (!status || !list) return;

        if (!currentOffers.length) {
            status.textContent = "Предложения не найдены. Возможно, формат ответа API отличается.";
            return;
        }

        status.textContent = "Выбери предложение:";

        list.innerHTML = currentOffers.map((offer, offerIndex) => {
            const name = offer.name || offer.title || offer.product_name || offer.slug || "Товар";
            const price = offer.price ?? offer.price_usd ?? offer.amount;

            return `
                <button class="product" style="width:100%;text-align:left"
                    onclick="selectOffer(${offerIndex})">
                    <div class="product-name">${safe(name)}</div>
                    <div class="product-info">
                        ${price != null ? "$" + safe(price) : "Цена уточняется"}
                    </div>
                </button>
            `;
        }).join("");
    } catch (error) {
        const status = document.getElementById("offersStatus");
        if (status) status.textContent = "Не удалось загрузить предложения: " + error.message;
    }
}

function selectOffer(index) {
    const offer = currentOffers[index];
    if (!offer) return;

    const fields = offer.required_fields || offer.fields || offer.inputs || [];
    const hasValidation = Boolean(
        offer.validation_supported ||
        offer.validate_id ||
        offer.validation_endpoint ||
        currentGame?.validation_supported
    );

    if (!Array.isArray(fields) || fields.length === 0) {
        setPage(`
            <button class="back" onclick="openCatalogProduct(${window.visibleCatalogItems?.indexOf(currentGame) ?? 0})">← Назад</button>
            <div class="header">${safe(offer.name || offer.title || "Товар")}</div>
            <div class="card">
                <p>Для этого предложения поставщик не вернул список обязательных полей.</p>
                <p>Не вводи данные аккаунта, пока мы не подтвердим, какие поля действительно нужны.</p>
            </div>
        `, "shop");
        return;
    }

    if (!hasValidation) {
        showRequiredFields(offer, fields, false);
        return;
    }

    showRequiredFields(offer, fields, true);
}

function showRequiredFields(offer, fields, hasValidation) {
    window.selectedOffer = offer;
    window.selectedOfferFields = fields;

    setPage(`
        <button class="back" onclick="openCatalogProduct(${window.visibleCatalogItems?.indexOf(currentGame) ?? 0})">← Назад</button>
        <div class="header">${safe(offer.name || offer.title || "Товар")}</div>

        <div class="card">
            <h3>Данные аккаунта</h3>
            ${fields.map((field, index) => {
                const key = typeof field === "string"
                    ? field
                    : (field.name || field.key || field.id || `field_${index}`);

                const label = typeof field === "string"
                    ? field
                    : (field.label || field.title || field.placeholder || key);

                return `
                    <label style="display:block;margin:12px 0 6px">${safe(label)}</label>
                    <input class="input" id="accountField${index}"
                        data-field-key="${safe(key)}"
                        placeholder="${safe(field.placeholder || label)}"
                        ${field.required === false ? "" : "required"}>
                `;
            }).join("")}

            <button class="btn" style="width:100%;margin-top:15px"
                onclick="${hasValidation ? "validateGenericAccount()" : "saveAccountFields()"}">
                ${hasValidation ? "Проверить аккаунт" : "Продолжить"}
            </button>
        </div>

        <div id="accountResult"></div>
    `, "shop");
}

function readAccountFields() {
    const fields = window.selectedOfferFields || [];
    const result = {};

    fields.forEach((field, index) => {
        const input = document.getElementById(`accountField${index}`);
        if (!input) return;

        const key = input.dataset.fieldKey;
        result[key] = input.value.trim();
    });

    return result;
}

function saveAccountFields() {
    const values = readAccountFields();
    if (Object.values(values).some(value => !value)) {
        alert("Заполни все обязательные поля.");
        return;
    }

    currentPlayer = { values, validated: false };

    const result = document.getElementById("accountResult");
    if (result) {
        result.innerHTML = `
            <div class="card">
                <p>Данные заполнены, но автоматическая проверка для этого предложения не подтверждена.</p>
                <p>Перед покупкой необходимо проверить поддержку валидации у поставщика.</p>
            </div>
        `;
    }
}

async function validateGenericAccount() {
    const values = readAccountFields();
    if (Object.values(values).some(value => !value)) {
        alert("Заполни все обязательные поля.");
        return;
    }

    const result = document.getElementById("accountResult");
    if (result) result.innerHTML = `<div class="card">🔄 Проверяем данные...</div>`;

    try {
        const data = await apiJSON(
            `/api/catalog/${encodeURIComponent(currentGame.slug)}/validate-id`,
            {
                method: "POST",
                body: JSON.stringify({
                    offer: window.selectedOffer,
                    fields: values
                })
            }
        );

        if (!data.valid) {
            throw new Error(data.error || "Поставщик не подтвердил аккаунт.");
        }

        currentPlayer = {
            values,
            validated: true,
            playerName: data.player_name || data.nickname || null
        };

        if (result) {
            result.innerHTML = `
                <div class="card">
                    <h3>✅ Данные подтверждены</h3>
                    ${currentPlayer.playerName
                        ? `<p>Ник: <b>${safe(currentPlayer.playerName)}</b></p>`
                        : "<p>Поставщик подтвердил данные.</p>"}
                    <p>Проверка успешна, но это ещё не означает, что покупка оплачена.</p>
                </div>
            `;
        }
    } catch (error) {
        if (result) {
            result.innerHTML = `<div class="card">❌ Проверка не пройдена: ${safe(error.message)}</div>`;
        }
    }
}

async function topUp() {
    setPage(`
        <button class="back" onclick="homePage()">← Назад</button>
        <div class="header">Пополнение баланса</div>

        <div class="section-title">Выбери сумму</div>
        <div class="categories">
            ${[10000,25000,50000,100000,200000].map(amount => `
                <button class="category" onclick="paymentInstructionPage(${amount})">
                    <span>${money(amount)}</span>
                </button>
            `).join("")}
        </div>

        <div class="section-title" style="margin-top:20px">Своя сумма</div>
        <input id="customTopUpAmount" class="input" type="number"
            min="3000" placeholder="Минимум 3 000 сум">
        <button class="btn" style="width:100%;margin-top:12px"
            onclick="customTopUp()">Продолжить</button>

        <div class="card" style="margin-top:15px">
            <p>Пополнение будет зачислено только после фактического подтверждения платежа.</p>
        </div>
    `, "home");
}

function customTopUp() {
    const amount = Number(document.getElementById("customTopUpAmount")?.value);
    if (!Number.isSafeInteger(amount) || amount < 3000) {
        alert("Введи целую сумму не меньше 3 000 сум.");
        return;
    }

    paymentInstructionPage(amount);
}

function paymentInstructionPage(amount) {
    setPage(`
        <button class="back" onclick="topUp()">← Назад</button>
        <div class="header">Инструкция по оплате</div>

        <div class="balance" style="margin-top:20px">
            <div class="balance-title">Сумма</div>
            <div class="balance-value">${money(amount)}</div>
        </div>

        <div class="card">
            <p>Перед оплатой необходимо настроить и подтвердить платёжный канал.</p>
            <p>Номер карты, имя получателя и платёжные реквизиты должны быть настоящими и проверенными.</p>
            <p>В этой версии платежи автоматически не подтверждаются.</p>
        </div>

        <div class="card">
            <div>⏱️ Демонстрационный таймер</div>
            <div id="paymentTimer" style="font-size:30px;font-weight:bold;margin:12px 0">05:00</div>
            <p style="color:#9ca8c0">Таймер сам по себе не подтверждает оплату.</p>
        </div>

        <button class="btn" style="width:100%" onclick="paymentWaitingPage(${amount})">
            Я совершил перевод
        </button>
        <button class="btn" style="width:100%;margin-top:10px" onclick="topUp()">
            Отмена
        </button>
    `, "home");

    let remaining = 300;
    const timer = document.getElementById("paymentTimer");

    paymentTimerInterval = setInterval(() => {
        if (!timer) {
            stopPaymentTimer();
            return;
        }

        remaining--;
        timer.textContent = remaining <= 0
            ? "Время истекло"
            : `${String(Math.floor(remaining / 60)).padStart(2,"0")}:${String(remaining % 60).padStart(2,"0")}`;

        if (remaining <= 0) stopPaymentTimer();
    }, 1000);
}

async function loadBalance() {
    try {
        const response = await fetch(
            "https://zany-pay-hwr9.onrender.com/api/balance",
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
            throw new Error(data.error || "Ошибка загрузки баланса");
        }

        window.currentBalance = data.balance;

        return data.balance;

    } catch (error) {
        console.error("Ошибка загрузки баланса:", error);
        return null;
    }
}

function selectTopUpAmount(amount) {
    if (amount < 3000) {
        alert("Минимальная сумма пополнения — 3 000 сум");
        return;
    }

    paymentMethodPage(amount);
}

function selectCustomTopUpAmount() {
    const input = document.getElementById("customTopUpAmount");
    const amount = Number(input.value);

    if (!amount || amount < 3000) {
        alert("Минимальная сумма пополнения — 3 000 сум");
        return;
    }

    paymentMethodPage(amount);
}

function paymentMethodPage(amount) {
    setPage(`
        <div class="page">
            <div class="header">Способ оплаты</div>

            <div class="section-title">
                Пополнение на ${amount.toLocaleString()} сум
            </div>

            <button
                class="category"
                onclick="cardPaymentPage(${amount})"
                style="
                    width:100%;
                    margin-top:15px;
                    text-align:left;
                "
            >
                💳
                <span>По карте</span>
            </button>

            <button
                class="btn"
                onclick="topUp()"
                style="margin-top:20px;"
            >
                Назад
            </button>
        </div>
    `);
}

function cardPaymentPage(amount) {
    setPage(`
        <div class="page">
            <div class="header">Выберите карту</div>

            <div class="section-title">
                Пополнение на ${amount.toLocaleString()} сум
            </div>

            <div style="margin-top:20px;">

                <button
                    class="category"
                    onclick="paymentInstructionPage(${amount}, '8600 **** **** 1234')"
                    style="
                        width:100%;
                        text-align:left;
                        margin-bottom:12px;
                    "
                >
                    💳
                    <span>
                        Uzcard<br>
                        <small>8600 **** **** 1234</small>
                    </span>
                </button>

                <button
                    class="category"
                    onclick="paymentInstructionPage(${amount}, '9860 **** **** 5678')"
                    style="
                        width:100%;
                        text-align:left;
                    "
                >
                    💳
                    <span>
                        Humo<br>
                        <small>9860 **** **** 5678</small>
                    </span>
                </button>

            </div>

            <button
                class="btn"
                onclick="paymentMethodPage(${amount})"
                style="margin-top:20px;"
            >
                Назад
            </button>
        </div>
    `);
}

function paymentInstructionPage(amount, cardNumber) {
    setPage(`
        <div class="page">
            <div class="header">Инструкция по оплате</div>

            <div class="balance" style="margin-top:20px;">
                <div class="balance-title">Сумма оплаты</div>

                <div class="balance-value">
                    ${amount.toLocaleString()} сум
                </div>
            </div>

            <div class="section-title">Переведите точную сумму</div>

            <div style="
                margin-top:15px;
                padding:18px;
                border-radius:14px;
                background:#1c1c1e;
            ">
                <div style="margin-bottom:12px;">
                    💳 Карта
                </div>

                <div style="
                    font-size:18px;
                    font-weight:bold;
                    letter-spacing:1px;
                ">
                    ${cardNumber}
                </div>

                <div style="
                    margin-top:12px;
                    color:#aaa;
                ">
                    Получатель: ZANY PAY
                </div>
            </div>

            <div style="
                margin-top:20px;
                padding:15px;
                border-radius:12px;
                background:#1c1c1e;
                text-align:center;
            ">
                ⏱️ Ожидание оплаты
                <div
                    id="paymentTimer"
                    style="
                        font-size:28px;
                        font-weight:bold;
                        margin-top:8px;
                    "
                >
                    05:00
                </div>
            </div>

            <button
                class="btn"
                onclick="paymentWaitingPage(${amount})"
                style="margin-top:20px;"
            >
                Оплатил, жду
            </button>

            <button
                class="btn"
                onclick="topUp()"
                style="margin-top:10px;"
            >
                Отмена
            </button>
        </div>
    `);

    startPaymentTimer(300);
}

function startPaymentTimer(seconds) {
    if (window.paymentTimerInterval) {
        clearInterval(window.paymentTimerInterval);
    }

    let remaining = seconds;

    window.paymentTimerInterval = setInterval(() => {
        const timer = document.getElementById("paymentTimer");

        if (!timer) {
            clearInterval(window.paymentTimerInterval);
            return;
        }

        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;

        timer.textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(secs).padStart(2, "0");

        if (remaining <= 0) {
            clearInterval(window.paymentTimerInterval);
            timer.textContent = "Время истекло";
        }

        remaining--;
    }, 1000);
}

async function paymentWaitingPage(amount) {
    if (window.paymentTimerInterval) {
        clearInterval(window.paymentTimerInterval);
    }

    setPage(`
        <div class="page">
            <div class="header">Проверка оплаты</div>

            <div class="balance" style="margin-top:30px;">
                <div style="font-size:45px;">⏳</div>

                <div class="balance-title" style="margin-top:15px;">
                    Проверяем оплату
                </div>

                <div id="paymentStatus" style="
                    margin-top:12px;
                    color:#aaa;
                    line-height:1.5;
                ">
                    Проверяем тестовый платеж...
                </div>
            </div>
        </div>
    `);

    try {
        const response = await fetch(
            "https://zany-pay-hwr9.onrender.com/api/topup/test",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: "demo_user",
                    amount: amount
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error || "Не удалось подтвердить оплату"
            );
        }

        window.currentBalance = data.balance;

        setPage(`
            <div class="page">
                <div class="header">Пополнение</div>

                <div class="balance" style="margin-top:30px;">
                    <div style="font-size:45px;">✅</div>

                    <div class="balance-title" style="margin-top:15px;">
                        Оплата подтверждена
                    </div>

                    <div style="
                        margin-top:12px;
                        color:#aaa;
                        line-height:1.5;
                    ">
                        Баланс пополнен на
                        <br>
                        <strong>
                            ${amount.toLocaleString()} сум
                        </strong>
                    </div>

                    <div style="
                        margin-top:15px;
                        font-size:22px;
                        font-weight:bold;
                    ">
                        ${data.balance.toLocaleString()} сум
                    </div>
                </div>

                <button
                    class="btn"
                    onclick="homePage()"
                    style="margin-top:25px;"
                >
                    На главную
                </button>
            </div>
        `);

    } catch (error) {
        console.error("Ошибка пополнения:", error);

        setPage(`
            <div class="page">
                <div class="header">Пополнение</div>

                <div class="balance" style="margin-top:30px;">
                    <div style="font-size:45px;">❌</div>

                    <div class="balance-title" style="margin-top:15px;">
                        Ошибка проверки
                    </div>

                    <div style="
                        margin-top:12px;
                        color:#aaa;
                    ">
                        ${error.message}
                    </div>
                </div>

                <button
                    class="btn"
                    onclick="homePage()"
                    style="margin-top:25px;"
                >
                    На главную
                </button>
            </div>
        `);
    }
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

async function profilePage() {
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
                <p id="profileBalance">🔄 Загрузка...</p>
            </div>
        </div>
    `);

    setActiveNav(3);

    const balance = await loadBalance();

    const balanceElement =
        document.getElementById("profileBalance");

    if (balanceElement) {
        balanceElement.textContent =
            balance !== null
                ? `${balance.toLocaleString()} сум`
                : "Не удалось загрузить баланс";
    }
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
homePage();
