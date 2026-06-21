import { state, setState } from './state.js';
// Minor bug fixes applied to ensure runtime stability
import * as api from './api.js';
import * as ui from './ui.js';
import * as charts from './charts.js';
import { init3DEarth } from './earth.js';

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}


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

const UNIT_LABELS = {
    transport: "Distance Traveled (km):",
    energy: "Utility Usage (kWh):",
    food: "Log Duration (Days):",
    waste: "Waste Weight (kg):",
    consumption: "Quantity (Items):"
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

const recentLogsList = document.getElementById("recent-logs-list");
const adoptedHabitsList = document.getElementById("adopted-habits-list");
const recommendedTipsList = document.getElementById("recommended-tips-list");

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
    setupCategoryHandler();
    loadDashboard();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }

    init3DEarth();
    fetchAIAndCommunity();

    // Theme initialization and toggle
    const themeToggle = document.getElementById('theme-toggle');
    const persistedTheme = localStorage.getItem('theme');
    const defaultTheme = persistedTheme || 'light';
    document.documentElement.setAttribute('data-theme', defaultTheme);
    if (themeToggle) {
        themeToggle.innerHTML = defaultTheme === 'light' ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.innerHTML = next === 'light' ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        });
    }

    // Form submissions
    calculatorForm.addEventListener("submit", handleCalculate);
    document.getElementById("activity-logger-form").addEventListener("submit", handleAddLog);
    saveGoalsBtn.addEventListener("click", handleSaveGoals);
    useAsBaselineBtn.addEventListener("click", () => handleUseCalculatorAsBaseline(false));

    let calcTimeout;
    const debouncedCalculate = () => {
        clearTimeout(calcTimeout);
        calcTimeout = setTimeout(() => {
            handleCalculate(new Event('submit'));
        }, 300);
    };
    // Initialize sliders with persisted values
    const sliders = document.querySelectorAll('.premium-slider');
    sliders.forEach(slider => {
        const stored = localStorage.getItem('slider_' + slider.id);
        if (stored !== null) {
            slider.value = stored;
        }
        slider.addEventListener('input', e => {
            // Persist the value
            localStorage.setItem('slider_' + e.target.id, e.target.value);
            if (e.target.id.startsWith('calc-')) {
                updateLocalCalculator();
            } else {
                renderApp();
            }
            debouncedCalculate();
        });
    });
    const selects = calculatorForm.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', () => {
            updateLocalCalculator();
            debouncedCalculate();
        });
    });

    // Expose handlers to window for inline onclick attributes
    window.handleDeleteLog = handleDeleteLog;
    window.handleAdoptAction = handleAdoptAction;
    window.handleRemoveAction = handleRemoveAction;
});

function setupCategoryHandler() {
    const updateOptions = () => {
        if (!logCategorySelect || !logTypeSelect) return;
        const cat = logCategorySelect.value;
        logTypeSelect.innerHTML = "";
        
        (ACTIVITY_TYPES[cat] || []).forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.value;
            opt.textContent = item.label;
            logTypeSelect.appendChild(opt);
        });

        if (logAmountLabel) logAmountLabel.textContent = UNIT_LABELS[cat] || "Amount:";
        if (logAmountInput) {
            // Hydrate logAmount slider from localStorage if present
            const storedLogVal = localStorage.getItem('slider_log-amount');
            const val = storedLogVal !== null ? storedLogVal : "0";
            logAmountInput.value = val;
            // Set max based on category
            if (cat === "food") { logAmountInput.max = "30"; }
            else if (cat === "waste") { logAmountInput.max = "100"; }
            else if (cat === "consumption") { logAmountInput.max = "10"; }
            else { logAmountInput.max = "1000"; }
        }
    };

    if (logCategorySelect) logCategorySelect.addEventListener("change", updateOptions);
    updateOptions();
}

async function loadDashboard() {
    try {
        const [summary, logs, tipsAndActions] = await Promise.all([
            api.fetchSummary(),
            api.fetchLogs(),
            api.fetchTipsAndActions()
        ]);
        setState({
            appSummary: summary,
            logs: Array.isArray(logs) ? logs : [],
            tips: Array.isArray(tipsAndActions?.tips) ? tipsAndActions.tips : [],
            adopted: Array.isArray(tipsAndActions?.actions) ? tipsAndActions.actions : []
        });
        renderApp();
    } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Fallback to empty arrays to avoid UI crashes
        setState({
            logs: [],
            tips: [],
            adopted: []
        });
        renderApp();
    }
}

