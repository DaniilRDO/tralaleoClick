// --- СТАН ГРИ ---
let gameState = {
    coins: 0,
    totalClicks: 0,
    totalMobKills: 0,
    
    // Сила кліку
    clickUpgradeLevel: 0,
    
    // Батрачки (пасивний дохід)
    workers: 0,
    
    // Фінгер смерті
    fingerPurchasedCount: 0, // Скільки разів купляли
    fingerKills: 0,          // Скільки мобів вбито саме Фінгером
    fingerCooldownActive: false,
    
    // Апгрейди
    hasCasino: false,
    casinoCooldownActive: false,
    hasEcon: false,
    
    // Бафи
    buffs: {
        magnetLevel: 0,     // до 5 рівнів (1% - 5%)
        greedLevel: 0,      // до 50 рівнів (+1% за кожні 1000 монет)
        goldFinger: false,   // +СилаКліку*10 кожні 100 кліків
        moneyMakesMoney: false, // +0.5% за кожен купиний баф/апгрейд
        stonemason: false   // +1% сили кліку за кожні 1000 кліків
    },
    
    // Ачивки
    achievements: {
        fingerPain: false,
        fingerNoPain: false,
        capitalist: false,
        fist: false,
        slaughter: false,
        famousName: false,
        music: false,
        timeIsMoney: false,
        adhd: false
    },
    
    // Статистика для ачивок
    abilityCooldownTimeTotal: 0, // сумарний час очікування абілок в секундах
    
    // Моб
    mobMaxHp: 10,
    mobCurrentHp: 10,
    
    // Історії та музика
    unlockedHatStory: false,
    currentMusicTrack: null,
    isMusicOffPurchased: false
};

// Економіка подій
let econMultiplierPassive = 1;
let econClickBonusTemp = 1;

// Аудіо елементи
const sounds = {
    click: document.getElementById('clickSound'),
    finger: document.getElementById('fingerSound'),
    casino: document.getElementById('casinoSound'),
    realbatr: document.getElementById('realbatrSound'),
    bounty: document.getElementById('bountySound'),
    fatclick: document.getElementById('fatclickSound'),
    bg: document.getElementById('bgMusic')
};

function playSound(audioEl) {
    if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log('Audio error:', e));
    }
}

// РОЗРАХУНКОВІ ПОКАЗНИКИ
function getClickPower() {
    let base = 1 + gameState.clickUpgradeLevel;
    
    // Камінщік: +1% за кожні 1000 кліків
    if (gameState.buffs.stonemason) {
        let count1000 = Math.floor(gameState.totalClicks / 1000);
        base *= (1 + count1000 * 0.01);
    }
    
    // Гроші роблять гроші: +0.5% за кожен апгрейд та баф
    if (gameState.buffs.moneyMakesMoney) {
        let totalPurchases = gameState.clickUpgradeLevel + gameState.workers + 
                             gameState.fingerPurchasedCount + (gameState.hasCasino ? 1 : 0) + 
                             (gameState.hasEcon ? 1 : 0) + gameState.buffs.magnetLevel + 
                             gameState.buffs.greedLevel + (gameState.buffs.goldFinger ? 1 : 0) + 
                             (gameState.buffs.moneyMakesMoney ? 1 : 0) + (gameState.buffs.stonemason ? 1 : 0);
        base *= (1 + totalPurchases * 0.005);
    }
    
    // Ачивки бонуси до кліку
    let achBonus = 0;
    if (gameState.achievements.fingerPain) achBonus += 0.05;
    if (gameState.achievements.fingerNoPain) achBonus += 0.10;
    base *= (1 + achBonus);
    
    // Ачивка "Його ім'я знав кожен": Вбивство 1500 мобів збільшує силу кліку на +1
    if (gameState.achievements.famousName) {
        base += 1;
    }
    
    // Нестабільна економіка тимчасовий бонус х5
    base *= econClickBonusTemp;
    
    return Math.max(1, Math.floor(base));
}

function getFingerBonusPerKill() {
    if (gameState.fingerPurchasedCount === 0) return 0;
    return 20 + (gameState.fingerPurchasedCount - 1) * 5; // +20 перший раз, +25 при повторній покупці і т.д.
}

