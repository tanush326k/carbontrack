// utils.js - shared utility functions for the CarbonTrack app
/**
 * Retrieve a value from localStorage with a fallback.
 * @param {string} key
 * @param {any} [fallback]
 * @returns {any}
 */
export function getStored(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.warn('Failed to parse localStorage key', key, e);
        return fallback;
    }
}
/**
 * Store a value in localStorage.
 * @param {string} key
 * @param {any} value
 */
export function setStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Failed to set localStorage key', key, e);
    }
}
/**
 * Show a toast notification.
 * @param {'info'|'error'|'success'} type
 * @param {string} message
 */
export function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
/**
 * Simple debounce implementation.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}
