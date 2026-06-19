// Global variables
const API_BASE = ""; // Relative paths will resolve to same host in production
let appSummary = {
    baseline: 550,
    target: 400,
    monthly_savings: 0,
    current_estimate: 400,
    total_logged_emissions: 0,
    logged_count: 0
};

// Activity types configuration
const ACTIVITY_TYPES = {
    transport: [
        { value: "petrol_car", label: "Petrol Car" },
        { value: "diesel_car", label: "Diesel Car" },
        { value: "hybrid_car", label: "Hybrid Car" },
        { value: "electric_vehicle", label: "Electric Vehicle" },
        { value: "motorcycle", label: "Motorcycle" },
        { value: "bus", label: "Bus / Coach" },
        { value: "train", label: "Train" },
        { value: "flight_short", label: "Short-haul Flight (<1500km)" },
        { value: "flight_long", label: "Long-haul Flight (>1500km)" }
    ],
    energy: [
        { value: "electricity_grid", label: "Grid Electricity" },
        { value: "natural_gas", label: "Natural Gas" },
        { value: "heating_oil", label: "Heating Oil" },
        { value: "coal", label: "Coal" },
        { value: "renewable", label: "Renewable Energy Source" }
    ],
    food: [
        { value: "heavy_meat", label: "Heavy Meat-eater meal" },
        { value: "average_mixed", label: "Average Mixed Diet meal" },
        { value: "vegetarian", label: "Vegetarian meal" },
        { value: "vegan", label: "Vegan meal" }
    ],
    waste: [
        { value: "landfill", label: "Landfill Garbage" },
        { value: "recycling", label: "Recyclable sorting" },
        { value: "composting", label: "Compostable organic waste" }
    ],
    consumption: [
        { value: "clothing", label: "Clothing / Apparel" },
        { value: "electronics", label: "New Electronics Device" },
        { value: "furniture", label: "Furniture / Housewares" }
    ]
};

// Unit Labels for Logger Input
const UNIT_LABELS = {
    transport: "Distance Traveled (km):",
    energy: "Utility Usage (kWh):",
    food: "Log Duration (Days):",
    waste: "Waste Weight (kg):",
    consumption: "Quantity (Items):"
};

// Input placeholders
const PLACEHOLDERS = {
    transport: "e.g. 45",
    energy: "e.g. 120",
    food: "e.g. 1 (typically 1 day)",
    waste: "e.g. 5",
    consumption: "e.g. 2"
};

// Elements
const logCategorySelect = document.getElementById("log-category");
const logTypeSelect = document.getElementById("log-type");
const logAmountInput = document.getElementById("log-amount");
const logAmountLabel = document.getElementById("log-amount-label");
const logNotesInput = document.getElementById("log-notes");

const calculatorForm = document.getElementById("calculator-form");
const calcBreakdown = document.getElementById("calc-breakdown");
const calcBarChart = document.getElementById("calc-bar-chart");
const useAsBaselineBtn = document.getElementById("use-as-baseline-btn");

const baseGoalInput = document.getElementById("base-goal-input");
const targetGoalInput = document.getElementById("target-goal-input");
const saveGoalsBtn = document.getElementById("save-goals-btn");

const currentFootprintVal = document.getElementById("current-footprint-value");
    const progressCircleBar = document.getElementById("progress-circle-bar");
    // XP bar elements
    const xpBarFill = document.getElementById("xp-bar-fill");
    const userXpVal = document.getElementById("user-xp-val");
    const userLevelVal = document.getElementById("user-level-val");
const progressPercentageLabel = document.getElementById("progress-percentage-label");

const metricSavings = document.getElementById("metric-savings");
const metricLogged = document.getElementById("metric-logged");
const metricLogCount = document.getElementById("metric-log-count");
const metricTarget = document.getElementById("metric-target");

const recentLogsList = document.getElementById("recent-logs-list");
const adoptedHabitsList = document.getElementById("adopted-habits-list");
const recommendedTipsList = document.getElementById("recommended-tips-list");