function renderLogs(logs) {
    recentLogsList.innerHTML = "";
    if (logs.length === 0) {
        recentLogsList.innerHTML = `<div class="log-item" style="color: var(--text-muted); justify-content: center;">No activities logged yet.</div>`;
        return;
    }

    logs.forEach(log => {
        const item = document.createElement("div");
        item.className = "log-item";
        
        const list = ACTIVITY_TYPES[log.category] || [];
        const match = list.find(l => l.value === log.activity_type);
        const name = match ? match.label : log.activity_type;

        item.innerHTML = `
            <div class="log-details">
                <span class="log-meta">${escapeHTML(name)}</span>
                <span class="log-sub">${log.amount} ${getUnitSuffix(log.category)} &bull; ${escapeHTML(log.date)} ${log.notes ? `&bull; "${escapeHTML(log.notes)}"` : ''}</span>
            </div>
            <div class="log-value-tag">
                <span class="log-emissions">+${log.emissions_kg} kg</span>
                <button class="log-delete-btn" onclick="handleDeleteLog(${log.id})" aria-label="Delete this logged entry"><i class="fa-solid fa-trash-can"></i></button>
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

function renderHabitsAndTips(tips, adopted) {
    adoptedHabitsList.innerHTML = "";
    recommendedTipsList.innerHTML = "";

    const adoptedKeys = new Set(adopted.map(a => a.action_key));

    if (adopted.length === 0) {
        adoptedHabitsList.innerHTML = `<div class="habit-card" style="color: var(--text-muted); justify-content: center; border-left: none;">Adopt a habit below to reduce footprint!</div>`;
    } else {
        adopted.forEach(hab => {
            const matchedTip = tips.find(t => t.key === hab.action_key) || {};
            const card = document.createElement("div");
            card.className = "habit-card";
            card.innerHTML = `
                <div class="card-content">
                    <span class="card-title">${escapeHTML(hab.title)}</span>
                    <span class="card-desc">${escapeHTML(matchedTip.description || "Active green habit")}</span>
                    <div class="card-badge-row">
                        <span class="badge-saving">-${hab.monthly_saving_kg} kg CO2e / mo</span>
                    </div>
                </div>
                <button class="card-remove-btn" onclick="handleRemoveAction('${escapeHTML(hab.action_key)}')" aria-label="Stop committing to ${escapeHTML(hab.title)}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            adoptedHabitsList.appendChild(card);
        });
    }

    const availableTips = tips.filter(t => !adoptedKeys.has(t.key));
    if (availableTips.length === 0) {
        recommendedTipsList.innerHTML = `<div class="tip-card" style="color: var(--text-muted); justify-content: center;">Fantastic! You've adopted all available green habits!</div>`;
    } else {
        availableTips.forEach(tip => {
            const card = document.createElement("div");
            card.className = "tip-card";
            card.innerHTML = `
                <div class="card-content">
                    <span class="card-title">${escapeHTML(tip.title)}</span>
                    <span class="card-desc">${escapeHTML(tip.description)}</span>
                    <div class="card-badge-row">
                        <span class="badge-saving">-${tip.monthly_saving_kg} kg/mo</span>
                        <span class="badge-difficulty">${escapeHTML(tip.difficulty)}</span>
                    </div>
                </div>
                <button class="card-action-btn" onclick="handleAdoptAction('${escapeHTML(tip.key)}')" aria-label="Commit to habit: ${escapeHTML(tip.title)}">Commit</button>
            `;
            recommendedTipsList.appendChild(card);
        });
    }
}

