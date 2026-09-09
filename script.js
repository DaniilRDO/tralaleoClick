// --- Налаштування мобів ---
const mobsConfig = [
    { name: "Моб 1", maxHp: 10, image: "clickStartImg.jfif" },
    { name: "Моб 2", maxHp: 50, image: "clickStartImg.jfif" },
    { name: "Моб 3", maxHp: 100, image: "clickStartImg.jfif" }
];

// --- Музичний список ---
const musicList = [
    { id: 'tuntun', title: 'Tun Tun Tsahur', cost: 500, file: 'tuntunTsahur.mp3' },
    { id: 'family', title: 'Family Track', cost: 2000, file: 'family.mp3' },
    { id: 'freak', title: 'Freak Sound', cost: 4000, file: 'freak.ogg' }
];

// --- Збережені або початкові значення ---
let coins = parseInt(localStorage.getItem('coins')) || 0;
let clickPower = parseInt(localStorage.getItem('clickPower')) || 1;
let upgradeCost = parseInt(localStorage.getItem('upgradeCost')) || 10;

// Батрачок (кількість і ціна)
let workerCount = parseInt(localStorage.getItem('workerCount')) || 0;
let workerCost = parseInt(localStorage.getItem('workerCost')) || 100;

// Фінгер Смерті
let fingerLevel = parseInt(localStorage.getItem('fingerLevel')) || 0;
let fingerCost = parseInt(localStorage.getItem('fingerCost')) || 1500;
let fingerKillBonus = parseInt(localStorage.getItem('fingerKillBonus')) || 20;
let fingerKillMultiplier = parseInt(localStorage.getItem('fingerKillMultiplier')) || 1;

// Музика
let purchasedMusic = JSON.parse(localStorage.getItem('purchasedMusic')) || [];
let currentMusicId = localStorage.getItem('currentMusicId') || null;
let hasOffMusicBtn = localStorage.getItem('hasOffMusicBtn') === 'true';
let isMusicMuted = localStorage.getItem('isMusicMuted') === 'true';

// Історії
let purchasedHatStory = localStorage.getItem('purchasedHatStory') === 'true';

// Стан моба
let currentMobIndex = 0;
let currentMobHp = mobsConfig[0].maxHp;

// Стан здібності
let isFingerReady = true;
let fingerCooldownTimer = null;

// --- DOM елементи ---
const coinsCountEl = document.getElementById('coinsCount');
const clickPowerText = document.getElementById('clickPowerText');
const passiveIncomeText = document.getElementById('passiveIncomeText');

const clickBtn = document.getElementById('clickBtn');
const clickSound = document.getElementById('clickSound');
const bgMusic = document.getElementById('bgMusic');

const mobNameEl = document.getElementById('mobName');
const hpBarFill = document.getElementById('hpBarFill');
const hpText = document.getElementById('hpText');

