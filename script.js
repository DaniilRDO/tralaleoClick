// --- Налаштування гри ---
let coins = parseInt(localStorage.getItem('coins')) || 0;
let clickPower = parseInt(localStorage.getItem('clickPower')) || 1;
let upgradeCost = parseInt(localStorage.getItem('upgradeCost')) || 10; // Початкова вартість (можна змінювати)
const costMultiplier = 1.5; // Множник зростання ціни після кожної купівлі

// --- Елементи DOM ---
const coinsCountEl = document.getElementById('coinsCount');
const clickBtn = document.getElementById('clickBtn');
const clickSound = document.getElementById('clickSound');
const shopToggleBtn = document.getElementById('shopToggleBtn');
const shopMenu = document.getElementById('shopMenu');
const buyUpgradeBtn = document.getElementById('buyUpgradeBtn');
const upgradeCostEl = document.getElementById('upgradeCost');

// --- Функція оновлення відображення ---
function updateUI() {
    coinsCountEl.textContent = coins;
    upgradeCostEl.textContent = Math.floor(upgradeCost);

    // Робимо кнопку купівлі активною, якщо достатньо монет
    if (coins >= upgradeCost) {
        buyUpgradeBtn.disabled = false;
    } else {
        buyUpgradeBtn.disabled = true;
    }
}

// --- Функція збереження в localStorage ---
function saveProgress() {
    localStorage.setItem('coins', coins);
    localStorage.setItem('clickPower', clickPower);
    localStorage.setItem('upgradeCost', upgradeCost);
}

// --- Подія кліку по головній картинці ---
clickBtn.addEventListener('click', () => {
    coins += clickPower;
    
    // Програвання звуку (скидаємо час, щоб звук міг грати при дуже частій стрільбі/кліках)
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {
        // Захист від помилок автовідтворення браузера
    });

    updateUI();
    saveProgress();
});

// --- Відкриття/закриття меню покращень ---
shopToggleBtn.addEventListener('click', () => {
    shopMenu.classList.toggle('hidden');
});

// --- Купівля покращення ---
buyUpgradeBtn.addEventListener('click', () => {
    if (coins >= upgradeCost) {
        coins -= Math.floor(upgradeCost); // Віднімаємо монети
        clickPower += 1;                  // Збільшуємо силу кліку на +1
        upgradeCost *= costMultiplier;   // Збільшуємо ціну в 1.5 рази

        updateUI();
        saveProgress();
    }
});

// Ініціалізація інтерфейсу при завантаженні сторінки
updateUI();
