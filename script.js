const ADMIN_OPEN_CODE = "david22856355";
const ADMIN_ACTION_CODE = "2285";

let xp = 0;
let level = 1;
let xpNeeded = 100;
let streak = 0;
let coins = 0;
let rebirths = 0;
let xpMultiplier = 1.0;
let inventory = [];
let activeTheme = "neon";
let lastDailyClaim = null;
let shopPurchases = 0;

const themes = ["neon", "pastel", "darkglass", "bright", "rainbow", "ocean", "sunset"];

let events = [
    { id: 1, name: "Double XP", active: false },
    { id: 2, name: "Double Coins", active: false }
];

const shopItems = [
    { id: 1, name: "Glow Border", icon: "✨", cost: 50, desc: "Fancy glow around panels.", effect: "cosmetic" },
    { id: 2, name: "Premium Theme Pack", icon: "🎨", cost: 120, desc: "Unlocks extra colorful themes.", effect: "unlockThemes" },
    { id: 3, name: "XP Boost +0.2x", icon: "⚡", cost: 150, desc: "Permanent XP multiplier boost.", effect: "xpBoost" },
    { id: 4, name: "Coin Magnet", icon: "🧲", cost: 200, desc: "Future coin bonus (visual here).", effect: "coinBoost" },
    { id: 5, name: "Inventory Slot +5", icon: "📦", cost: 80, desc: "More room for items.", effect: "inventorySlot" }
];

// At least 7 mission types
const missionTemplates = [
    { type: "click",   icon: "🖱️", text: "Click the action button {target} times", baseXP: 15, baseCoins: 5,  minTarget: 5,  maxTarget: 20 },
    { type: "hold",    icon: "⏱️", text: "Hold the button for {target} seconds",   baseXP: 25, baseCoins: 8,  minTarget: 2,  maxTarget: 5 },
    { type: "typing",  icon: "⌨️", text: "Type the secret word",                   baseXP: 30, baseCoins: 10, minTarget: 1,  maxTarget: 1 },
    { type: "reaction",icon: "⚡", text: "React within 1 second when prompted",     baseXP: 35, baseCoins: 12, minTarget: 1,  maxTarget: 1 },
    { type: "timer",   icon: "⏳", text: "Wait for {target} seconds",               baseXP: 40, baseCoins: 15, minTarget: 3,  maxTarget: 8 },
    { type: "multi",   icon: "🎮", text: "Complete {target} actions in a row",      baseXP: 45, baseCoins: 18, minTarget: 3,  maxTarget: 6 },
    { type: "tap",     icon: "👆", text: "Tap quickly {target} times",              baseXP: 20, baseCoins: 7,  minTarget: 5,  maxTarget: 15 }
];

let missions = [];

// Simple sound
function playPing(freq = 600) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch {}
}

// Mission generation
function generateRandomMission() {
    const t = missionTemplates[Math.floor(Math.random() * missionTemplates.length)];
    const target = t.minTarget === t.maxTarget
        ? t.minTarget
        : Math.floor(Math.random() * (t.maxTarget - t.minTarget + 1)) + t.minTarget;
    const text = t.text.replace("{target}", target);
    const id = Date.now() + Math.floor(Math.random() * 1000);
    let extra = "";

    if (t.type === "typing") {
        // default word
        extra = "MISSION";
    }

    return {
        id,
        text,
        rewardXP: t.baseXP + Math.floor(Math.random() * 10),
        rewardCoins: t.baseCoins + Math.floor(Math.random() * 5),
        type: t.type,
        icon: t.icon,
        target,
        progress: 0,
        completed: false,
        claimed: false,
        extraData: extra
    };
}

function initMissions() {
    missions = [];
    for (let i = 0; i < 7; i++) {
        missions.push(generateRandomMission());
    }
}