// Temporary holder for calculator result
let lastCalculatorTotal = 0;

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
    setupCategoryHandler();
    loadDashboard();
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }

    // Initialize 3D Earth
    init3DEarth();
    
    // Fetch AI and Community
    fetchAIAndCommunity();

    // Theme Toggle Logic
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            themeToggle.innerHTML = newTheme === "light" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    }

    // Form submissions
    calculatorForm.addEventListener("submit", handleCalculate);
    document.getElementById("activity-logger-form").addEventListener("submit", handleAddLog);
    saveGoalsBtn.addEventListener("click", handleSaveGoals);
    useAsBaselineBtn.addEventListener("click", handleUseCalculatorAsBaseline);

    // Setup slider real-time value updates
    const sliders = document.querySelectorAll('.premium-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valSpan = document.getElementById('val-' + e.target.id);
            if (valSpan) valSpan.textContent = e.target.value;
        });
    });
});

// Dynamic options update in logging form
function setupCategoryHandler() {
    const updateOptions = () => {
        const cat = logCategorySelect.value;
        logTypeSelect.innerHTML = "";
        
        // Add options
        (ACTIVITY_TYPES[cat] || []).forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.value;
            opt.textContent = item.label;
            logTypeSelect.appendChild(opt);
        });

        // Update units label and placeholders
        logAmountLabel.textContent = UNIT_LABELS[cat] || "Amount:";
        logAmountInput.value = "0";
        const logValSpan = document.getElementById('val-log-amount');
        if (logValSpan) logValSpan.textContent = "0";
        
        // Adjust max slider range based on category
        if (cat === "food") { logAmountInput.max = "30"; }
        else if (cat === "waste") { logAmountInput.max = "100"; }
        else if (cat === "consumption") { logAmountInput.max = "10"; }
        else { logAmountInput.max = "1000"; }
    };

    logCategorySelect.addEventListener("change", updateOptions);
    updateOptions(); // Initial load
}

// Load data from Backend API
async function loadDashboard() {
    try {
        await Promise.all([
            fetchSummary(),
            fetchLogs(),
            fetchTipsAndActions()
        ]);
    } catch (err) {
        console.error("Error loading dashboard data:", err);
    }
}

// Fetch dashboard analytical summary
async function fetchSummary() {
    const res = await fetch(`${API_BASE}/api/summary`);
    // Parse summary including XP, level, achievements
    if (!res.ok) throw new Error("Failed to fetch dashboard summary");
    appSummary = await res.json();
    // After receiving summary, render additional premium UI components
    renderDoughnutChart(appSummary.category_distribution);
    renderBadges(appSummary.achievements);
    updateXPBar(appSummary.xp, appSummary.level);
    updateLevelInfo(appSummary.level);
    updateBadgeCount(appSummary.achievements.length);
    maybeShowLevelUpToast(appSummary.xp, appSummary.level);
    // Render Carbon Score card
    renderCarbonScore(appSummary);
    updateUIElements();
    renderDoughnutChart(appSummary.category_distribution);
    renderBadges(appSummary.achievements);
    updateXPBar(appSummary.xp, appSummary.level);
    updateLevelInfo(appSummary.level);
    updateBadgeCount(appSummary.achievements.length);
    maybeShowLevelUpToast(appSummary.xp, appSummary.level);
    updateUIElements();
}

// Fetch daily logs list
async function fetchLogs() {
    const res = await fetch(`${API_BASE}/api/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    const logs = await res.json();
    renderLogs(logs);
}

// Fetch recommended tips and adopted actions
async function fetchTipsAndActions() {
    const [tipsRes, actionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/tips`),
        fetch(`${API_BASE}/api/actions`)
    ]);

    if (!tipsRes.ok || !actionsRes.ok) throw new Error("Failed to fetch habits and tips");
    
    const tips = await tipsRes.json();
    const actions = await actionsRes.json();
    
    renderHabitsAndTips(tips, actions);
}