function getFingerTotalDamage() {
    let perKill = getFingerBonusPerKill();
    let total = gameState.fingerKills * perKill;
    
    // Ачивка: 5 пальців в кулак (+10% до сили Фінгер)
    if (gameState.achievements.fist) {
        total *= 1.10;
    }
    
    return Math.floor(total);
}

function getPassiveIncome() {
    let base = (gameState.workers * 1) / 1.5; // Батрачок
    
    // Жадібність: +1% за кожні 1000 монет на рахунку (до +50%)
    if (gameState.buffs.greedLevel > 0) {
        let thousandCoins = Math.floor(gameState.coins / 1000);
        let bonusPercent = Math.min(gameState.buffs.greedLevel * 10, thousandCoins * 0.01);
        base *= (1 + bonusPercent);
    }
    
    // Нестабільна економіка х2
    base *= econMultiplierPassive;
    
    return base.toFixed(1);
}

// ІНІЦІАЛІЗАЦІЯ І ОНОВЛЕННЯ UI
function updateUI() {
    document.getElementById('coinsCount').innerText = Math.floor(gameState.coins);
    document.getElementById('clickPowerText').innerText = getClickPower();
    document.getElementById('passiveIncomeText').innerText = getPassiveIncome();
    document.getElementById('fingerDamageText').innerText = getFingerTotalDamage();
    
    // Кнопки покращень
    let upCost = 10 * Math.pow(1.5, gameState.clickUpgradeLevel);
    document.getElementById('upgradeCost').innerText = Math.floor(upCost);
    document.getElementById('buyUpgradeBtn').disabled = gameState.coins < upCost;
    
    let wCost = 100 * Math.pow(1.3, gameState.workers);
    document.getElementById('workerCostText').innerText = Math.floor(wCost);
    document.getElementById('workerCountText').innerText = gameState.workers;
    document.getElementById('buyWorkerBtn').disabled = gameState.coins < wCost;
    
    let fCost = 1500 * Math.pow(2, gameState.fingerPurchasedCount);
    document.getElementById('fingerCost').innerText = Math.floor(fCost);
    document.getElementById('fingerBonusText').innerText = getFingerBonusPerKill() + (gameState.fingerPurchasedCount > 0 ? 5 : 0);
    document.getElementById('buyFingerBtn').disabled = gameState.coins < fCost;
    
    document.getElementById('buyCasinoBtn').disabled = gameState.hasCasino || gameState.coins < 3000;
    if (gameState.hasCasino) document.getElementById('buyCasinoBtn').innerText = 'Куплено';
    
    document.getElementById('buyEconBtn').disabled = gameState.hasEcon || gameState.coins < 5000;
    if (gameState.hasEcon) document.getElementById('buyEconBtn').innerText = 'Куплено';

    // Здібності
    if (gameState.fingerPurchasedCount > 0) {
        document.getElementById('fingerAbilityBtn').classList.remove('hidden');
    }
    if (gameState.hasCasino) {
        document.getElementById('casinoAbilityBtn').classList.remove('hidden');
    }

    // ХП Моба
    document.getElementById('hpText').innerText = `${gameState.mobCurrentHp} / ${gameState.mobMaxHp}`;
    let hpPercent = Math.max(0, (gameState.mobCurrentHp / gameState.mobMaxHp) * 100);
    document.getElementById('hpBarFill').style.width = hpPercent + '%';

    renderBuffsMenu();
    renderAchievementsMenu();
    checkAchievements();
}

// КЛІК ПО МОБУ
document.getElementById('clickBtn').addEventListener('click', () => {
    gameState.totalClicks++;
    playSound(sounds.click);
    
    let dmg = getClickPower();
    dealDamageToMob(dmg, false);
    
    // Золотий палець
    if (gameState.buffs.goldFinger && gameState.totalClicks % 100 === 0) {
        let bonus = getClickPower() * 10;
        addCoins(bonus);
    }
    
    updateUI();
});

