// edit.js
// Handles: 
// - redirect if not logged in
// - load existing listing by ID and pre-fill form
// - prevent editing if user is not the seller
// - submit updates for listing
// - delete listing from edit page

import {
    getListingById,
    updateListing,
    deleteListing,
} from "../api/auction.js";
import { getAuthToken, getCurrentUser } from "../api/session.js";

const user = getCurrentUser();
const token = getAuthToken();

if (!user || !user.name || !token) {
    window.location.href = "../account/login.html";
    throw new Error("Not authenticated");
}

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

if (!listingId) {
    window.location.href = "../account/profile.html";
    throw new Error("Missing listing ID")
}

document.addEventListener("DOMContentLoaded", () => {
    const formEl = document.querySelector("#edit-listing-form");
    if (!formEl) return;

    const errorEl = formEl.querySelector("[data-form-error]");
    const successEl = formEl.querySelector("[data-form-success]");

    const titleInputEl = formEl.querySelector("#listing-title");
    const descriptionInputEl = formEl.querySelector("#listing-description");
    const endsAtInputEl = formEl.querySelector("#listing-endsAt");
    const mediaUrlInputEl = formEl.querySelector("#media-url");
    const mediaAltInputEl = formEl.querySelector("#media-alt");

    const submitButtonEl = formEl.querySelector("[data-submit-button]");
    const deleteButtonEl = formEl.querySelector("[data-delete-button]");

    if (!titleInputEl || !descriptionInputEl || !endsAtInputEl) {
        return;
    }

    loadListing();

    formEl.addEventListener("submit", handleEditSubmit);

    if (deleteButtonEl) {
        deleteButtonEl.addEventListener("click", handleDeleteClick);
    }

    async function loadListing() {
        clearMessages();
        showMessage("success", "Loading your listing...");

        try {
            const listing = await getListingById(listingId);

            // owner check
            const sellerName = listing?.seller?.name;
            if (!sellerName || sellerName !== user.name) {
                showMessage(
                    "error",
                    "You can only edit your own listing."
                );
                setTimeout(() => {
                    window.location.href = `../post/listing.html?id=${encodeURIComponent(listingId)}`;
                }, 1200);
                return;
            }

            // pre-fill form
            titleInputEl.value = listing.title || "";
            descriptionInputEl.value = listing.description || "";

            if (listing.endsAt) {
                endsAtInputEl.value = toLocalDateTimeValue(listing.endsAt);
            }

            const firstMedia = Array.isArray(listing.media)
            ? listing.media[0]
            : null;

            if (firstMedia && mediaUrlInputEl) {
                mediaUrlInputEl.value = firstMedia.url || "";
            }

            if (firstMedia && mediaAltInputEl) {
                mediaAltInputEl.value = firstMedia.alt || "";
            }

            clearMessages();
        } catch (error) {
            showMessage(
                "error",
                "We couldn't load this listing. Please try again later."
            );
        }
    }

    async function handleEditSubmit(event) {
        event.preventDefault();
        clearMessages();

        const title = titleInputEl.value.trim();
        const description = descriptionInputEl.value.trim();
        const endsAtRaw = endsAtInputEl.value.trim();
        const mediaUrl = mediaUrlInputEl && mediaUrlInputEl.value? mediaUrlInputEl.value.trim(): "";
        const mediaAlt = mediaAltInputEl && mediaAltInputEl.value? mediaAltInputEl.value.trim(): "";

        if (!title || !description || !endsAtRaw) {
            showMessage("error", "Please fill in title, description and end date.");
            return;
        }

        const endsAtDate = new Date(endsAtRaw);
        const now = new Date();

        if (Number.isNaN(endsAtDate.getTime())) {
            showMessage("error", "Please choose a valid end date and time.");
            return;
        }

        if (endsAtDate <= now) {
            showMessage("error", "The auction end date must be in the future.");
            return;
        }

        const payload = {
            title,
            description,
            endsAt: endsAtDate.toISOString(),
        };

        if (mediaUrl) {
            payload.media = [
                {
                    url: mediaUrl,
                    alt: mediaAlt || title || "Listing image",
                },
            ];
        } else {
            // allow clearing image
            payload.media = [];
        }

        setSavingState(true);

        try {
            await updateListing(listingId, payload, token);
            showMessage("success", "Your changes have been saved.");

            setTimeout(() => {
                window.location.href = `../post/listing.html?id=${encodeURIComponent(listingId)}`;
            }, 900);
        } catch (error) {
            showMessage(
                "error",
                error?.message ||
                "We couldn't save your changes. Please try again."
            );
        } finally {
            setSavingState(false);
        }
    }

    async function handleDeleteClick() {
        clearMessages();

        const confirmed = window.confirm(
            "Are you sure you want to delete this listing? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        if (!deleteButtonEl) {
            return;
        }

        deleteButtonEl.disabled = true;
        deleteButtonEl.textContent = "Deleting...";

        try {
            await deleteListing(listingId, token);
            showMessage("success", "Your listing has been deleted.");
            setTimeout(() => {
                window.location.href = "../account/profile.html";
            }, 900);
        } catch (error) {
            showMessage(
                "error",
                "We couldn't delete this listing right now. Please try again."
            );
            deleteButtonEl.disabled = false;
            deleteButtonEl.textContent = "Delete listing";
        }
    }

    function clearMessages() {
        if (errorEl) {
            errorEl.textContent = "";
            errorEl.hidden = true;
        }
        if (successEl) {
            successEl.textContent = "";
            successEl.hidden = true;
        }
    }

    /**
     * @param {"error" | "success"} type
     * @param {string} message
     */
    function showMessage(type, message) {
        const targetEl = type === "error" ? errorEl : successEl;
        if (!targetEl) return;

        if (type === "error" && successEl) {
            successEl.hidden = true;
        }

        if (type === "success" && errorEl) {
            errorEl.hidden = true;
        }

        targetEl.textContent = message;
        targetEl.hidden = false;
    }

    function setSavingState(isSaving) {
        if (!submitButtonEl) return;

        submitButtonEl.disabled = isSaving;
        submitButtonEl.textContent = isSaving ? "Saving..." : "Save changes";
    }

    /**
     * Convert ISO String to value usable in datetime-local input.
     * @param {string} isoString
     * @returns {string}
     */
    function toLocalDateTimeValue(isoString) {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() +1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
});