// Update dashboard metrics and charts
function updateUIElements() {
    // Basic metric updates handled separately; this retains existing functionality.
    // No changes needed here for premium features.
    // Basic values
    currentFootprintVal.textContent = appSummary.current_estimate.toFixed(1);
    metricSavings.textContent = `${appSummary.monthly_savings.toFixed(1)} kg`;
    metricLogged.textContent = `${appSummary.total_logged_emissions.toFixed(1)} kg`;
    metricLogCount.textContent = appSummary.logged_count;
    metricTarget.textContent = `${appSummary.target.toFixed(1)} kg`;
    
    baseGoalInput.value = appSummary.baseline;
    targetGoalInput.value = appSummary.target;

    // Radial progress circle math
    const radius = 54;
    const circumference = 2 * Math.PI * radius; // 339.292
    
    // Ratio of current footprint to the target limit
    const pct = Math.min(appSummary.current_estimate / appSummary.target, 1.5); // cap representation at 150% visual
    const offset = circumference - (pct * circumference);
    
    if (progressCircleBar) {
        progressCircleBar.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircleBar.style.strokeDashoffset = isNaN(offset) ? circumference : offset;
        
        // Color circle bar if over limit
        if (appSummary.current_estimate > appSummary.target) {
            progressCircleBar.style.stroke = "var(--red)";
        } else {
            progressCircleBar.style.stroke = "var(--mint)";
        }
    }
    
    const pctLabelVal = Math.round(pct * 100);
    if (progressPercentageLabel) {
        progressPercentageLabel.textContent = `${pctLabelVal}% of monthly target reached`;
    }
    
    // XP & Level UI updates
    if (xpBarFill && userXpVal && userLevelVal) {
        const xpProgress = appSummary.xp % 100;
        const level = appSummary.level;
        const xpPercent = (xpProgress / 100) * 100;
        xpBarFill.style.width = `${xpPercent}%`;
        userXpVal.textContent = appSummary.xp;
        userLevelVal.textContent = level;
    }

}

// Render dynamic activity list
function renderLogs(logs) {
    recentLogsList.innerHTML = "";
    if (logs.length === 0) {
        recentLogsList.innerHTML = `<div class="log-item" style="color: var(--text-muted); justify-content: center;">No activities logged yet.</div>`;
        return;
    }

    logs.forEach(log => {
        const item = document.createElement("div");
        item.className = "log-item";
        
        // Find label
        const list = ACTIVITY_TYPES[log.category] || [];
        const match = list.find(l => l.value === log.activity_type);
        const name = match ? match.label : log.activity_type;

        item.innerHTML = `
            <div class="log-details">
                <span class="log-meta">${name}</span>
                <span class="log-sub">${log.amount} ${getUnitSuffix(log.category)} &bull; ${log.date} ${log.notes ? `&bull; "${log.notes}"` : ''}</span>
            </div>
            <div class="log-value-tag">
                <span class="log-emissions">+${log.emissions_kg} kg</span>
                <button class="log-delete-btn" onclick="handleDeleteLog(${log.id})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        recentLogsList.appendChild(item);
    });
}

function getUnitSuffix(cat) {
    if (cat === "transport") return "km";
    if (cat === "energy") return "kWh";
    if (cat === "food") return "days";
    if (cat === "waste") return "kg";
    return "pcs";
}

// Render available tips and current commitments
function renderHabitsAndTips(tips, adopted) {
    adoptedHabitsList.innerHTML = "";
    recommendedTipsList.innerHTML = "";

    const adoptedKeys = new Set(adopted.map(a => a.action_key));

    // Adopted list
    if (adopted.length === 0) {
        adoptedHabitsList.innerHTML = `<div class="habit-card" style="color: var(--text-muted); justify-content: center; border-left: none;">Adopt a habit below to reduce footprint!</div>`;
    } else {
        adopted.forEach(hab => {
            const matchedTip = tips.find(t => t.key === hab.action_key) || {};
            const card = document.createElement("div");
            card.className = "habit-card";
            card.innerHTML = `
                <div class="card-content">
                    <span class="card-title">${hab.title}</span>
                    <span class="card-desc">${matchedTip.description || "Active green habit"}</span>
                    <div class="card-badge-row">
                        <span class="badge-saving">-${hab.monthly_saving_kg} kg CO2e / mo</span>
                    </div>
                </div>
                <button class="card-remove-btn" onclick="handleRemoveAction('${hab.action_key}')" title="Stop Habit">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            adoptedHabitsList.appendChild(card);
        });
    }

    // Recommendation Deck
    const availableTips = tips.filter(t => !adoptedKeys.has(t.key));
    if (availableTips.length === 0) {
        recommendedTipsList.innerHTML = `<div class="tip-card" style="color: var(--text-muted); justify-content: center;">Fantastic! You've adopted all available green habits!</div>`;
    } else {
        availableTips.forEach(tip => {
            const card = document.createElement("div");
            card.className = "tip-card";
            card.innerHTML = `
                <div class="card-content">
                    <span class="card-title">${tip.title}</span>
                    <span class="card-desc">${tip.description}</span>
                    <div class="card-badge-row">
                        <span class="badge-saving">-${tip.monthly_saving_kg} kg/mo</span>
                        <span class="badge-difficulty">${tip.difficulty}</span>
                    </div>
                </div>
                <button class="card-action-btn" onclick="handleAdoptAction('${tip.key}')">Commit</button>
            `;
            recommendedTipsList.appendChild(card);
        });
    }
}

