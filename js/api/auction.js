import { apiRequest } from "./client.js";

/**
 * Fetch listings from the API
 * By default: active listings, newest first. 
 * 
 * @param {{ active?: boolean, sort?: string, sortOrder?: "asc" | "desc" }} params
 * @returns {Promise<any[]>} Array of listing objects
 */
export function getListings({
    active = true,
    sort = "created",
    sortOrder = "desc",
} = {}) {
    const params = new URLSearchParams();

    if (active) {
        params.set("_active", "true");
    }

    if (sort) {
        params.set("sort", sort);
    }

    if (sortOrder) {
        params.set("sortOrder", sortOrder);
    }

    const query = params.toString() ? `?${params.toString()}` : "";

    return apiRequest(`/auction/listings${query}`);
}

/**
 * Fetch a single listing by ID, including seller and bids.
 * 
 * @param {string} id
 * @returns {Promise<any>} The listing object
 */
export function getListingById(id) {
    if (!id) {
        return Promise.reject(new Error("Listing ID is required"));
    }

    const params = new URLSearchParams();
    params.set("_seller", "true");
    params.set("_bids", "true");

    const query = `?${params.toString()}`;

    return apiRequest(
        `/auction/listings/${encodeURIComponent(id)}${query}`
    );
}

/**
 * Fetch a user profile by name, including listings and bids
 * 
 * @param {string} name
 * @param {{ listings?: boolean, bids?: boolean, token?: string }} options
 * @returns {Promise<any>} The profile object
 */
export function getProfileByName(
    name,
    {
        listings = true,
        bids = true,
        token,
    } = {}
) {
    if (!name) {
        return Promise.reject(new Error("Profile name is required"));
    }

    const params = new URLSearchParams();

    if (listings) params.set("_listings", "true");
    if (bids) params.set("_bids", "true");

    const query = params.toString() ? `?${params.toString()}` : "";

    const requestOptions = token ? { token } : {};

    return apiRequest(
        `/auction/profiles/${encodeURIComponent(name)}${query}`,
        requestOptions
    );
}

/**
 * Fetch listings created by specific profile.
 * Includes bids so we can show bid count
 * 
 * @param {string} name
 * @param {{ active?: boolean, token?: string }} options
 * @returns {Promise<any[]>} Array of listing objects
 */
export function getProfileListings(
    name,
    {
        active = true,
        token,
    } = {}
) {
    if (!name) {
        return Promise.reject(new Error("Profile name is required to fetch listings"));
    }

    const params = new URLSearchParams();

    if (active) {
        params.set("_active", "true");
    }

    params.set("_bids", "true");

    const query = params.toString() ? `?${params.toString()}` : "";
    const requestOptions = token ? { token } : {};

    return apiRequest(
        `/auction/profiles/${encodeURIComponent(name)}/listings${query}`,
        requestOptions
    );
}


/**
 * Fetch bids made by specific profile.
 * Includes listing details so we can render cards.
 * 
 * @param {string} name
 * @param {{ token?: string }} options
 * @returns {Promise<any[]>} Array of bid objects
 */
export function getProfileBids(
    name,
    {
        token,
    } = {}
) {
    if (!name) {
        return Promise.reject(new Error("Profile name is required to fetch bids"));
    }

    const params = new URLSearchParams();
    // include listing details for each bid
    params.set("_listings", "true");

    const query = `?${params.toString()}`;
    const requestOptions = token ? { token } : {};

    return apiRequest(
        `/auction/profiles/${encodeURIComponent(name)}/bids${query}`,
        requestOptions
    );
}

/**
 * @param {string} id
 * @param {string} token
 * @returns {Promise<void>}
 */
export function deleteListing(id, token) {
    if (!id) {
        return Promise.reject(new Error("Listing ID is required to delete listing"));
    }

    if (!token) {
        return Promise.reject(new Error("Auth token is required to delete listing"));
    }

    return apiRequest(
        `/auction/listings/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            token,
        }
    );
}

/**
 * Place a bid on a listing.
 * 
 * @param {string} id
 * @param {number} amount
 * @param {string} token
 * @returns {Promise<any>}
 */
export function placeBid(id, amount, token) {
    if (!id) {
        return Promise.reject(new Error("Listing ID is required to place a bid"));
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return Promise.reject(new Error("A valid bid amount is required"));
    }

    if (!token) {
        return Promise.reject(new Error("Auth token is required to place a bid"));
    }

    return apiRequest(`/auction/listings/${encodeURIComponent(id)}/bids`, {
        method: "POST",
        body: { amount },
        token,
    });
}


/**
 * Update a user profile (bio, avatar, etc.)
 * 
 * @param {string} name
 * @param {{ bio?: string; avatar?: {url: string; alt?: string } }} data
 * @param {string} token 
 * @returns {Promise<any>} The updated profile object
 */
export function updateProfile(name, data, token) {
    if (!name) {
        return Promise.reject(new Error("Profile name is required"));
    }

    if (!token) {
        return Promise.reject(new Error("Auth token is required to update profile"));
    }

    return apiRequest(`/auction/profiles/${encodeURIComponent(name)}`, {
        method: "PUT",
        body: data,
        token,
    });
}

/**
 * Create a new listing.
 * 
 * @param {{
 * title: string;
 * description?: string;
 * endsAt: string;
 * media?: { url: string; alt?: string }[];
 * }} data
 * @param {string} token
 * @returns {Promise<any>} The created listing
 */
export function createListing(data, token) {
    if (!data || typeof data !== "object") {
        return Promise.reject(new Error("Listing data is required to create listing"));
    }

    if (!data.title) {
        return Promise.reject(new Error("Listing title is required"));
    }

    if (!data.endsAt) {
        return Promise.reject(new Error("Auction end date is required"));
    }

    if (!token) {
        return Promise.reject(new Error("Auth token is required to create listing"));
    }

    return apiRequest("/auction/listings", {
        method: "POST",
        body: data,
        token,
    });
}

/**
 * Update an existing listing.
 * 
 * @param {string} id
 * @param {{
 * title?: string;
 * description?: string;
 * endsAt?: string;
 * media?: { url: string; alt?: string }[]
 * }} data
 * @param {string} token
 * @returns {Promise<any>} The updated listing 
 */
export function updateListing(id, data, token) {
    if (!id) {
        return Promise.reject(new Error("Listing ID is required to update listing"));
    }

    if (!data || typeof data !== "object") {
        return Promise.reject(new Error("Listing data is required to update listing"));
    }

    if (!token) {
        return Promise.reject(new Error("Auth token is required to update listing"));
    }

    return apiRequest(`/auction/listings/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: data,
        token,
    });
}