function dealDamageToMob(dmg, isFingerKill = false) {
    gameState.mobCurrentHp -= dmg;
    if (gameState.mobCurrentHp <= 0) {
        // Моб помер
        gameState.totalMobKills++;
        if (isFingerKill) {
            gameState.fingerKills++;
        }
        
        // Резня: Вбити 100 мобів -> 10% хп моба у вигляді монет
        if (gameState.achievements.slaughter) {
            addCoins(gameState.mobMaxHp * 0.10);
        }
        
        // Новий моб
        gameState.mobMaxHp = Math.floor(10 * Math.pow(1.15, gameState.totalMobKills));
        gameState.mobCurrentHp = gameState.mobMaxHp;
    }
}

function addCoins(amount) {
    // Монетний магніт
    if (gameState.buffs.magnetLevel > 0) {
        let chance = gameState.buffs.magnetLevel * 0.01;
        if (Math.random() < chance) {
            amount *= 2;
        }
    }
    gameState.coins += amount;
}

// КУПІВЛЯ АПГРЕЙДІВ
document.getElementById('buyUpgradeBtn').addEventListener('click', () => {
    let cost = 10 * Math.pow(1.5, gameState.clickUpgradeLevel);
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.clickUpgradeLevel++;
        updateUI();
    }
});

document.getElementById('buyWorkerBtn').addEventListener('click', () => {
    let cost = 100 * Math.pow(1.3, gameState.workers);
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.workers++;
        updateUI();
    }
});

document.getElementById('buyFingerBtn').addEventListener('click', () => {
    let cost = 1500 * Math.pow(2, gameState.fingerPurchasedCount);
    if (gameState.coins >= cost) {
        gameState.coins -= cost;
        gameState.fingerPurchasedCount++;
        updateUI();
    }
});

document.getElementById('buyCasinoBtn').addEventListener('click', () => {
    if (gameState.coins >= 3000 && !gameState.hasCasino) {
        gameState.coins -= 3000;
        gameState.hasCasino = true;
        updateUI();
    }
});

document.getElementById('buyEconBtn').addEventListener('click', () => {
    if (gameState.coins >= 5000 && !gameState.hasEcon) {
        gameState.coins -= 5000;
        gameState.hasEcon = true;
        startEconEvents();
        updateUI();
    }
});

// ЗДІБНІСТЬ: ФІНГЕР СМЕРТІ
document.getElementById('fingerAbilityBtn').addEventListener('click', () => {
    if (gameState.fingerCooldownActive) return;
    
    playSound(sounds.finger);
    
    let totalDmg = getFingerTotalDamage();
    dealDamageToMob(totalDmg, true); // Наносить шкоду і якщо вбиває — зараховує як FingerKill
    
    // Кулдаун (30 сек за замовчуванням, зі скидкою від ачивки "Час це гроші" -1 сек)
    let cooldownSec = 30;
    if (gameState.achievements.timeIsMoney) cooldownSec -= 1;
    
    startCooldown('fingerAbilityBtn', 'fingerCooldown', cooldownSec, () => {
        gameState.fingerCooldownActive = false;
    });
    gameState.fingerCooldownActive = true;
    updateUI();
});

function startCooldown(btnId, textId, seconds, onComplete) {
    let btn = document.getElementById(btnId);
    let text = document.getElementById(textId);
    btn.disabled = true;
    
    let remaining = seconds;
    text.innerText = `${remaining}с`;
    
    let timer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            text.innerText = `${remaining}с`;
        } else {
            clearInterval(timer);
            btn.disabled = false;
            text.innerText = 'ГОТОВО';
            onComplete();
        }
    }, 1000);
}

// ЗДІБНІСТЬ: КАЗІНО
document.getElementById('casinoAbilityBtn').addEventListener('click', () => {
    if (gameState.casinoCooldownActive) return;
    
    document.getElementById('maxBetText').innerText = Math.floor(gameState.coins);
    document.getElementById('casinoBetInput').max = Math.floor(gameState.coins);
    document.getElementById('casinoStatus').innerText = '';
    document.getElementById('casinoSlotMachine').classList.add('hidden');
    document.getElementById('casinoModal').classList.remove('hidden');
});

document.getElementById('closeCasinoModal').addEventListener('click', () => {
    document.getElementById('casinoModal').classList.add('hidden');
});