// API: Calculate footprint from form
async function handleCalculate(e) {
    e.preventDefault();

    const carKm = parseFloat(document.getElementById("calc-car-km").value) || 0;
    const carType = document.getElementById("calc-car-type").value;
    const publicKm = parseFloat(document.getElementById("calc-public-km").value) || 0;
    const flights = parseFloat(document.getElementById("calc-flights").value) || 0;
    const elec = parseFloat(document.getElementById("calc-elec").value) || 0;
    const gas = parseFloat(document.getElementById("calc-gas").value) || 0;
    const diet = document.getElementById("calc-diet").value;
    const waste = parseFloat(document.getElementById("calc-waste").value) || 0;

    const payload = {
        transport: [
            { type: carType, km: carKm },
            { type: "train", km: publicKm },
            { type: "flight_long", km: flights }
        ],
        energy: [
            { source: "electricity_grid", kwh: elec },
            { source: "natural_gas", kwh: gas }
        ],
        diet: diet,
        waste: [
            { type: "landfill", kg: waste * 4.3 } // scale weekly waste to monthly
        ],
        consumption: []
    };

    try {
        const res = await fetch(`${API_BASE}/api/calculate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Calculation request failed");
        const results = await res.json();
        lastCalculatorTotal = results.total;
        
        renderCalcCharts(results);
    } catch (err) {
        alert("Could not compute carbon calculations: " + err.message);
    }
}

// Render calculator bar chart breakdown
function renderCalcCharts(res) {
    calcBreakdown.classList.remove("hidden");
    calcBarChart.innerHTML = "";

    const categories = [
        { key: "transport", label: "Transportation", val: res.transport, fillClass: "fill-transport" },
        { key: "energy", label: "Utilities / Energy", val: res.energy, fillClass: "fill-energy" },
        { key: "diet", label: "Diet & Food", val: res.diet, fillClass: "fill-diet" },
        { key: "waste", label: "Waste", val: res.waste, fillClass: "fill-waste" },
        { key: "consumption", label: "Shopping", val: res.consumption, fillClass: "fill-consumption" }
    ];

    const maxVal = Math.max(...categories.map(c => c.val), 1);

    categories.forEach(c => {
        const row = document.createElement("div");
        row.className = "chart-row";
        
        const pctWidth = (c.val / maxVal) * 100;
        
        row.innerHTML = `
            <div class="chart-label-row">
                <span>${c.label}</span>
                <strong>${c.val.toFixed(1)} kg</strong>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill ${c.fillClass}" style="width: 0%"></div>
            </div>
        `;
        calcBarChart.appendChild(row);
        
        // Trigger animation
        setTimeout(() => {
            row.querySelector(".chart-bar-fill").style.width = `${pctWidth}%`;
        }, 50);
    });

    // Add a final summary line
    const totalDiv = document.createElement("div");
    totalDiv.style.textAlign = "right";
    totalDiv.style.marginTop = "10px";
    totalDiv.style.fontSize = "0.95rem";
    totalDiv.innerHTML = `Total Footprint Estimate: <strong style="color: var(--mint);">${res.total.toFixed(1)} kg/month</strong>`;
    calcBarChart.appendChild(totalDiv);
}

// API: Save custom User goals
async function handleSaveGoals() {
    const base = parseFloat(baseGoalInput.value) || 550;
    const tgt = parseFloat(targetGoalInput.value) || 400;

    try {
        const res = await fetch(`${API_BASE}/api/goals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseline: base, target: tgt })
        });
        if (!res.ok) throw new Error("Could not update goals");
        
        // Reload dashboard
        await fetchSummary();
        alert("Target and baseline goals saved successfully!");
    } catch (err) {
        alert("Failed to save goals: " + err.message);
    }
}

