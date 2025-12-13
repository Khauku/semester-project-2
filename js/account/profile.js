// profile.js
// Handles:
// - redirect if not logged in
// - fetch & render logged-in user's profile
// - edit avatar + bio 
// - show credits on profile and in header
// - show "My auctions" and "My bids" on profile

import {
    getProfileByName,
    updateProfile,
    getProfileListings,
    getProfileBids,
    deleteListing,
} from "../api/auction.js";

import { getAuthToken, getCurrentUser } from "../api/session.js";

// must be logged in to view profile
const user = getCurrentUser();
const token = getAuthToken();

if (!user || !user.name || !token) {
    window.location.href = "../account/login.html";
    throw new Error("Not authenticated");
}

// runs only with token + rawUser
document.addEventListener("DOMContentLoaded", () => {

    // profile 
    const username = user.name;
    const statusEl = document.querySelector("#profile-status");
    const avatarImgEl = document.querySelector("[data-profile-avatar]");
    const nameEl = document.querySelector("[data-profile-name]");
    const emailEl = document.querySelector("[data-profile-email]");
    const bioTextEl = document.querySelector("[data-profile-bio]");
    const creditsEl = document.querySelector("[data-profile-credits]");
    const itemsCountEl = document.querySelector("[data-profile-items-count]");

    const headerCreditsEl = document.querySelector("[data-user-credits]");

    // my listings & bids 
    const tabButtons = document.querySelectorAll("[data-tab-target]");
    const sectionEls = document.querySelectorAll("[data-profile-section]");
    const auctionsGridEl = document.querySelector("[data-profile-auctions]");
    const auctionsEmptyEl = document.querySelector("[data-profile-auctions-empty]");
    const bidsGridEl = document.querySelector("[data-profile-bids]");
    const bidsEmptyEl = document.querySelector("[data-profile-bids-empty]");


    // edit form
    const editButtonEl = document.querySelector("[data-edit-profile]");
    const editFormEl = document.querySelector("[data-profile-form]");
    const avatarInputEl = editFormEl?.querySelector("[name='avatar']");
    const bioInputEl = editFormEl?.querySelector("[name='bio']");
    const saveButtonEl = editFormEl?.querySelector("[data-profile-save]");
    const cancelButtonEl = editFormEl?.querySelector("[data-profile-cancel]");

    loadProfile(username);
    setupEditUI();
    setupTabs();
    loadUserAuctions(username);
    loadUserBids(username);

    // main
    async function loadProfile(name) {
        setStatus("Loading your profile...");

        try {
            const profile = await getProfileByName(name, { token });

            if (!profile) {
                setStatus("We could not load your profile right now.");
                return;
            }

            setStatus("");
            renderProfile(profile);
            populateEditForm(profile);
        } catch (error) {
            setStatus(
                "Sorry, there was a problem loading your profile. Please try again later."
            );
        }
    }

    /**
     * Render avatar, name email
     */
    function renderProfile(profile) {
        const displayName = profile.name || "Unknown user";

        if (nameEl) {
            nameEl.textContent = displayName;
        }

        // email
        if (emailEl && profile.email) {
            emailEl.textContent = profile.email;
        }

        // bio (text display)
        if (bioTextEl) {
            const bio = profile.bio || 
            "You haven't added a bio yet.";
            bioTextEl.textContent = bio;
        }

        // credits
        if (typeof profile.credits === "number") {
            const creditsText = `${profile.credits} NOK`;
            if (creditsEl) {
                creditsEl.textContent = creditsText;
            }
            
            // display credit in header
            if (headerCreditsEl) {
                headerCreditsEl.innerHTML = `
                     <span class="credit-label">Credit:</span> ${creditsText}
                    `;
            } 
        }

        // items on auction
        if (itemsCountEl) {
            const count =
                profile._count?.listings ??
                (Array.isArray(profile.listings) ? profile.listings.length : 0);

            itemsCountEl.textContent = `• ${count} items on auction`;
        }

        // avatar
        const avatarUrl = profile.avatar?.url || "../images/default-user.jpg";
        const avatarAlt =
            profile.avatar?.alt || `${displayName}'s avatar`;

        if (avatarImgEl) {
            avatarImgEl.src = avatarUrl;
            avatarImgEl.alt = avatarAlt;
        }
    }

    /**
     * Prefill the edit form with current values
     */
    function populateEditForm(profile) {
        if (!editFormEl) return;

        if (avatarInputEl) {
            avatarInputEl.value = profile.avatar?.url || "";
        }

        if (bioInputEl) {
            bioInputEl.value = profile.bio || "";
        }
    }

    // edit profile
    function setupEditUI() {
        if (!editButtonEl || !editFormEl) return;

        // show form when clicking "edit profile"
        editButtonEl.addEventListener("click", () => {
            const isHidden = editFormEl.hasAttribute("hidden");

            if (isHidden) {
                editFormEl.removeAttribute("hidden");
                editButtonEl.textContent = "Close edit";
            } else {
                editFormEl.setAttribute("hidden", "");
                editButtonEl.textContent = "Edit profile";
                setStatus("");
            }
        });

        // cancel button
        if (cancelButtonEl) {
            cancelButtonEl.addEventListener("click", (event) => {
                event.preventDefault();
                editFormEl.setAttribute("hidden", "");
                editButtonEl.textContent = "Edit profile";
                setStatus("");
                loadProfile(username);
            });
        }

        editFormEl.addEventListener("submit", handleEditSubmit);
    }

    async function handleEditSubmit(event) {
        event.preventDefault();

        if (!avatarInputEl || !bioInputEl) return;

        const avatarUrl = avatarInputEl.value.trim();
        const bio = bioInputEl.value.trim();

        const payload = {
            bio,
            avatar: avatarUrl
                ? { url: avatarUrl, alt: `${username}'s avatar` }
                : undefined,
        };

        setSavingState(true);
        setStatus("Saving your changes...");

        try {
            const updatedProfile = await updateProfile(username, payload, token);
            renderProfile(updatedProfile);
            populateEditForm(updatedProfile);
            setStatus("Your profile has been updated.");
        } catch (error) {
            setStatus("We couldn't save your changes. Please try again.");
        } finally {
            setSavingState(false);
        }
    }

    // tabs: auctions / bids
    function setupTabs() {
        if (!tabButtons.length || !sectionEls.length) return;

        tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.tabTarget;

                // update active state on button
                tabButtons.forEach((btn) => {
                    const isActive = btn === button;
                    btn.classList.toggle("profile-tab--active", isActive);

                    if (isActive) {
                        btn.setAttribute("aria-current", "page");
                    } else {
                        btn.removeAttribute("aria-current");
                    }
                });

                // show/hide sections
                sectionEls.forEach((section) => {
                    const sectionName = section.dataset.profileSection;
                    section.hidden = sectionName !== target;
                });
            });
        });
    }

    // my auctions
    async function loadUserAuctions(name) {
        if (!auctionsGridEl) return;

        clearElement(auctionsGridEl);
        hideElement(auctionsEmptyEl);

        const loadingEl = document.createElement("p");
        loadingEl.className = "profile-status-inline";
        loadingEl.textContent = "Loading your auctions...";
        auctionsGridEl.appendChild(loadingEl);

        try {
            const listings = await getProfileListings(name, { token });

            clearElement(auctionsGridEl);

            if (!Array.isArray(listings) || listings.length === 0) {
                showElement(auctionsEmptyEl);
                return;
            }

            renderUserAuctions(listings);
            hideElement(auctionsEmptyEl);
        } catch (error) {
            clearElement(auctionsGridEl);

            const errorEl = document.createElement("p");
            errorEl.className = "profile-error";
            errorEl.textContent =
                "We couldn't load your auctions right now. Please try again later.";
                auctionsGridEl.appendChild(errorEl);

                showElement(auctionsEmptyEl);
        }
    }

    function renderUserAuctions(listings) {
        if (!auctionsGridEl) return;
        
        const fragment = document.createDocumentFragment();

        listings.forEach((listing) => {
            const card = document.createElement("article");
            card.className = "listing-card profile-listing-card";
            card.dataset.listingId = listing.id;

            const imageUrl = listing.media?.[0]?.url || "../images/placeholder-listing.jpg";
            const imageAlt = listing.media?.[0]?.alt || listing.title || "Listing image";

            const cardInner = document.createElement("div");
            cardInner.className = "listing-card-link";

            const media = document.createElement("figure");
            media.className = "listing-card-media";

            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = imageAlt;
            img.loading = "lazy";
            img.className = "listing-card-image";

            media.appendChild(img);

            const body = document.createElement("div");
            body.className = "listing-card-body";

            const titleEl = document.createElement("h3");
            titleEl.className = "listing-card-title";
            titleEl.textContent = listing.title || "Untitled listing";

            const metaEl = document.createElement("p");
            metaEl.className = "listing-card-info";

            const endsAt = listing.endsAt ? new Date(listing.endsAt) : null;
            const bidsCount = listing._count?.bids ?? 0;

            metaEl.textContent = [
                endsAt ? `Ends ${endsAt.toLocaleDateString()}` : "",
                `${bidsCount} bid${bidsCount === 1 ? "" : "s"}`,
            ]

                .filter(Boolean)
                .join(" • ");
            
            body.appendChild(titleEl);
            body.appendChild(metaEl);

            cardInner.appendChild(media);
            cardInner.appendChild(body);

            const actions = document.createElement("div");
            actions.className = "listing-card-actions";

            const viewLink = document.createElement("a");
            viewLink.href = `../post/listing.html?id=${encodeURIComponent(listing.id)}`;
            viewLink.className = "btn btn-secondary btn-sm";
            viewLink.textContent = "View";

            const editLink = document.createElement("a");
            editLink.href = `../post/edit.html?id=${encodeURIComponent(listing.id)}`;
            editLink.className = "btn btn-secondary btn-sm";
            editLink.textContent = "Edit";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", handleDeleteListing);

            actions.appendChild(viewLink);
            actions.appendChild(editLink);
            actions.appendChild(deleteButton);

            card.appendChild(cardInner);
            card.appendChild(actions);

            fragment.appendChild(card);
        });

        clearElement(auctionsGridEl);
        auctionsGridEl.appendChild(fragment);
    }

    async function handleDeleteListing(event) {
        const card = event.currentTarget.closest("[data-listing-id]");
        const listingId = card?.dataset.listingId;

        if (!listingId) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this listing? This cannot be undone."
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await deleteListing(listingId, token);
            card.remove();

            // refresh profile so "items on auction count is accurate"
            loadProfile(username);

            // if no cards left, show empty state
            if (auctionsGridEl && auctionsGridEl.children.length === 0) {
                showElement(auctionsEmptyEl);
            }
        } catch (error) {
            alert("We couldn't delete this listing right now. Please try again.");
        }
    }

    // My bids
    async function loadUserBids(name) {
        if (!bidsGridEl) return;

        clearElement(bidsGridEl);
        hideElement(bidsEmptyEl);

        const loadingEl = document.createElement("p");
        loadingEl.className = "profile-status-inline";
        loadingEl.textContent = "Loading your bids...";
        bidsGridEl.appendChild(loadingEl);

        try {
            const bids = await getProfileBids(name, { token });

            clearElement(bidsGridEl);

            if (!Array.isArray(bids) || bids.length === 0) {
                showElement(bidsEmptyEl);
                return;
            }

            renderUserBids(bids);
            hideElement(bidsEmptyEl);
        } catch (error) {
            const errorEl = document.createElement("p");
            errorEl.className = "profile-error";
            errorEl.textContent =
                "We couldn't load your bids right now. Please try again later.";
            bidsGridEl.appendChild(errorEl);

            showElement(bidsEmptyEl);
        }
    }

    function renderUserBids(bids) {
        if (!bidsGridEl) return;

        const fragment = document.createDocumentFragment();

        bids.forEach((bid) => {
            const listing = bid.listing;

            const card = document.createElement("article");
            card.className = "listing-card profile-bid-card";

            const imageUrl = listing?.media?.[0]?.url || "../images/no-image.jpg";
            const imageAlt = listing?.media?.[0]?.alt || listing?.title || "Listing image";

            const cardInner = document.createElement("div");
            cardInner.className = "listing-card-link";

            const media = document.createElement("figure");
            media.className = "listing-card-media";

            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = imageAlt;
            img.loading = "lazy";
            img.className = "listing-card-image";

            media.appendChild(img);

            const body = document.createElement("div");
            body.className = "listing-card-body";

            const titleEl = document.createElement("h3");
            titleEl.className = "listing-card-title";
            titleEl.textContent = listing?.title || "Listing";

            const metaEl = document.createElement("p");
            metaEl.className = "listing-card-info";

            const created = bid.created ? new Date(bid.created) : null;

            metaEl.textContent = [
                `Your bid: ${bid.amount} credits`,
                created ? `Placed ${created.toLocaleString()}` : "",
            ]

                .filter(Boolean)
                .join(" • ");

            body.appendChild(titleEl);
            body.appendChild(metaEl);

            cardInner.appendChild(media);
            cardInner.appendChild(body);

            const actions = document.createElement("div");
            actions.className = "listing-card-actions";

            if (listing?.id) {
                const viewLink = document.createElement("a");
                viewLink.href = `../post/listing.html?id=${encodeURIComponent(listing.id)}`;
                viewLink.className = "btn btn-secondary btn-sm";
                viewLink.textContent = "View Listing";
                actions.appendChild(viewLink);
            }

            cardInner.appendChild(actions);
            card.appendChild(cardInner);

            fragment.appendChild(card);
        });

        clearElement(bidsGridEl);
        bidsGridEl.appendChild(fragment);
    }
    
    // helpers
    function setStatus(message) {
        if (!statusEl) return;
        statusEl.textContent = message;
    }

    function setSavingState(isSaving) {
        if (!saveButtonEl) return;
        saveButtonEl.disabled = isSaving;
        saveButtonEl.textContent = isSaving ? "Saving..." : "Save changes";
    }

    function showElement(el) {
        if (!el) return;
        el.hidden = false;
    }

    function hideElement(el) {
        if (!el) return;
        el.hidden = true;
    }

    function clearElement(el) {
        if (!el) return;
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
});