// Навігація
const shopToggleBtn = document.getElementById('shopToggleBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const storiesToggleBtn = document.getElementById('storiesToggleBtn');
const resetProgressBtn = document.getElementById('resetProgressBtn');

const shopMenu = document.getElementById('shopMenu');
const musicMenu = document.getElementById('musicMenu');
const storiesMenu = document.getElementById('storiesMenu');

// Кнопки покрань
const buyUpgradeBtn = document.getElementById('buyUpgradeBtn');
const upgradeCostEl = document.getElementById('upgradeCost');

const buyWorkerBtn = document.getElementById('buyWorkerBtn');
const workerCountText = document.getElementById('workerCountText');
const workerCostText = document.getElementById('workerCostText');

const buyFingerBtn = document.getElementById('buyFingerBtn');
const fingerCostEl = document.getElementById('fingerCost');
const fingerBonusText = document.getElementById('fingerBonusText');

// Музичні елементи
const musicListContainer = document.getElementById('musicList');
const offMusicBtn = document.getElementById('offMusicBtn');

// Історії
const buyHatStoryBtn = document.getElementById('buyHatStoryBtn');
const storyModal = document.getElementById('storyModal');
const closeStoryModal = document.getElementById('closeStoryModal');
const storyTitle = document.getElementById('storyTitle');
const storyText = document.getElementById('storyText');

// Здібності
const fingerAbilityBtn = document.getElementById('fingerAbilityBtn');
const fingerCooldownText = document.getElementById('fingerCooldown');

// Захист від відсутності картинки
clickBtn.addEventListener('error', () => {
    // Якщо картинку clickStartImg.jfif не знайдено, ставимо тимчасову заглушку
    clickBtn.src = "https://via.placeholder.com/200/0f3460/ffffff?text=Click+Me";
});

// --- Меню ---
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

// --- Спавн та ХП ---
function spawnRandomMob() {
    currentMobIndex = Math.floor(Math.random() * mobsConfig.length);
    const mob = mobsConfig[currentMobIndex];
    currentMobHp = mob.maxHp;
    
    mobNameEl.textContent = mob.name;
    clickBtn.src = mob.image;
    updateHpBar();
}

function updateHpBar() {
    const mob = mobsConfig[currentMobIndex];
    const percentage = Math.max(0, (currentMobHp / mob.maxHp) * 100);
    hpBarFill.style.width = percentage + '%';
    hpText.textContent = `${Math.max(0, currentMobHp)} / ${mob.maxHp}`;
}

function damageMob(amount) {
    currentMobHp -= amount;
    
    if (currentMobHp <= 0) {
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
    coinsCountEl.textContent = Math.floor(coins);
    
    // Верхні показники
    clickPowerText.textContent = clickPower;
    
    // Розрахунок пасивного доходу (кожен Батрачок дає +1 кожні 1.5 сек = 0.67/сек)
    const passivePerSec = (workerCount * (1 / 1.5)).toFixed(1);
    passiveIncomeText.textContent = passivePerSec;

    // Апгрейд +1 до кліку
    upgradeCostEl.textContent = Math.floor(upgradeCost);
    buyUpgradeBtn.disabled = coins < upgradeCost;

    // Батрачок
    workerCountText.textContent = workerCount;
    workerCostText.textContent = Math.floor(workerCost);
    buyWorkerBtn.disabled = coins < workerCost;

    // Фінгер смерті
    fingerBonusText.textContent = fingerKillBonus;
    fingerCostEl.textContent = Math.floor(fingerCost);
    buyFingerBtn.disabled = coins < fingerCost;
    
    if (fingerLevel > 0) {
        fingerAbilityBtn.classList.remove('hidden');
        fingerAbilityBtn.disabled = !isFingerReady;
    }

    // Музика та історії
    if (hasOffMusicBtn) {
        offMusicBtn.textContent = isMusicMuted ? "Увімкнути музику" : "Off music (Активовано)";
        offMusicBtn.disabled = false;
    } else {
        offMusicBtn.disabled = coins < 10000;
    }

    if (purchasedHatStory) {
        buyHatStoryBtn.textContent = "Читати";
        buyHatStoryBtn.disabled = false;
    } else {
        buyHatStoryBtn.disabled = coins < 1000;
    }

    renderMusicMenu();
}

// --- Збереження ---
function saveProgress() {
    localStorage.setItem('coins', coins);
    localStorage.setItem('clickPower', clickPower);
    localStorage.setItem('upgradeCost', upgradeCost);
    
    localStorage.setItem('workerCount', workerCount);
    localStorage.setItem('workerCost', workerCost);
    
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

// --- Клік по мобу ---
clickBtn.addEventListener('click', () => {
    coins += clickPower;
    damageMob(clickPower);

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    updateUI();
    saveProgress();
});

// --- Купівлі ---
buyUpgradeBtn.addEventListener('click', () => {
    if (coins >= upgradeCost) {
        coins -= Math.floor(upgradeCost);
        clickPower += 1;
        upgradeCost *= 1.5;
        updateUI();
        saveProgress();
    }
});

// Купівля Батрачка (можна купувати багато разів)
buyWorkerBtn.addEventListener('click', () => {
    if (coins >= workerCost) {
        coins -= Math.floor(workerCost);
        workerCount += 1;
        workerCost *= 1.6; // Вартість кожного наступного зростає
        updateUI();
        saveProgress();
    }
});

// Пасивний дохід Батрачка
setInterval(() => {
    if (workerCount > 0) {
        const damage = workerCount * 1;
        coins += damage;
        damageMob(damage);
        updateUI();
        saveProgress();
    }
}, 1500);

// Купівля Фінгер Смерті
buyFingerBtn.addEventListener('click', () => {
    if (coins >= fingerCost) {
        coins -= Math.floor(fingerCost);
        
        if (fingerLevel === 0) {
            fingerLevel = 1;
        } else {
            fingerLevel += 1;
            fingerKillMultiplier += 1;
        }
        
        fingerCost *= 2;
        updateUI();
        saveProgress();
    }
});

// Активація Здібності
fingerAbilityBtn.addEventListener('click', () => {
    if (!isFingerReady || fingerLevel === 0) return;

    const totalDamage = (2 * clickPower) + fingerKillBonus;
    coins += totalDamage;
    damageMob(totalDamage);

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

// --- Музика ---
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

// --- Історії ---
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

// Скинути прогрес
resetProgressBtn.addEventListener('click', () => {
    if (confirm("Ви дійсно хочете повністю скинути весь прогрес?")) {
        localStorage.clear();
        location.reload();
    }
});

// Старт
spawnRandomMob();
updateUI();

if (currentMusicId && !isMusicMuted) {
    const track = musicList.find(t => t.id === currentMusicId);
    if (track) {
        bgMusic.src = track.file;
    }
}

// Кількість куплених Батрачків
let batrachokCount = 0;

// Пасивний прибуток за 1 Батрачка (за замовчуванням +1)
let batrachokPower = 1;

// Ціна (можна зробити динамічною, щоб вона зростала з кожною купівлею)
let batrachokCost = 10;
