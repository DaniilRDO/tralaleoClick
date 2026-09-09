// --- Конфігурація мобів ---
// Тобі легко додавати нових мобів або змінювати ім'я та шлях до картинки image
const clickPowerText = document.getElementById('clickPowerText');
const passiveIncomeText = document.getElementById('passiveIncomeText');


// Отримуємо кнопку скидання
const resetProgressBtn = document.getElementById('resetProgressBtn');

// Подія для скидання прогресу
resetProgressBtn.addEventListener('click', () => {
    // Запитаємо підтвердження, щоб гравець випадково не стер дані
    const confirmReset = confirm("Ви дійсно хочете повністю скинути весь прогрес?");
    
    if (confirmReset) {
        // Очищаємо всі збережені дані з пам'яті браузера
        localStorage.clear();
        
        // Перезавантажуємо сторінку, щоб застосувати початковий стан
        location.reload();
    }
});

const mobsConfig = [
    { name: "Моб 1", maxHp: 10, image: "clickStartImg.jpg" },
    { name: "Моб 2", maxHp: 50, image: "clickStartImg.jpg" },
    { name: "Моб 3", maxHp: 100, image: "clickStartImg.jpg" }
];

// --- Список музики ---
const musicList = [
    { id: 'tuntun', title: 'Tun Tun Tsahur', cost: 500, file: 'tuntunTsahur.mp3' },
    { id: 'family', title: 'Family Track', cost: 2000, file: 'family.mp3' },
    { id: 'freak', title: 'Freak Sound', cost: 4000, file: 'freak.ogg' }
];

// --- Збережені або початкові значення ---
let coins = parseInt(localStorage.getItem('coins')) || 0;
let clickPower = parseInt(localStorage.getItem('clickPower')) || 1;
let upgradeCost = parseInt(localStorage.getItem('upgradeCost')) || 10;

// Робота з Батрачком
let hasWorker = localStorage.getItem('hasWorker') === 'true';

// Робота з Фінгер Смерті
let fingerLevel = parseInt(localStorage.getItem('fingerLevel')) || 0; // рівень (0 - не куплено)
let fingerCost = parseInt(localStorage.getItem('fingerCost')) || 1500;
let fingerKillBonus = parseInt(localStorage.getItem('fingerKillBonus')) || 20;
let fingerKillMultiplier = parseInt(localStorage.getItem('fingerKillMultiplier')) || 1; // 2, 3, 4 при наступних покупках

// Музика
let purchasedMusic = JSON.parse(localStorage.getItem('purchasedMusic')) || [];
let currentMusicId = localStorage.getItem('currentMusicId') || null;
let hasOffMusicBtn = localStorage.getItem('hasOffMusicBtn') === 'true';
let isMusicMuted = localStorage.getItem('isMusicMuted') === 'true';

// Історії
let purchasedHatStory = localStorage.getItem('purchasedHatStory') === 'true';

// Поточний стан моба
let currentMobIndex = 0;
let currentMobHp = mobsConfig[0].maxHp;

// Кулдаун здібності
let fingerCooldownTimer = null;
let isFingerReady = true;

// --- DOM елементи ---
const coinsCountEl = document.getElementById('coinsCount');
const clickBtn = document.getElementById('clickBtn');
const clickSound = document.getElementById('clickSound');
const bgMusic = document.getElementById('bgMusic');

const mobNameEl = document.getElementById('mobName');
const hpBarFill = document.getElementById('hpBarFill');
const hpText = document.getElementById('hpText');

