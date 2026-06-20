// API module - responsible for fetching data only
// No direct state mutation here; callers should handle state updates

export async function fetchSummary() {
    const res = await fetch(`/api/summary`);
    if (!res.ok) throw new Error("Failed to fetch dashboard summary");
    return await res.json();
}

export async function fetchLogs() {
    const res = await fetch(`/api/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
}

export async function fetchTipsAndActions() {
    const [tipsRes, actionsRes] = await Promise.all([
        fetch(`/api/tips`),
        fetch(`/api/actions`)
    ]);
    if (!tipsRes.ok || !actionsRes.ok) throw new Error("Failed to fetch habits and tips");
    return {
        tips: await tipsRes.json(),
        actions: await actionsRes.json()
    };
}

export async function calculateFootprint(payload, signal) {
    const res = await fetch(`/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal
    });
    if (!res.ok) throw new Error("Calculation request failed");
    return await res.json();
}

export async function saveGoals(base, target) {
    const res = await fetch(`/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseline: base, target: target })
    });
    if (!res.ok) throw new Error("Could not update goals");
    return await res.json();
}

export async function logActivity(payload) {
    const res = await fetch(`/api/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed logging activity");
    return await res.json();
}

export async function deleteLog(id) {
    const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Could not delete log");
    return await res.json();
}

export async function adoptAction(key) {
    const res = await fetch(`/api/actions/${key}`, { method: "POST" });
    if (!res.ok) throw new Error("Habit action could not be adopted");
    return await res.json();
}

export async function removeAction(key) {
    const res = await fetch(`/api/actions/${key}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Habit action could not be removed");
    return await res.json();
}

export async function fetchAIAndCommunity() {
    try {
        const [coachRes, commRes] = await Promise.all([
            fetch(`/api/coach`),
            fetch(`/api/community`)
        ]);
        return {
            coach: coachRes.ok ? await coachRes.json() : null,
            community: commRes.ok ? await commRes.json() : null
        };
    } catch (err) {
        console.warn("Could not load AI or community features", err);
        return { coach: null, community: null };
    }
}
