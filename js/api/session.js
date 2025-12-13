// js/api/session.js
// central helpers for auth state (user + token)


/** full user object from the API */
const USER_KEY = "lm_user";

const TOKEN_KEYS = ["lm_token", "accessToken", "token"];

/**
 * Get the logged-in user from localStorage.
 * returns `null` if not logged in. 
 */
export function getCurrentUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;

        const user = JSON.parse(raw);
        if (!user || typeof user !== "object") return null;

        return user;
    } catch {
        // if parse fails treat as logged out
        return null;
    }
}

/** get a usable auth token for authenticated requests.
 * priority:
 * 1) user.accessToken from lm_user
 * 2) any of the TOKEN_KEYS in localStorage
 * Returns "" if no token found.
 */
export function getAuthToken() {
    try {
        const user = getCurrentUser();
        if (user && typeof user === "object" && user.accessToken) {
            return user.accessToken;
        }

        for (const key of TOKEN_KEYS) {
            const value = localStorage.getItem(key);
            if (value) return value;
        }

        return "";
    } catch {
        return "";
    }
}

/** 
 * Save a user session
 * @param {object} user - user object returned from the API (login/register)
 */
export function saveSession(user) {
    if (!user || typeof user !== "object") return;

    try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        if (user.accessToken) {
            localStorage.setItem("lm_token", user.accessToken);
            localStorage.setItem("accessToken", user.accessToken);
        }
    } catch {

    }
}

/** clear all auth related data from storage.
 * for logout button
 */
export function clearSession() {
    try {
        localStorage.removeItem(USER_KEY);

        for (const key of TOKEN_KEYS) {
            localStorage.removeItem(key);
        }
    } catch {
        //ignore
    }
}

