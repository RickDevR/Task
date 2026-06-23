const ADMIN_CODE = "david22856355";

function login() {
    const input = document.getElementById("adminCode").value;
    if (input === ADMIN_CODE) {
        document.getElementById("loginView").classList.add("hidden");
        document.getElementById("dashboardView").classList.remove("hidden");
        showToast("Welcome, admin.", "success");
        renderAdminMissions();
        renderAdminBadges();
        renderEvents();
    } else {
        showToast("Wrong admin code.", "error");
    }
}

function goBack() {
    window.location.href = "index.html";
}

// Simple in-memory copies (you can sync with localStorage or server later)
let adminMissions = [
    { id: 1, text: "Click the glowing button 10 times", rewardXP: 20, rewardCoins: 5, type: "click" },
    { id: 2, text: "Hold the button for 3 seconds", rewardXP: 30, rewardCoins: 8, type: "hold" }
];

let adminBadges = [
    { id: 1, name: "First Steps", description: "Complete your first mission" },
    { id: 2, name: "Level 5", description: "Reach level 5" }
];

let events = [
    { id: 1, name: "Double XP Weekend", active: false },
    { id: 2, name: "Limited Missions Event", active: false }
];

function showTab(name) {
    ["missions", "badges", "themes", "events"].forEach(tab => {
        document.getElementById("tab-" + tab).classList.add("hidden");
    });
    document.getElementById("tab-" + name).classList.remove("hidden");
}

// Missions editor
function renderAdminMissions() {
    const container = document.getElementById("adminMissionsList");
    container.innerHTML = "";
    adminMissions.forEach(m => {
        const div = document.createElement("div");
        div.className = "admin-list-item";
        div.innerHTML = `
            <span>${m.text} • ${m.rewardXP} XP • ${m.rewardCoins} coins (${m.type})</span>
            <button class="pill-btn" onclick="deleteMission(${m.id})">Delete</button>
        `;
        container.appendChild(div);
    });
}

function addMission() {
    const text = document.getElementById("newMissionText").value;
    const xp = parseInt(document.getElementById("newMissionXP").value || "0");
    const coins = parseInt(document.getElementById("newMissionCoins").value || "0");
    const type = document.getElementById("newMissionType").value || "custom";

    if (!text) {
        showToast("Enter mission text.", "error");
        return;
    }

    const id = adminMissions.length ? adminMissions[adminMissions.length - 1].id + 1 : 1;
    adminMissions.push({ id, text, rewardXP: xp, rewardCoins: coins, type });
    renderAdminMissions();
    showToast("Mission added.", "success");
}

function deleteMission(id) {
    adminMissions = adminMissions.filter(m => m.id !== id);
    renderAdminMissions();
    showToast("Mission deleted.", "info");
}

// Badges
function renderAdminBadges() {
    const container = document.getElementById("adminBadgesList");
    container.innerHTML = "";
    adminBadges.forEach(b => {
        const div = document.createElement("div");
        div.className = "admin-list-item";
        div.innerText = `${b.name} — ${b.description}`;
        container.appendChild(div);
    });
}

// Events
function renderEvents() {
    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";
    events.forEach(ev => {
        const row = document.createElement("div");
        row.className = "admin-list-item";
        const label = document.createElement("span");
        label.innerText = ev.name;
        const sw = createSwitch(ev.active, state => {
            ev.active = state;
            showToast(ev.name + (state ? " enabled" : " disabled"), state ? "success" : "info");
        });
        row.appendChild(label);
        row.appendChild(sw);
        container.appendChild(row);
    });
}
