import { getState } from './state.js';

let previousLevel = null;
const LEVEL_TITLES = {
    1: "Eco Seedling",
    2: "Green Sprout",
    3: "Carbon Champion",
    4: "Sustainability Sage",
    5: "Eco Warrior"
};

export function maybeShowLevelUpToast(currentXP, currentLevel) {
    const { appSummary } = getState();
    const xp = appSummary?.xp ?? currentXP;
    const level = appSummary?.level ?? currentLevel;
    if (previousLevel === null) {
        previousLevel = level;
        return;
    }
    if (level > previousLevel) {
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = 'toast level-up-toast show';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            toast.innerHTML = `<i class="fa-solid fa-star" aria-hidden="true"></i> <div class="toast-body"><span class="toast-title">Level Up!</span><span class="toast-desc">You reached Level ${level} – ${LEVEL_TITLES[level] || ''}</span></div>`;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        }
    }
    previousLevel = level;
}

export function updateXPBar(xp, level) {
    const { appSummary } = getState();
    const xpBarFill = document.getElementById("xp-bar-fill");
    const userXpVal = document.getElementById("user-xp-val");
    const userLevelVal = document.getElementById("user-level-val");
    const progress = (appSummary?.xp ?? xp) % 100;
    const percent = (progress / 100) * 100;

    if (xpBarFill) {
        xpBarFill.style.width = `${percent}%`;
        xpBarFill.setAttribute('role', 'progressbar');
        xpBarFill.setAttribute('aria-valuenow', progress);
        xpBarFill.setAttribute('aria-valuemin', '0');
        xpBarFill.setAttribute('aria-valuemax', '100');
        xpBarFill.setAttribute('aria-label', `XP progress: ${progress} out of 100`);
    }
    if (userXpVal) userXpVal.textContent = appSummary?.xp ?? xp;
    if (userLevelVal) userLevelVal.textContent = appSummary?.level ?? level;
}

export function updateLevelInfo(level) {
    const { appSummary } = getState();
    const titleElem = document.getElementById('user-level-title');
    if (titleElem) {
        titleElem.textContent = LEVEL_TITLES[appSummary?.level ?? level] || `Level ${appSummary?.level ?? level}`;
    }
}

export function updateBadgeCount(count) {
    const { appSummary } = getState();
    const countLabel = document.getElementById('badge-count-label');
    if (countLabel) {
        countLabel.textContent = `${appSummary?.achievements?.length ?? count} Unlocked`;
    }
}

export function renderBadges() {
    const { appSummary } = getState();
    const shelf = document.getElementById('badges-shelf');
    if (!shelf) return;
    shelf.innerHTML = '';
    
    const achievements = appSummary?.achievements || [];
    const badgeTemplates = [
        { key: "first_steps", class: "badge-first", title: "First Steps", desc: "Logged your first activity", icon: "fa-seedling" },
        { key: "green_commuter", class: "badge-commuter", title: "Eco Commuter", desc: "Logged sustainable travel 3 times", icon: "fa-bus" },
        { key: "earth_defender", class: "badge-defender", title: "Earth Defender", desc: "Committed to 3 green habits", icon: "fa-shield-halved" },
        { key: "carbon_buster", class: "badge-buster", title: "Carbon Buster", desc: "Reached Level 3 or higher", icon: "fa-bolt" }
    ];

    badgeTemplates.forEach(t => {
        const unlocked = achievements.some(a => a.achievement_key === t.key);
        const badge = document.createElement('div');
        badge.className = `badge-item ${unlocked ? 'unlocked' : ''}`;
        badge.setAttribute('data-tooltip', unlocked ? t.desc : `Locked: ${t.desc}`);
        badge.setAttribute('tabindex', '0');
        badge.setAttribute('aria-label', `${t.title} badge. Status: ${unlocked ? 'Unlocked' : 'Locked'}. ${t.desc}`);
        badge.innerHTML = `
            <div class="badge-icon ${t.class}" aria-hidden="true"><i class="fa-solid ${t.icon}"></i></div>
            <span class="badge-name">${t.title}</span>`;
        shelf.appendChild(badge);
    });
}

export function renderCarbonScore() {
    const { appSummary } = getState();
    const scoreEl = document.getElementById('carbon-score-value');
    const ratingEl = document.getElementById('carbon-score-rating');
    const categoryEl = document.getElementById('carbon-score-category');
    if (!scoreEl || !ratingEl || !categoryEl) return;
    
    const summary = appSummary || {};
    scoreEl.textContent = summary.carbon_score !== undefined ? summary.carbon_score : 'N/A';
    ratingEl.textContent = summary.score_rating || 'N/A';
    const cat = summary.largest_emission_category || 'N/A';
    categoryEl.textContent = `Largest Emission: ${cat}`;

    const sugg = summary.score_suggestions || [];
    const suggestionsEl = document.getElementById('carbon-score-suggestions');
    if (suggestionsEl) {
        suggestionsEl.innerHTML = '';
        sugg.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            suggestionsEl.appendChild(li);
        });
    }
    ratingEl.setAttribute('title', summary.score_explanation || '');
    ratingEl.setAttribute('aria-label', summary.score_explanation || '');
}

export function updateUIElements() {
    const { appSummary } = getState();
    const currentFootprintVal = document.getElementById("current-footprint-value");
    const metricSavings = document.getElementById("metric-savings");
    const metricLogged = document.getElementById("metric-logged");
    const metricLogCount = document.getElementById("metric-log-count");
    const metricTarget = document.getElementById("metric-target");
    const baseGoalInput = document.getElementById("base-goal-input");
    const targetGoalInput = document.getElementById("target-goal-input");
    const progressPercentageLabel = document.getElementById("progress-percentage-label");

    if (!appSummary) return;

    const currentEst = appSummary.current_estimate ?? 0;
    const monthlySavings = appSummary.monthly_savings ?? 0;
    const totalLogged = appSummary.total_logged_emissions ?? 0;
    const logCount = appSummary.logged_count ?? 0;
    const target = appSummary.target ?? 400;
    const baseline = appSummary.baseline ?? 550;

    if (currentFootprintVal) currentFootprintVal.textContent = currentEst.toFixed(1);
    if (metricSavings) metricSavings.textContent = `${monthlySavings.toFixed(1)} kg`;
    if (metricLogged) metricLogged.textContent = `${totalLogged.toFixed(1)} kg`;
    if (metricLogCount) metricLogCount.textContent = logCount;
    if (metricTarget) metricTarget.textContent = `${target.toFixed(1)} kg`;
    if (baseGoalInput) baseGoalInput.value = baseline;
    if (targetGoalInput) targetGoalInput.value = target;

    const safeTarget = target > 0 ? target : 400;
    const pct = Math.min(currentEst / safeTarget, 1.5);
    const pctLabelVal = Math.round(pct * 100);
    if (progressPercentageLabel) {
        progressPercentageLabel.textContent = `${pctLabelVal}% of monthly target reached`;
    }

    const xp = appSummary.xp ?? 0;
    const level = appSummary.level ?? 1;
    const achievements = appSummary.achievements ?? [];
    updateXPBar(xp, level);
    updateLevelInfo(level);
    updateBadgeCount(achievements.length);
    maybeShowLevelUpToast(xp, level);
}

