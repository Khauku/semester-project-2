// create.js
// Handles: 
// - redirect if not logged in
// - create listing form submit
// - basic validation and feedback for create listing

import { createListing } from "../api/auction.js";
import { getAuthToken, getCurrentUser } from "../api/session.js";

const user = getCurrentUser();
const token = getAuthToken();

if (!user || !user.name || !token) {
    window.location.href = "../account/login.html";
    throw new Error("Not authenticated");
}

document.addEventListener("DOMContentLoaded", () => {
    const formEl = document.querySelector("#create-listing-form");
    if (!formEl) return;

    const errorEl = formEl.querySelector("[data-form-error]");
    const successEl = formEl.querySelector("[data-form-success]");
    const submitButtonEl = formEl.querySelector("[data-submit-button]");

    const titleInputEl = formEl.querySelector("#listing-title");
    const descriptionInputEl = formEl.querySelector("#listing-description");
    const endsAtInputEl = formEl.querySelector("#listing-endsAt");
    const mediaUrlInputEl = formEl.querySelector("#media-url");
    const mediaAltInputEl = formEl.querySelector("#media-alt");

    if (!titleInputEl || !descriptionInputEl || !endsAtInputEl) {
        return;
    }

    formEl.addEventListener("submit", handleCreateSubmit);

    async function handleCreateSubmit(event) {
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
        }

        setSavingState(true);

        try {
            await createListing(payload, token);
            showMessage("success", "Your listing has been published.");

            // small delay so user can see message
            setTimeout(() => {
                window.location.href = "../account/profile.html";
            }, 900);
        } catch (error) {
            showMessage(
                "error",
                error?.message || 
                    "We couldn't publish your listing right now. Please try again."
            );
        } finally {
            setSavingState(false);
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

        // hide the other one
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
        submitButtonEl.textContent = isSaving ? "Publishing..." : "Publish listing";
    }
});