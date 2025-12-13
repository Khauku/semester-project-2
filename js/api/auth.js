import { apiRequest } from "./client.js";

/**
 * Register a new user with the Noroff v2 API
 * Required: name, email (@stud.noroff.no), password (min 8 chars)
 * 
 * @param {{ name: string, email: string, password: string }} params
 * @returns {Promise<any>} the created user object
 */
export function registerUser({ name, email, password }) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: { name, email, password },
    });
}

/**
 * Log in as an existing user with Noroff v2 API
 * 
 * @param {{ email: string, password: string }} params
 * @returns {Promise<any>} The user ibject with accessToken
 */
export function loginUser({ email, password }) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
    });
}