function updateLocalCalculator() {
    const carKmEl = document.getElementById("calc-car-km");
    const carTypeEl = document.getElementById("calc-car-type");
    const publicKmEl = document.getElementById("calc-public-km");
    const flightsEl = document.getElementById("calc-flights");
    const elecEl = document.getElementById("calc-elec");
    const gasEl = document.getElementById("calc-gas");
    const dietEl = document.getElementById("calc-diet");
    const wasteEl = document.getElementById("calc-waste");

    // Guard: if any required element is missing, bail out
    if (!carKmEl || !carTypeEl || !publicKmEl || !flightsEl || !elecEl || !gasEl || !dietEl || !wasteEl) return;

    const carKm = parseFloat(carKmEl.value) || 0;
    const carType = carTypeEl.value || 'petrol_car';
    const publicKm = parseFloat(publicKmEl.value) || 0;
    const flights = parseFloat(flightsEl.value) || 0;
    const elec = parseFloat(elecEl.value) || 0;
    const gas = parseFloat(gasEl.value) || 0;
    const diet = dietEl.value || 'average_mixed';
    const waste = parseFloat(wasteEl.value) || 0;

    const factors = { petrol_car: 0.19, diesel_car: 0.17, hybrid_car: 0.11, electric_vehicle: 0.05, train: 0.04, flight_long: 0.15 };
    const transportTotal = (carKm * (factors[carType] || 0.19)) + (publicKm * 0.04) + (flights * 0.15);
    const energyTotal = (elec * 0.233) + (gas * 0.203);
    const dietFactors = { heavy_meat: 100, average_mixed: 75, vegetarian: 50, vegan: 40 };
    const dietTotal = dietFactors[diet] || 75;
    const wasteTotal = (waste * 4.3) * 0.5;

    const calcTotal = transportTotal + energyTotal + dietTotal + wasteTotal;
    const res = {
        transport: transportTotal,
        energy: energyTotal,
        diet: dietTotal,
        waste: wasteTotal,
        consumption: 0,
        total: calcTotal
    };

    // Merge safely into existing appSummary defaults
    const existingSummary = state.appSummary || {};
    setState({
        calculator: res,
        lastCalculatorTotal: calcTotal,
        appSummary: {
            baseline: existingSummary.baseline ?? 550,
            target: existingSummary.target ?? 400,
            monthly_savings: existingSummary.monthly_savings ?? 0,
            total_logged_emissions: existingSummary.total_logged_emissions ?? 0,
            logged_count: existingSummary.logged_count ?? 0,
            xp: existingSummary.xp ?? 0,
            level: existingSummary.level ?? 1,
            achievements: existingSummary.achievements ?? [],
            score_rating: existingSummary.score_rating ?? '',
            largest_emission_category: existingSummary.largest_emission_category ?? '',
            score_suggestions: existingSummary.score_suggestions ?? [],
            score_explanation: existingSummary.score_explanation ?? '',
            carbon_score: Math.max(0, Math.min(100, Math.round(100 - (calcTotal / 10)))),
            current_estimate: calcTotal,
            category_distribution: {
                transport: transportTotal,
                energy: energyTotal,
                food: dietTotal,
                waste: wasteTotal,
                consumption: 0
            }
        }
    });
    renderApp();
}

let currentCalcController = null;

async function handleCalculate(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    if (currentCalcController) {
        currentCalcController.abort();
    }
    currentCalcController = new AbortController();

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
            { type: "landfill", kg: waste * 4.3 }
        ],
        consumption: []
    };

    try {
        const result = await api.calculateFootprint(payload, currentCalcController.signal);
        const existingSummary = state.appSummary || {};
        setState({
            calculator: result,
            lastCalculatorTotal: result.total ?? 0,
            appSummary: {
                baseline: existingSummary.baseline ?? 550,
                target: existingSummary.target ?? 400,
                monthly_savings: existingSummary.monthly_savings ?? 0,
                total_logged_emissions: existingSummary.total_logged_emissions ?? 0,
                logged_count: existingSummary.logged_count ?? 0,
                xp: existingSummary.xp ?? 0,
                level: existingSummary.level ?? 1,
                achievements: existingSummary.achievements ?? [],
                score_rating: existingSummary.score_rating ?? '',
                largest_emission_category: existingSummary.largest_emission_category ?? '',
                score_suggestions: existingSummary.score_suggestions ?? [],
                score_explanation: existingSummary.score_explanation ?? '',
                carbon_score: Math.max(0, Math.min(100, Math.round(100 - ((result.total ?? 0) / 10)))),
                current_estimate: result.total ?? 0,
                category_distribution: {
                    transport: result.transport ?? 0,
                    energy: result.energy ?? 0,
                    food: result.diet ?? 0,
                    waste: result.waste ?? 0,
                    consumption: result.consumption ?? 0
                }
            }
        });
        renderApp();
        return result;
    } catch (err) {
        if (err.name === 'AbortError') return;
        // Log silently — do NOT alert() here as it blocks E2E tests
        console.warn("Could not compute carbon calculations:", err.message);
    }
}