function playCasinoBet(colorType) {
    let bet = parseInt(document.getElementById('casinoBetInput').value) || 0;
    if (bet <= 0 || bet > gameState.coins) {
        document.getElementById('casinoStatus').innerText = 'Некоректна ставка!';
        return;
    }
    
    gameState.coins -= bet;
    updateUI();
    
    playSound(sounds.casino);
    
    // Показати анімацію слотів
    let slotMachine = document.getElementById('casinoSlotMachine');
    slotMachine.classList.remove('hidden');
    document.getElementById('casinoStatus').innerText = 'Крутимо слоти...';
    
    // Заблокувати кнопки
    setCasinoButtonsDisabled(true);
    
    setTimeout(() => {
        slotMachine.classList.add('hidden');
        setCasinoButtonsDisabled(false);
        
        let win = false;
        let winAmount = 0;
        
        if (colorType === 'red' || colorType === 'black') {
            // Шанс 1 до 5 (20%)
            let roll = Math.random();
            if (roll < 0.2) {
                win = true;
                winAmount = bet * 2;
            }
        } else if (colorType === 'green') {
            // Шанс 1 до 20 (5%)
            let roll = Math.random();
            if (roll < 0.05) {
                win = true;
                winAmount = bet * 15;
            }
        }
        
        if (win) {
            gameState.coins += winAmount;
            document.getElementById('casinoStatus').innerText = `ВИГРАШ! +${winAmount} монет!`;
        } else {
            document.getElementById('casinoStatus').innerText = `Програш! Спробуй ще раз.`;
        }
        
        updateUI();
        
        // Закрити модалку через 1.5 сек та запустити кулдаун 30 сек
        setTimeout(() => {
            document.getElementById('casinoModal').classList.add('hidden');
            let cooldownSec = 30;
            if (gameState.achievements.timeIsMoney) cooldownSec -= 1;
            
            startCooldown('casinoAbilityBtn', 'casinoCooldown', cooldownSec, () => {
                gameState.casinoCooldownActive = false;
            });
            gameState.casinoCooldownActive = true;
        }, 1500);
        
    }, 3000);
}

function setCasinoButtonsDisabled(disabled) {
    document.getElementById('betRedBtn').disabled = disabled;
    document.getElementById('betBlackBtn').disabled = disabled;
    document.getElementById('betGreenBtn').disabled = disabled;
}

document.getElementById('betRedBtn').addEventListener('click', () => playCasinoBet('red'));
document.getElementById('betBlackBtn').addEventListener('click', () => playCasinoBet('black'));
document.getElementById('betGreenBtn').addEventListener('click', () => playCasinoBet('green'));

// НЕСТАБІЛЬНА ЕКОНОМІКА
function startEconEvents() {
    setInterval(() => {
        if (!gameState.hasEcon) return;
        
        let eventRoll = Math.floor(Math.random() * 3);
        let overlay = document.getElementById('eventOverlay');
        let text = document.getElementById('eventText');
        
        overlay.classList.remove('hidden');
        
        if (eventRoll === 0) {
            // х2 весь пасивний дохід на 10 сек
            text.innerText = 'РЕАЛЬНА БАТРАЧКА';
            playSound(sounds.realbatr);
            econMultiplierPassive = 2;
            setTimeout(() => {
                econMultiplierPassive = 1;
                updateUI();
            }, 10000);
        } else if (eventRoll === 1) {
            // +100*Силу Кліку монет
            text.innerText = 'БЕРИ БАУНТИ';
            playSound(sounds.bounty);
            addCoins(100 * getClickPower());
        } else {
            // х5 Сила клік на 10 сек (наприклад)
            text.innerText = 'ЖМИИИИ РОДНОЙ';
            playSound(sounds.fatclick);
            econClickBonusTemp = 5;
            setTimeout(() => {
                econClickBonusTemp = 1;
                updateUI();
            }, 10000);
        }
        
        updateUI();
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 3000);
        
    }, 60000); // Раз на хвилину
}

