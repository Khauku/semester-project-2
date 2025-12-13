const API_BASE = "https://v2.api.noroff.dev";

/**
 * Try to get stored token.
 * 1) from lm_token
 * 2) from lm_user.accessToken 
 */
function getStoredToken() {
    try {
        const explicit = 
        localStorage.getItem("lm_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

        if (explicit) return explicit;

        const rawUser = localStorage.getItem("lm_user");
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user && typeof user === "object" && user.accessToken) {
                return user.accessToken;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

const API_KEY_STORAGE_KEY = "lm_api_key";

async function getStoredApiKey(token) {
    try {
        let existing = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (existing) return existing;

        // cannot create key without token
        if (!token) return null;

        // create new key
        const response = await fetch(`${API_BASE}/auth/create-api-key`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
        });

        let data = {};
        try {
            data = await response.json();
        } catch {}

        if (!response.ok) {
            return null;
        }
        
        const newKey = data?.data?.key || data?.key || null;

        if (newKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
        }

        return newKey;
        
    } catch {
        return null;
    }
}

export async function apiRequest(
    path,
    { method = "GET", body, token } = {}
) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    let finalToken = token || null;

    const isAuthEndpoint = path.startsWith("/auth");
    if (!finalToken && !isAuthEndpoint) {
        finalToken = getStoredToken();
    }

    if (finalToken) {
        options.headers.Authorization = `Bearer ${finalToken}`;
    }

    if (!isAuthEndpoint && finalToken) {
        const apiKey = await getStoredApiKey(finalToken);
        if (apiKey) {
            options.headers["X-Noroff-API-Key"] = apiKey;
        }
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    let result;
    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (!response.ok) {
        throw new Error(
            result?.errors?.[0]?.message ||
            result?.message ||
            "Something went wrong"
        );
    }

    return result?.data ?? result;
}