// Навігація та меню
const shopToggleBtn = document.getElementById('shopToggleBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const storiesToggleBtn = document.getElementById('storiesToggleBtn');

const shopMenu = document.getElementById('shopMenu');
const musicMenu = document.getElementById('musicMenu');
const storiesMenu = document.getElementById('storiesMenu');

// Кнопки покрань
const buyUpgradeBtn = document.getElementById('buyUpgradeBtn');
const upgradeCostEl = document.getElementById('upgradeCost');
const buyWorkerBtn = document.getElementById('buyWorkerBtn');
const buyFingerBtn = document.getElementById('buyFingerBtn');
const fingerCostEl = document.getElementById('fingerCost');
const fingerBonusText = document.getElementById('fingerBonusText');

// Музичні елементи
const musicListContainer = document.getElementById('musicList');
const offMusicBtn = document.getElementById('offMusicBtn');

// Елементи історій
const buyHatStoryBtn = document.getElementById('buyHatStoryBtn');
const storyModal = document.getElementById('storyModal');
const closeStoryModal = document.getElementById('closeStoryModal');
const storyTitle = document.getElementById('storyTitle');
const storyText = document.getElementById('storyText');

// Елементи здібності
const fingerAbilityBtn = document.getElementById('fingerAbilityBtn');
const fingerCooldownText = document.getElementById('fingerCooldown');

// --- Перемикання меню ---
function hideAllMenus() {
    shopMenu.classList.add('hidden');
    musicMenu.classList.add('hidden');
    storiesMenu.classList.add('hidden');
}

shopToggleBtn.addEventListener('click', () => {
    const isHidden = shopMenu.classList.contains('hidden');
    hideAllMenus();
    if (isHidden) shopMenu.classList.remove('hidden');
});

musicToggleBtn.addEventListener('click', () => {
    const isHidden = musicMenu.classList.contains('hidden');
    hideAllMenus();
    if (isHidden) musicMenu.classList.remove('hidden');
});

storiesToggleBtn.addEventListener('click', () => {
    const isHidden = storiesMenu.classList.contains('hidden');
    hideAllMenus();
    if (isHidden) storiesMenu.classList.remove('hidden');
});

// --- Функція спавну випадкового моба ---
function spawnRandomMob() {
    currentMobIndex = Math.floor(Math.random() * mobsConfig.length);
    const mob = mobsConfig[currentMobIndex];
    currentMobHp = mob.maxHp;
    
    mobNameEl.textContent = mob.name;
    clickBtn.src = mob.image;
    updateHpBar();
}

// --- Оновлення ХП ---
function updateHpBar() {
    const mob = mobsConfig[currentMobIndex];
    const percentage = Math.max(0, (currentMobHp / mob.maxHp) * 100);
    hpBarFill.style.width = percentage + '%';
    hpText.textContent = `${Math.max(0, currentMobHp)} / ${mob.maxHp}`;
}

// --- Нанесення ушкодження мобу ---
function damageMob(amount) {
    currentMobHp -= amount;
    
    // Перевірка на смерть моба
    if (currentMobHp <= 0) {
        // Додаємо бонус Фінгеру, якщо було купляно
        if (fingerLevel > 0) {
            fingerKillBonus += fingerKillMultiplier;
        }
        spawnRandomMob();
    } else {
        updateHpBar();
    }
}

// --- Оновлення UI ---
function updateUI() {
    coinsCountEl.textContent = coins;
    
    // Оновлення сили кліку та пасивного доходу
    clickPowerText.textContent = clickPower;
    
    // Розрахунок пасивного доходу на секунду (Батрачок дає 1 монету кожні 1.5 сек => 1 / 1.5 = ~0.67/сек)
    const passivePerSec = hasWorker ? (1 / 1.5).toFixed(1) : 0;
    passiveIncomeText.textContent = passivePerSec;

    upgradeCostEl.textContent = Math.floor(upgradeCost);

    // Звичайний апгрейд
    buyUpgradeBtn.disabled = coins < upgradeCost;

    // Батрачок
    if (hasWorker) {
        buyWorkerBtn.textContent = "Куплено";
        buyWorkerBtn.disabled = true;
    } else {
        buyWorkerBtn.disabled = coins < 100;
    }

    // Фінгер смерті
    fingerBonusText.textContent = fingerKillBonus;
    fingerCostEl.textContent = fingerCost;
    buyFingerBtn.disabled = coins < fingerCost;
    
    if (fingerLevel > 0) {
        fingerAbilityBtn.classList.remove('hidden');
    }

    // Off music
    if (hasOffMusicBtn) {
        offMusicBtn.textContent = isMusicMuted ? "Увімкнути музику" : "Off music (Активовано)";
        offMusicBtn.disabled = false;
    } else {
        offMusicBtn.disabled = coins < 10000;
    }

    // Історія
    if (purchasedHatStory) {
        buyHatStoryBtn.textContent = "Читати";
        buyHatStoryBtn.disabled = false;
    } else {
        buyHatStoryBtn.disabled = coins < 1000;
    }

    renderMusicMenu();
}

// --- Логіка збереження ---
function saveProgress() {
    localStorage.setItem('coins', coins);
    localStorage.setItem('clickPower', clickPower);
    localStorage.setItem('upgradeCost', upgradeCost);
    localStorage.setItem('hasWorker', hasWorker);
    localStorage.setItem('fingerLevel', fingerLevel);
    localStorage.setItem('fingerCost', fingerCost);
    localStorage.setItem('fingerKillBonus', fingerKillBonus);
    localStorage.setItem('fingerKillMultiplier', fingerKillMultiplier);
    localStorage.setItem('purchasedMusic', JSON.stringify(purchasedMusic));
    localStorage.setItem('currentMusicId', currentMusicId);
    localStorage.setItem('hasOffMusicBtn', hasOffMusicBtn);
    localStorage.setItem('isMusicMuted', isMusicMuted);
    localStorage.setItem('purchasedHatStory', purchasedHatStory);
}

// --- Подія кліку по мобу ---
clickBtn.addEventListener('click', () => {
    coins += clickPower;
    damageMob(clickPower);

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    updateUI();
    saveProgress();
});

// --- Апгрейди ---
buyUpgradeBtn.addEventListener('click', () => {
    if (coins >= upgradeCost) {
        coins -= Math.floor(upgradeCost);
        clickPower += 1;
        upgradeCost *= 1.5;
        updateUI();
        saveProgress();
    }
});

// Купівля Батрачка
buyWorkerBtn.addEventListener('click', () => {
    if (!hasWorker && coins >= 100) {
        coins -= 100;
        hasWorker = true;
        updateUI();
        saveProgress();
    }
});

// Пасивний дохід від Батрачка (кожні 1.5 сек +1 монета та -1 ХП)
setInterval(() => {
    if (hasWorker) {
        coins += 1;
        damageMob(1);
        updateUI();
        saveProgress();
    }
}, 1500);

// Купівля Фінгер Смерті
buyFingerBtn.addEventListener('click', () => {
    if (coins >= fingerCost) {
        coins -= fingerCost;
        
        if (fingerLevel === 0) {
            fingerLevel = 1;
        } else {
            fingerLevel += 1;
            fingerKillMultiplier += 1; // Наступні вбивства збільшуватимуть бонус на +2, +3, +4...
        }
        
        fingerCost *= 2; // Збільшуємо ціну наступної покупки
        updateUI();
        saveProgress();
    }
});

// Активація Здібності Фінгер Смерті
fingerAbilityBtn.addEventListener('click', () => {
    if (!isFingerReady) return;

    // Шкода = 2 * сила кліку + бонус від фінгер смерті
    const totalDamage = (2 * clickPower) + fingerKillBonus;
    coins += totalDamage;
    damageMob(totalDamage);

    // Кулдаун 10 секунд
    isFingerReady = false;
    fingerAbilityBtn.disabled = true;
    let timeLeft = 10;
    fingerCooldownText.textContent = `${timeLeft}s`;

    fingerCooldownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(fingerCooldownTimer);
            isFingerReady = true;
            fingerAbilityBtn.disabled = false;
            fingerCooldownText.textContent = "ГОТОВО";
        } else {
            fingerCooldownText.textContent = `${timeLeft}s`;
        }
    }, 1000);

    updateUI();
    saveProgress();
});