// Persistence
function loadStats() {
    xp = parseInt(localStorage.getItem("xp")) || 0;
    level = parseInt(localStorage.getItem("level")) || 1;
    xpNeeded = parseInt(localStorage.getItem("xpNeeded")) || 100;
    streak = parseInt(localStorage.getItem("streak")) || 0;
    coins = parseInt(localStorage.getItem("coins")) || 0;
    rebirths = parseInt(localStorage.getItem("rebirths")) || 0;
    xpMultiplier = parseFloat(localStorage.getItem("xpMultiplier")) || 1.0;
    activeTheme = localStorage.getItem("activeTheme") || "neon";
    inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
    lastDailyClaim = localStorage.getItem("lastDailyClaim") || null;
    shopPurchases = parseInt(localStorage.getItem("shopPurchases")) || 0;

    const storedMissions = localStorage.getItem("missions");
    if (storedMissions) {
        missions = JSON.parse(storedMissions);
    } else {
        initMissions();
    }

    applyThemeClass();
    updateUI();
    renderInventory();
    renderMissions();
    renderEventsAdmin();
}

function saveStats() {
    localStorage.setItem("xp", xp);
    localStorage.setItem("level", level);
    localStorage.setItem("xpNeeded", xpNeeded);
    localStorage.setItem("streak", streak);
    localStorage.setItem("coins", coins);
    localStorage.setItem("rebirths", rebirths);
    localStorage.setItem("xpMultiplier", xpMultiplier);
    localStorage.setItem("activeTheme", activeTheme);
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("lastDailyClaim", lastDailyClaim || "");
    localStorage.setItem("shopPurchases", shopPurchases);
    localStorage.setItem("missions", JSON.stringify(missions));
}

// UI
function updateUI() {
    document.getElementById("xp").innerText = xp;
    document.getElementById("level").innerText = level;
    document.getElementById("xpNeeded").innerText = xpNeeded;
    document.getElementById("streak").innerText = streak;
    document.getElementById("coins").innerText = coins;
    document.getElementById("rebirths").innerText = rebirths;
    document.getElementById("xpMult").innerText = xpMultiplier.toFixed(1) + "x";
    document.getElementById("activeThemeLabel").innerText = activeTheme.toUpperCase();

    const percent = Math.min(100, (xp / xpNeeded) * 100);
    document.getElementById("xpFill").style.width = percent + "%";
}