// МЕНЮ БАФИКІВ
const buffsConfig = [
    {
        id: 'magnet',
        title: 'Монетний магніт',
        desc: 'Кожна монета має 1% шанс принести ще одну монету (макс 5%).',
        getCost: () => 300 * Math.pow(2.5, gameState.buffs.magnetLevel),
        canBuy: () => gameState.buffs.magnetLevel < 5,
        buy: () => gameState.buffs.magnetLevel++
    },
    {
        id: 'greed',
        title: 'Жадібність',
        desc: '+1% доходу за кожні 1000 монет на рахунку (до +50%).',
        getCost: () => 1000 * Math.pow(2, gameState.buffs.greedLevel),
        canBuy: () => gameState.buffs.greedLevel < 50,
        buy: () => gameState.buffs.greedLevel++
    },
    {
        id: 'goldFinger',
        title: 'Золотий палець',
        desc: 'Кожні 100 натискань дають бонусну пачку монет (Сила кліка * 10).',
        getCost: () => 1500,
        canBuy: () => !gameState.buffs.goldFinger,
        buy: () => gameState.buffs.goldFinger = true
    },
    {
        id: 'moneyMakesMoney',
        title: 'Гроші роблять гроші',
        desc: '+0,5% за кожен купиний апгрейд та баф.',
        getCost: () => 3000,
        canBuy: () => !gameState.buffs.moneyMakesMoney,
        buy: () => gameState.buffs.moneyMakesMoney = true
    },
    {
        id: 'stonemason',
        title: 'Камінщік',
        desc: 'Кожні 1000 кліків назавжди збільшують силу кліку на +1%.',
        getCost: () => 3500,
        canBuy: () => !gameState.buffs.stonemason,
        buy: () => gameState.buffs.stonemason = true
    }
];

function renderBuffsMenu() {
    let container = document.getElementById('buffsList');
    container.innerHTML = '';
    
    buffsConfig.forEach(b => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        
        let cost = b.getCost();
        let available = b.canBuy();
        
        div.innerHTML = `
            <img src="bafftest.img" alt="Buff" class="buff-img" onerror="this.src='https://via.placeholder.com/40'">
            <div class="item-info">
                <h3>${b.title}</h3>
                <p>${b.desc}</p>
            </div>
            <button class="buy-btn" ${(!available || gameState.coins < cost) ? 'disabled' : ''}>
                ${available ? `Купити (${Math.floor(cost)} мон.)` : 'МАКС/КУПЛЕНО'}
            </button>
        `;
        
        let btn = div.querySelector('button');
        if (available) {
            btn.addEventListener('click', () => {
                if (gameState.coins >= cost) {
                    gameState.coins -= cost;
                    b.buy();
                    updateUI();
                }
            });
        }
        
        container.appendChild(div);
    });
}