// Set calculator total output as user baseline
async function handleUseCalculatorAsBaseline() {
    if (lastCalculatorTotal <= 0) return;
    const currentTarget = parseFloat(targetGoalInput.value) || 400;
    const roundedBaseline = Math.round(lastCalculatorTotal);

    try {
        const res = await fetch(`${API_BASE}/api/goals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseline: roundedBaseline, target: currentTarget })
        });
        if (!res.ok) throw new Error("Could not update baseline");
        
        await fetchSummary();
        alert(`Set baseline successfully to ${roundedBaseline} kg/month!`);
    } catch (err) {
        alert("Failed to apply baseline: " + err.message);
    }
}

// API: Log a daily activity
async function handleAddLog(e) {
    e.preventDefault();

    const category = logCategorySelect.value;
    const type = logTypeSelect.value;
    const amount = parseFloat(logAmountInput.value) || 0;
    const notes = logNotesInput.value;

    const payload = {
        category: category,
        activity_type: type,
        amount: amount,
        notes: notes || null
    };

    try {
        const res = await fetch(`${API_BASE}/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed logging activity");
        
        // Clear log values
        logAmountInput.value = "";
        logNotesInput.value = "";
        
        // Refresh views
        await loadDashboard();
    } catch (err) {
        alert("Error logging entry: " + err.message);
    }
}

// API: Delete a logged activity
async function handleDeleteLog(id) {
    if (!confirm("Are you sure you want to delete this activity log?")) return;

    try {
        const res = await fetch(`${API_BASE}/api/logs/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Could not delete log");
        
        await loadDashboard();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

// API: Commit to a green habit
async function handleAdoptAction(key) {
    try {
        const res = await fetch(`${API_BASE}/api/actions/${key}`, {
            method: "POST"
        });
        if (!res.ok) throw new Error("Habit action could not be adopted");
        
        await loadDashboard();
    } catch (err) {
        alert("Could not adopt action: " + err.message);
    }
}

// API: Cancel a green habit commitment
async function handleRemoveAction(key) {
    try {
        const res = await fetch(`${API_BASE}/api/actions/${key}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Habit action could not be removed");
        
        await loadDashboard();
    } catch (err) {
        alert("Could not remove habit: " + err.message);
    }
}
// ------------------- Additional UI Functions -------------------
// Global previous level tracker for toast notifications
let previousLevel = null;

// Mapping of level numbers to titles (example mapping)
const LEVEL_TITLES = {
    1: "Eco Seedling",
    2: "Green Sprout",
    3: "Carbon Champion",
    4: "Sustainability Sage",
    5: "Eco Warrior"
};

/**
 * Render the emissions distribution doughnut chart using Chart.js.
 * @param {Object} distribution - Category distribution object {transport, energy, food, waste, consumption}
 */
function renderDoughnutChart(distribution) {
    const ctx = document.getElementById('emissions-doughnut').getContext('2d');
    // Destroy existing chart instance if exists
    if (window.emissionsChart) {
        window.emissionsChart.destroy();
    }
    const data = {
        labels: ['Transport', 'Energy', 'Food', 'Waste', 'Consumption'],
        datasets: [{
            data: [
                distribution.transport || 0,
                distribution.energy || 0,
                distribution.food || 0,
                distribution.waste || 0,
                distribution.consumption || 0
            ],
            backgroundColor: [
                'var(--mint)',
                'var(--blue)',
                'var(--purple)',
                'var(--yellow)',
                'var(--gray)'
            ],
            borderWidth: 1
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
        }
    };
    window.emissionsChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}

/**
 * Render achievement badges in the badge shelf.
 * @param {Array} achievements - List of achievement objects
 */
function renderBadges(achievements) {
    const shelf = document.getElementById('badges-shelf');
    if (!shelf) return;
    shelf.innerHTML = '';
    achievements.forEach(ach => {
        const badge = document.createElement('div');
        badge.className = 'badge-item';
        badge.innerHTML = `
            <div class="badge-icon" aria-hidden="true"><i class="fa-solid fa-award"></i></div>
            <div class="badge-info">
                <span class="badge-title">${ach.title}</span>
                <span class="badge-desc">${ach.description}</span>
            </div>`;
        shelf.appendChild(badge);
    });
}
function renderCarbonScore(summary) {
    // summary includes carbon_score, score_rating, score_explanation, score_suggestions, largest_emission_category
    const scoreEl = document.getElementById('carbon-score-value');
    const ratingEl = document.getElementById('carbon-score-rating');
    const categoryEl = document.getElementById('carbon-score-category');
    const suggestionsEl = document.getElementById('carbon-score-suggestions');
    if (!scoreEl || !ratingEl || !categoryEl || !suggestionsEl) return;
    // Update numeric score
    scoreEl.textContent = summary.carbon_score !== undefined ? summary.carbon_score : 'N/A';
    // Update rating badge
    ratingEl.textContent = summary.score_rating || 'N/A';
    // Update largest emission category
    const cat = summary.largest_emission_category || 'N/A';
    categoryEl.textContent = `Largest Emission: ${cat}`;
    // Update suggestions list
    const sugg = summary.score_suggestions || [];
    suggestionsEl.innerHTML = '';
    sugg.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        suggestionsEl.appendChild(li);
    });
    // Also add explanation as tooltip on rating
    ratingEl.setAttribute('title', summary.score_explanation || '');
    ratingEl.setAttribute('aria-label', summary.score_explanation || '');
}

// Export for debugging
window.renderCarbonScore = renderCarbonScore;
/**
 * Show a level‑up toast when the user advances to a higher level.
 * @param {number} currentXP - Current XP total
 * @param {number} currentLevel - Current level after update
 */
function maybeShowLevelUpToast(currentXP, currentLevel) {
    // Initialize previousLevel on first run
    if (previousLevel === null) {
        previousLevel = currentLevel;
        return;
    }
    if (currentLevel > previousLevel) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast level-up-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `<i class="fa-solid fa-star"></i> Level Up! You reached Level ${currentLevel} – ${LEVEL_TITLES[currentLevel] || ''}`;
        toastContainer.appendChild(toast);
        // Auto‑remove after 5 seconds
        setTimeout(() => toast.remove(), 5000);
    }
    previousLevel = currentLevel;
}