async function handleSaveGoals() {
    const base = parseFloat(baseGoalInput.value) || 550;
    const tgt = parseFloat(targetGoalInput.value) || 400;

    try {
        await api.saveGoals(base, tgt);
        await loadDashboard();
        alert("Goals saved successfully!");
    } catch (err) {
        alert("Failed to save goals: " + err.message);
    }
}

async function handleUseCalculatorAsBaseline(silent = true) {
    if (state.lastCalculatorTotal <= 0) return;
    const currentTarget = parseFloat(targetGoalInput.value) || 400;
    const roundedBaseline = Math.round(state.lastCalculatorTotal);

    try {
        await api.saveGoals(roundedBaseline, currentTarget);
        await loadDashboard();
        if (!silent) alert(`Set baseline successfully to ${roundedBaseline} kg/month!`);
    } catch (err) {
        if (!silent) alert("Failed to apply baseline: " + err.message);
    }
}

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
        await api.logActivity(payload);
        await loadDashboard();
    } catch (err) {
        console.error("Error logging entry:", err.message);
    }
}

async function handleDeleteLog(id) {
    if (!confirm("Are you sure you want to delete this activity log?")) return;

    try {
        await api.deleteLog(id);
        await loadDashboard();
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

async function handleAdoptAction(key) {
    try {
        await api.adoptAction(key);
        await loadDashboard();
    } catch (err) {
        alert("Could not adopt action: " + err.message);
    }
}

async function handleRemoveAction(key) {
    try {
        await api.removeAction(key);
        await loadDashboard();
    } catch (err) {
        alert("Could not remove habit: " + err.message);
    }
}

async function fetchAIAndCommunity() {
    try {
        const data = await api.fetchAIAndCommunity();
        setState({ coach: data.coach, community: data.community });
        renderApp();
    } catch (err) {
        console.error("Error fetching AI and community details:", err);
    }
}


function renderApp() {
    try {
        const { appSummary, calculator, logs, tips, adopted, coach, community } = state;

        // Sync slider values to text labels centrally in renderApp
        const sliders = document.querySelectorAll('.premium-slider');
        sliders.forEach(slider => {
            const valSpan = document.getElementById('val-' + slider.id);
            if (valSpan) valSpan.textContent = slider.value;
        });

        // Core UI updates — each guarded individually
        try { ui.updateUIElements(); } catch (e) { console.warn('updateUIElements error:', e); }
        try { ui.renderCarbonScore(); } catch (e) { console.warn('renderCarbonScore error:', e); }
        try { ui.renderBadges(); } catch (e) { console.warn('renderBadges error:', e); }

        // Render logs
        const safeLogs = Array.isArray(logs) ? logs : [];
        try { renderLogs(safeLogs); } catch (e) { console.warn('renderLogs error:', e); }

        // Render habits and tips
        const safeTips = Array.isArray(tips) ? tips : [];
        const safeAdopted = Array.isArray(adopted) ? adopted : [];
        try { renderHabitsAndTips(safeTips, safeAdopted); } catch (e) { console.warn('renderHabitsAndTips error:', e); }

        // Render calculator charts if present
        if (calculator !== null && calculator !== undefined) {
            try { charts.renderCalcCharts(calculator); } catch (e) { console.warn('renderCalcCharts error:', e); }
        }

        // Render AI insights
        if (coach) {
            const el = document.getElementById("ai-coach-insight");
            if (el) el.textContent = coach.insight || '';
        }

        // Render community stats
        if (community) {
            const commTrees = document.getElementById("comm-trees");
            const commCars = document.getElementById("comm-cars");
            if (commTrees) commTrees.textContent = community.trees_saved ?? 0;
            if (commCars) commCars.textContent = community.cars_removed ?? 0;
        }

        // Render doughnut chart
        if (appSummary && appSummary.category_distribution) {
            try { charts.renderDoughnutChart(appSummary.category_distribution); } catch (e) { console.warn('renderDoughnutChart error:', e); }
        }
    } catch (e) {
        console.error('renderApp critical error:', e);
    }
}