function renderMissions() {
    const container = document.getElementById("missionsContainer");
    container.innerHTML = "";
    missions.forEach(m => {
        const card = document.createElement("div");
        card.className = "mission-card";

        let progressText = "";
        if (m.type === "click") {
            progressText = `Click the action button ${m.target} times (${m.progress}/${m.target})`;
        } else if (m.type === "hold") {
            progressText = m.completed ? "Hold complete" : `Hold for ${m.target} seconds`;
        } else if (m.type === "typing") {
            const word = m.extraData || "MISSION";
            progressText = m.completed ? `Word "${word}" entered` : `Type the word: ${word}`;
        } else if (m.type === "reaction") {
            progressText = m.completed ? "Reaction done" : "React within 1 second when prompted";
        } else if (m.type === "timer") {
            progressText = m.completed ? "Timer finished" : `Wait ${m.target} seconds`;
        } else if (m.type === "multi") {
            progressText = `Complete ${m.target} actions (${m.progress}/${m.target})`;
        } else if (m.type === "tap") {
            progressText = `Tap quickly ${m.target} times (${m.progress}/${m.target})`;
        }

        card.innerHTML = `
            <div class="mission-icon">${m.icon || "🎯"}</div>
            <div class="mission-main">
                <div class="mission-header">
                    <span>${m.text}</span>
                    <span class="mission-type">${m.type}</span>
                </div>
                <div class="mission-progress">${progressText}</div>
                <div class="mission-footer">
                    <span class="reward">+${m.rewardXP} XP • +${m.rewardCoins} coins</span>
                    <div>
                        <button class="pill-btn" onclick="handleMissionAction(${m.id})">Do Action</button>
                        <button class="pill-btn accent" ${m.completed && !m.claimed ? "" : "disabled"} onclick="claimMission(${m.id})">Claim</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderInventory() {
    const container = document.getElementById("inventoryContainer");
    container.innerHTML = "";
    if (inventory.length === 0) {
        container.innerHTML = "<p>No items yet. Earn coins and buy upgrades!</p>";
        return;
    }
    inventory.forEach(item => {
        const div = document.createElement("div");
        div.className = "inventory-item";
        div.innerText = `${item.icon || "🎁"} ${item.name}`;
        container.appendChild(div);
    });
}

// XP & coins
function addXP(amount) {
    if (events.find(e => e.id === 1 && e.active)) amount *= 2;
    amount *= xpMultiplier;
    xp += Math.floor(amount);
    if (xp >= xpNeeded) {
        xp -= xpNeeded;
        level++;
        xpNeeded = Math.floor(xpNeeded * 1.3);
        playPing(900);
    } else {
        playPing(650);
    }
    saveStats();
    updateUI();
}

function addCoins(amount) {
    if (events.find(e => e.id === 2 && e.active)) amount *= 2;
    coins += Math.floor(amount);
    saveStats();
    updateUI();
}

// Mission actions
function handleMissionAction(id) {
    const m = missions.find(mi => mi.id === id);
    if (!m) return;

    if (m.type === "click") {
        m.progress++;
        if (m.progress >= m.target) {
            m.completed = true;
            showToast("Mission ready to claim!", "success");
        }
    } else if (m.type === "hold") {
        showToast("Holding...", "info");
        setTimeout(() => {
            m.completed = true;
            showToast("Hold complete! Claim reward.", "success");
            renderMissions();
            saveStats();
        }, m.target * 1000);
    } else if (m.type === "typing") {
        const word = m.extraData || "MISSION";
        const code = prompt(`Enter the word: ${word}`);
        if (code && code.toUpperCase() === word.toUpperCase()) {
            m.completed = true;
            showToast("Word correct! Claim reward.", "success");
        } else {
            showToast("Wrong word.", "error");
        }
    } else if (m.type === "reaction") {
        showToast("Get ready...", "info");
        const delay = 500 + Math.random() * 2000;
        setTimeout(() => {
            const start = Date.now();
            if (confirm("Click OK as fast as you can!")) {
                const diff = Date.now() - start;
                if (diff <= 1000) {
                    m.completed = true;
                    showToast("Nice reaction!", "success");
                } else {
                    showToast("Too slow!", "error");
                }
                renderMissions();
                saveStats();
            }
        }, delay);
    } else if (m.type === "timer") {
        showToast("Timer started...", "info");
        setTimeout(() => {
            m.completed = true;
            showToast("Timer finished! Claim reward.", "success");
            renderMissions();
            saveStats();
        }, m.target * 1000);
    } else if (m.type === "multi") {
        m.progress++;
        if (m.progress >= m.target) {
            m.completed = true;
            showToast("Multi-action mission ready to claim!", "success");
        }
    } else if (m.type === "tap") {
        m.progress++;
        if (m.progress >= m.target) {
            m.completed = true;
            showToast("Tap mission ready to claim!", "success");
        }
    }

    renderMissions();
    saveStats();
}

function claimMission(id) {
    const index = missions.findIndex(mi => mi.id === id);
    if (index === -1) return;
    const m = missions[index];
    if (!m.completed || m.claimed) return;

    m.claimed = true;
    addXP(m.rewardXP);
    addCoins(m.rewardCoins);
    showToast("Reward claimed!", "success");

    // Remove old mission and add a new one to keep 7 missions
    missions.splice(index, 1);
    missions.push(generateRandomMission());

    renderMissions();
    saveStats();
}

// Theme
function applyThemeClass() {
    document.body.className = "";
    document.body.classList.add("theme-" + activeTheme);
}

function cycleTheme() {
    const idx = themes.indexOf(activeTheme);
    activeTheme = themes[(idx + 1) % themes.length];
    applyThemeClass();
    saveStats();
    updateUI();
    playPing(750);
}

// Modal
function openModal(title, html) {
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalContent").innerHTML = html;
    document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
}

// Shop
function openShop() {
    let html = "<p>Spend coins on upgrades:</p><div class='shop-grid'>";
    shopItems.forEach(item => {
        html += `
        <div class="shop-card">
            <div class="shop-icon">${item.icon}</div>
            <div class="shop-title">${item.name}</div>
            <div class="shop-desc">${item.desc}</div>
            <div class="shop-desc">Cost: ${item.cost} coins</div>
            <button class="pill-btn accent" onclick="buyItem(${item.id})">Buy</button>
        </div>`;
    });
    html += "</div>";
    openModal("Shop", html);
}

function buyItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (!item) return;
    if (coins < item.cost) {
        openModal("Not enough coins", "<p>You need more coins to buy this.</p>");
        return;
    }
    coins -= item.cost;
    inventory.push({ id: item.id, name: item.name, effect: item.effect, icon: item.icon });
    shopPurchases++;
    applyItemEffect(item.effect);
    saveStats();
    renderInventory();
    updateUI();
    playPing(800);
    openModal("Purchased", `<p>You bought <b>${item.name}</b>!</p>`);
}

function applyItemEffect(effect) {
    if (effect === "xpBoost") {
        xpMultiplier += 0.2;
    } else if (effect === "unlockThemes") {
        showToast("Extra themes already available in this version!", "info");
    } else if (effect === "coinBoost") {
        showToast("Coin boost visual only here.", "info");
    } else if (effect === "inventorySlot") {
        showToast("More inventory space (visual).", "info");
    }
}

// Achievements
function openAchievements() {
    const badges = [
        { icon: "🥉", name: "First Steps", desc: "Complete your first mission" },
        { icon: "🥈", name: "Level 5", desc: "Reach level 5" },
        { icon: "🔥", name: "Daily Grinder", desc: "Keep a 3-day streak" },
        { icon: "💠", name: "XP Hunter", desc: "Earn 500 total XP" },
        { icon: "♻️", name: "Rebirth I", desc: "Perform your first rebirth" },
        { icon: "🛒", name: "Shopper", desc: "Buy 3 items from the shop" }
    ];
    let html = "<p>Badges (visual only for now):</p>";
    badges.forEach(b => {
        html += `<div class="inventory-item">${b.icon} <b>${b.name}</b> — ${b.desc}</div>`;
    });
    openModal("Badges", html);
}

// Daily reward
function openDailyReward() {
    const today = new Date().toDateString();
    if (lastDailyClaim === today) {
        openModal("Daily Reward", "<p>You already claimed today’s reward. Come back tomorrow!</p>");
        return;
    }
    const rewardXP = 30;
    const rewardCoins = 15;
    addXP(rewardXP);
    addCoins(rewardCoins);
    streak++;
    lastDailyClaim = today;
    saveStats();
    updateUI();
    openModal("Daily Reward", `<p>You claimed <b>${rewardXP} XP</b> and <b>${rewardCoins}</b> coins! Streak: <b>${streak}</b></p>`);
}

// Rebirth
function canRebirth() {
    return level >= 10;
}

function doRebirth() {
    if (!canRebirth()) {
        showToast("Need at least level 10 to rebirth.", "error");
        return;
    }
    rebirths++;
    xp = 0;
    level = 1;
    xpNeeded = 100;
    coins = 0;
    streak = 0;
    xpMultiplier += 0.5;
    initMissions();
    saveStats();
    updateUI();
    renderMissions();
    showToast("Rebirth complete! XP multiplier increased.", "success");
}

// Admin auth
function requireAdminOpenCode() {
    const code = prompt("Enter admin open code:");
    if (code === ADMIN_OPEN_CODE) {
        showToast("Admin unlocked.", "success");
        return true;
    }
    showToast("Wrong admin open code.", "error");
    return false;
}

function requireAdminActionCode() {
    const code = prompt("Enter admin action code:");
    if (code === ADMIN_ACTION_CODE) return true;
    showToast("Wrong admin action code.", "error");
    return false;
}

// Admin panel open/close
function toggleAdminPanel() {
    const panel = document.getElementById("adminPanel");
    const isOpen = panel.classList.contains("open");
    if (!isOpen) {
        if (!requireAdminOpenCode()) return;
        panel.classList.add("open");
        renderAdminMissions();
        renderEventsAdmin();
        showToast("Admin panel opened.", "info");
    } else {
        panel.classList.remove("open");
    }
}

function closeAdminPanel() {
    const panel = document.getElementById("adminPanel");
    panel.classList.remove("open");
}

// Admin quick actions
function adminGiveCoins(amount) {
    if (!requireAdminActionCode()) return;
    coins += amount;
    saveStats();
    updateUI();
    showToast(`Gave ${amount} coins.`, "success");
}

function adminGiveXP(amount) {
    if (!requireAdminActionCode()) return;
    addXP(amount);
    showToast(`Gave ${amount} XP.`, "success");
}

function adminGiveCoinsCustom() {
    const val = parseInt(document.getElementById("adminCoinsAmount").value || "0");
    if (val <= 0) {
        showToast("Enter a positive coins amount.", "error");
        return;
    }
    adminGiveCoins(val);
}

function adminGiveXPCustom() {
    const val = parseInt(document.getElementById("adminXPAmount").value || "0");
    if (val <= 0) {
        showToast("Enter a positive XP amount.", "error");
        return;
    }
    adminGiveXP(val);
}

function adminSetLevel(target) {
    if (!requireAdminActionCode()) return;
    level = target;
    xp = 0;
    xpNeeded = 100 * target;
    saveStats();
    updateUI();
    showToast(`Level set to ${target}.`, "info");
}

function adminResetStats() {
    if (!requireAdminActionCode()) return;
    xp = 0;
    level = 1;
    xpNeeded = 100;
    streak = 0;
    coins = 0;
    inventory = [];
    initMissions();
    saveStats();
    updateUI();
    renderInventory();
    renderMissions();
    showToast("Stats reset.", "error");
}

function adminRebirth() {
    if (!requireAdminActionCode()) return;
    doRebirth();
}

// Admin missions editor
function renderAdminMissions() {
    const container = document.getElementById("adminMissionsList");
    container.innerHTML = "";
    missions.forEach(m => {
        const div = document.createElement("div");
        div.className = "inventory-item";
        div.innerHTML = `
            ${m.icon || "🎯"} ${m.text} • ${m.rewardXP} XP • ${m.rewardCoins} coins (${m.type}, target ${m.target}${m.extraData ? ", extra: " + m.extraData : ""})
            <button class="pill-btn" onclick="adminDeleteMission(${m.id})">Delete</button>
        `;
        container.appendChild(div);
    });
}

function adminAddMission() {
    if (!requireAdminActionCode()) return;
    const text = document.getElementById("newMissionText").value;
    const xpVal = parseInt(document.getElementById("newMissionXP").value || "0");
    const coinsVal = parseInt(document.getElementById("newMissionCoins").value || "0");
    const type = document.getElementById("newMissionType").value || "custom";
    const target = parseInt(document.getElementById("newMissionTarget").value || "1");
    const extra = document.getElementById("newMissionExtra").value || "";

    if (!text) {
        showToast("Enter mission text.", "error");
        return;
    }

    const template = missionTemplates.find(t => t.type === type);
    const icon = template ? template.icon : "🎯";
    const id = Date.now() + Math.floor(Math.random() * 1000);
    missions.push({
        id,
        text,
        rewardXP: xpVal,
        rewardCoins: coinsVal,
        type,
        icon,
        target,
        progress: 0,
        completed: false,
        claimed: false,
        extraData: extra
    });
    renderMissions();
    renderAdminMissions();
    saveStats();
    showToast("Mission added.", "success");
}

function adminDeleteMission(id) {
    if (!requireAdminActionCode()) return;
    missions = missions.filter(m => m.id !== id);
    renderMissions();
    renderAdminMissions();
    saveStats();
    showToast("Mission deleted.", "info");
}

// Admin events
function renderEventsAdmin() {
    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";
    events.forEach(ev => {
        const row = document.createElement("div");
        row.className = "inventory-item";
        const label = document.createElement("span");
        label.innerText = ev.name;
        const sw = createSwitch(ev.active, state => {
            if (!requireAdminActionCode()) {
                sw.classList.toggle("on");
                return;
            }
            ev.active = state;
            showToast(ev.name + (state ? " enabled" : " disabled"), state ? "success" : "info");
        });
        row.appendChild(label);
        row.appendChild(sw);
        container.appendChild(row);
    });
}

// Init
initMissions();
loadStats();