/**
 * Update the XP progress bar with accessibility attributes.
 * @param {number} xp - Total XP earned
 * @param {number} level - Current user level
 */
function updateXPBar(xp, level) {
    const progress = xp % 100;
    const percent = (progress / 100) * 100;
    if (xpBarFill) {
        xpBarFill.style.width = `${percent}%`;
        // Accessibility
        xpBarFill.setAttribute('role', 'progressbar');
        xpBarFill.setAttribute('aria-valuenow', progress);
        xpBarFill.setAttribute('aria-valuemin', 0);
        xpBarFill.setAttribute('aria-valuemax', 100);
        xpBarFill.setAttribute('aria-label', `XP progress: ${progress} out of 100`);
    }
    if (userXpVal) {
        userXpVal.textContent = xp;
    }
    if (userLevelVal) {
        userLevelVal.textContent = level;
    }
}

/**
 * Update the textual level info (title) based on the current level.
 * @param {number} level - Current user level
 */
function updateLevelInfo(level) {
    const titleElem = document.getElementById('user-level-title');
    if (titleElem) {
        titleElem.textContent = LEVEL_TITLES[level] || `Level ${level}`;
    }
    // Also update badge count label (already handled elsewhere)
}

/**
 * Update the badge count label.
 * @param {number} count - Number of unlocked achievements
 */
function updateBadgeCount(count) {
    const countLabel = document.getElementById('badge-count-label');
    if (countLabel) {
        countLabel.textContent = `${count} Unlocked`;
    }
}

// Fetch AI and Community Premium Insights
async function fetchAIAndCommunity() {
    try {
        const [coachRes, commRes] = await Promise.all([
            fetch(`${API_BASE}/api/coach`),
            fetch(`${API_BASE}/api/community`)
        ]);
        if (coachRes.ok) {
            const data = await coachRes.json();
            document.getElementById("ai-coach-insight").innerHTML = `<p>${data.insight}</p>`;
        }
        if (commRes.ok) {
            const data = await commRes.json();
            document.getElementById("comm-trees").textContent = data.trees_saved;
            document.getElementById("comm-cars").textContent = data.cars_removed;
        }
    } catch(err) {
        console.warn("Could not load AI features", err);
    }
}

// Initialize Three.js Earth
function init3DEarth() {
    const container = document.getElementById('earth-container');
    if(!container) return;
    
    const scene = new THREE.Scene();
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 180;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);
    
    const geometry = new THREE.SphereGeometry(2.5, 32, 32);
    // Use a wireframe/basic material to avoid needing external texture loading
    const material = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
    const earth = new THREE.Mesh(geometry, material);
    
    scene.add(earth);
    camera.position.z = 7;
    
    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.005;
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        const rw = container.clientWidth || 300;
        const rh = container.clientHeight || 180;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
    });
}

// Ensure newly added functions are exported for debugging (optional)
window.renderDoughnutChart = renderDoughnutChart;
window.renderBadges = renderBadges;
window.maybeShowLevelUpToast = maybeShowLevelUpToast;
window.updateXPBar = updateXPBar;
window.updateLevelInfo = updateLevelInfo;
window.updateBadgeCount = updateBadgeCount;