// МЕНЮ АЧИВОК
const achievementsConfig = [
    { key: 'fingerPain', title: 'Палець болить', desc: 'Зробити 500 кліків (+5% до сили кліку)' },
    { key: 'fingerNoPain', title: 'Палець вже не болить', desc: 'Зробити 5000 кліків (+10% до сили кліку)' },
    { key: 'capitalist', title: 'Капіталіст/Аутист', desc: 'Накопичити 10 000 монет' },
    { key: 'fist', title: '5 пальців в кулак', desc: 'Накопичити 2000 сили Фінгер смерті (+10% до сили Фінгер)' },
    { key: 'slaughter', title: 'Резня', desc: 'Вбити 100 мобів (10% HP моба дають монети)' },
    { key: 'famousName', title: 'Його ім'я знав кожен', desc: 'Вбити 1500 мобів (Вбивство моба збільшує силу кліку на +1)' },
    { key: 'music', title: 'ТунтунтунтунтунТСАХУР', desc: 'Купити першу музику в меню музика' },
    { key: 'timeIsMoney', title: 'Час - це гроші', desc: 'Сумарно прочекати 5 хвилин перезарядки (-1с кулдауну)' },
    { key: 'adhd', title: 'СДВГ', desc: 'Сумарно прочекати 10 хвилин перезарядки (+1 монета/сек під час КД)' }
];

function checkAchievements() {
    if (!gameState.achievements.fingerPain && gameState.totalClicks >= 500) {
        gameState.achievements.fingerPain = true;
    }
    if (!gameState.achievements.fingerNoPain && gameState.totalClicks >= 5000) {
        gameState.achievements.fingerNoPain = true;
    }
    if (!gameState.achievements.capitalist && gameState.coins >= 10000) {
        gameState.achievements.capitalist = true;
    }
    if (!gameState.achievements.fist && getFingerTotalDamage() >= 2000) {
        gameState.achievements.fist = true;
    }
    if (!gameState.achievements.slaughter && gameState.totalMobKills >= 100) {
        gameState.achievements.slaughter = true;
    }
    if (!gameState.achievements.famousName && gameState.totalMobKills >= 1500) {
        gameState.achievements.famousName = true;
    }
    if (!gameState.achievements.timeIsMoney && gameState.abilityCooldownTimeTotal >= 300) {
        gameState.achievements.timeIsMoney = true;
    }
    if (!gameState.achievements.adhd && gameState.abilityCooldownTimeTotal >= 600) {
        gameState.achievements.adhd = true;
    }
}

function renderAchievementsMenu() {
    let container = document.getElementById('achievementsList');
    container.innerHTML = '';
    
    achievementsConfig.forEach(ach => {
        let isUnlocked = gameState.achievements[ach.key];
        let div = document.createElement('div');
        div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
        
        div.innerHTML = `
            <div class="achievement-header">
                <span class="achievement-title">${ach.title}</span>
                <span class="achievement-status">${isUnlocked ? 'ВИКОНАНО' : 'ЗАБЛОКОВАНО'}</span>
            </div>
            <div class="achievement-desc">${ach.desc}</div>
        `;
        
        container.appendChild(div);
    });
}

// ПЕРІОДИЧНІ СЕКУНДНІ ОНОВЛЕННЯ (Пасивний дохід + Трекінг КД абілок)
setInterval(() => {
    // Пасивний дохід
    let passive = parseFloat(getPassiveIncome());
    if (passive > 0) {
        addCoins(passive);
    }
    
    // Перевірка активності кулдаунів для ачивок "Час це гроші" та "СДВГ"
    let isAnyCooldownActive = gameState.fingerCooldownActive || gameState.casinoCooldownActive;
    if (isAnyCooldownActive) {
        gameState.abilityCooldownTimeTotal++;
        
        // СДВГ: +1 монета кожну секунду під час КД
        if (gameState.achievements.adhd) {
            addCoins(1);
        }
    }
    
    updateUI();
}, 1000);

// НАВІГАЦІЯ ТА МЕНЮ (Toggle)
function toggleMenu(menuId) {
    let menus = ['shopMenu', 'buffsMenu', 'achievementsMenu', 'musicMenu', 'storiesMenu'];
    menus.forEach(m => {
        let el = document.getElementById(m);
        if (m === menuId) {
            el.classList.toggle('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

document.getElementById('shopToggleBtn').addEventListener('click', () => toggleMenu('shopMenu'));
document.getElementById('buffsToggleBtn').addEventListener('click', () => toggleMenu('buffsMenu'));
document.getElementById('achievementsToggleBtn').addEventListener('click', () => toggleMenu('achievementsMenu'));
document.getElementById('musicToggleBtn').addEventListener('click', () => toggleMenu('musicMenu'));
document.getElementById('storiesToggleBtn').addEventListener('click', () => toggleMenu('storiesMenu'));

// МЕНЮ МУЗИКИ ВІДТВОРЕННЯ
document.getElementById('musicToggleBtn').addEventListener('click', () => {
    let musicList = document.getElementById('musicList');
    musicList.innerHTML = '';
    
    const tracks = ['track1.mp3', 'track2.mp3', 'track3.mp3'];
    tracks.forEach((tr, index) => {
        let div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="item-info">
                <h3>Музичний трек ${index + 1}</h3>
            </div>
            <button class="buy-btn">Купити (100 мон.)</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            if (gameState.coins >= 100) {
                gameState.coins -= 100;
                sounds.bg.src = tr;
                sounds.bg.play().catch(e=>console.log(e));
                gameState.achievements.music = true;
                updateUI();
            }
        });
        musicList.appendChild(div);
    });
});

// СКИДАННЯ ПРОГРЕСУ
document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (confirm('Ви впевнені, що хочете скинути весь прогрес?')) {
        localStorage.clear();
        location.reload();
    }
});

// СТАРТОВИЙ UI
updateUI();
