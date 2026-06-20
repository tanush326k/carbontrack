// Global state management
export const state = {
    // Core summary data with safe defaults
    appSummary: {
        baseline: 550,
        target: 400,
        monthly_savings: 0,
        current_estimate: 400,
        total_logged_emissions: 0,
        logged_count: 0,
        category_distribution: {
            transport: 0,
            energy: 0,
            food: 0,
            waste: 0,
            consumption: 0
        },
        xp: 0,
        level: 1,
        achievements: []
    },
    // Arrays that UI expects to always exist
    logs: [],
    tips: [],
    adopted: [],
    // Calculator related state
    calculator: null,
    lastCalculatorTotal: 0,
    // Placeholder for future actions if needed
    actions: []
};

/** Update state with a partial object */
export function setState(partial) {
    Object.assign(state, partial);
}

/** Retrieve the current state */
export function getState() {
    return state;
}