// --- Музична система ---
function renderMusicMenu() {
    musicListContainer.innerHTML = '';
    
    musicList.forEach(track => {
        const isPurchased = purchasedMusic.includes(track.id);
        const isPlaying = currentMusicId === track.id && !isMusicMuted;

        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <div class="item-info">
                <h3>${track.title} ${isPlaying ? '▶️' : ''}</h3>
                <p>Ціна: ${track.cost} мон.</p>
            </div>
            <button class="buy-btn" ${!isPurchased && coins < track.cost ? 'disabled' : ''}>
                ${isPurchased ? (isPlaying ? 'Грає' : 'Увімкнути') : 'Купити'}
            </button>
        `;

        const btn = item.querySelector('button');
        btn.addEventListener('click', () => playOrBuyMusic(track));

        musicListContainer.appendChild(item);
    });
}

function playOrBuyMusic(track) {
    if (!purchasedMusic.includes(track.id)) {
        if (coins >= track.cost) {
            coins -= track.cost;
            purchasedMusic.push(track.id);
            switchTrack(track);
        }
    } else {
        switchTrack(track);
    }
    updateUI();
    saveProgress();
}

function switchTrack(track) {
    currentMusicId = track.id;
    isMusicMuted = false;
    bgMusic.src = track.file;
    bgMusic.play().catch(() => {});
}

// Off music кнопка
offMusicBtn.addEventListener('click', () => {
    if (!hasOffMusicBtn && coins >= 10000) {
        coins -= 10000;
        hasOffMusicBtn = true;
        isMusicMuted = true;
        bgMusic.pause();
    } else if (hasOffMusicBtn) {
        isMusicMuted = !isMusicMuted;
        if (isMusicMuted) {
            bgMusic.pause();
        } else if (currentMusicId) {
            bgMusic.play().catch(() => {});
        }
    }
    updateUI();
    saveProgress();
});

// --- Меню Історій ---
buyHatStoryBtn.addEventListener('click', () => {
    if (!purchasedHatStory && coins >= 1000) {
        coins -= 1000;
        purchasedHatStory = true;
        openStoryModal();
    } else if (purchasedHatStory) {
        openStoryModal();
    }
    updateUI();
    saveProgress();
});

function openStoryModal() {
    storyTitle.textContent = "Легенда про Піратську Шляпу";
    storyText.textContent = "Колись давно, у найглибших водах піксельного океану, ходила легенда про Шляпу Старого Капітана. Кажуть, той, хто одягне її, отримає не лише захист від солоних бризок, а й нескінченний потік монет від кожного поверженого морського чудовиська. Старий капітан сховав цю шляпу в скрині, яку охороняють самі злісні моби. Тепер ця історія належить тобі!";
    storyModal.classList.remove('hidden');
}

closeStoryModal.addEventListener('click', () => {
    storyModal.classList.add('hidden');
});

// Ініціалізація гри при завантаженні
spawnRandomMob();
updateUI();

// Відновлення відтворення музики після перезавантаження
if (currentMusicId && !isMusicMuted) {
    const track = musicList.find(t => t.id === currentMusicId);
    if (track) {
        bgMusic.src = track.file;
    }
}
