// listing.js
// Handles: 
// - load single listing by ID
// - render details + image + bids
// - show bid form based on auth/ownership
// - place a bid on other users listings


import { getListingById, placeBid } from "../api/auction.js";
import { getAuthToken, getCurrentUser } from "../api/session.js";

document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.querySelector("#listing-status");
    const imageEl = document.querySelector("[data-listing-image]");
    const titleEl = document.querySelector("[data-listing-title]");
    const sellerEl = document.querySelector("[data-listing-seller]");
    const descEl = document.querySelector("[data-listing-description]");
    const currentBidTopEl = document.querySelector("[data-listing-current-bid]");
    const currentBidSecondaryEl = document.querySelector("[data-listing-current-bid-secondary]");
    const endsInEl = document.querySelector("[data-listing-ends-in]");
    const bidsListEl = document.querySelector("[data-listing-bids]");
    const bidsEmptyEl = document.querySelector("[data-bids-empty-message]");
    const bidLoginMessageEl = document.querySelector("[data-bid-login-message]");
    const bidFormEl = document.querySelector("[data-bid-form]");
    const bidErrorEl = document.querySelector("[data-bid-error]");

    let currentListing = null;
    const user = getCurrentUser();
    const token = getAuthToken();

    // 1. Get ID from query string
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("id");

    if (!listingId) {
        if (statusEl) {
            statusEl.textContent = "Listing not found. Please go back to the listings page.";
        }
        return;
    }

    if (bidFormEl) {
        bidFormEl.addEventListener("submit", handleBidSubmit);
    }

    loadListing(listingId);

    async function loadListing(id) {
        if (statusEl) {
            statusEl.textContent = "Loading listing...";
        }

        try {
            const listing = await getListingById(id);

            if (!listing) {
                if (statusEl) statusEl.textContent = "Listing not found.";
                return;
            }

            currentListing = listing;

            if (statusEl) statusEl.textContent = "";

            renderListingDetails(listing);
            renderBidHistory(listing);
            applyAuthState(listing);
        } catch (error) {
            if (statusEl) {
                statusEl.textContent =
                "Sorry, we couldn't load this listing right now. Please try again later.";
            }  
        }    
    }
    
    /**
     * Fill in title, description, image, seller, current bid, ends in
     */
    function renderListingDetails(listing) {
        const title = listing.title || "Untitled listing";
        if (titleEl) titleEl.textContent = title;

        const description =
        listing.description ||
        "No description has been added for this listing yet.";
        if (descEl) descEl.textContent = description;

        // image / media
        let imageUrl = "";
        let imageAlt = title;

        if (Array.isArray(listing.media) && listing.media.length > 0) {
            const firstMedia = listing.media[0];
            imageUrl = firstMedia?.url || "";
            imageAlt = firstMedia?.alt || title;
        }

        if (!imageUrl) {
            // fallback placeholder
            imageUrl = "../../images/no-image.jpg";
            imageAlt = imageAlt || "Listing image placeholder";
        }

        if (imageEl) {
            imageEl.src = imageUrl;
            imageEl.alt = imageAlt;
        }

        // seller
        if (sellerEl) {
            sellerEl.textContent = listing.seller?.name || "Unknown seller";
        }

        // highest/current bid (top & left panel)
        const highestBid = getHighestBid(listing);
        const bidText = highestBid ? `${highestBid.amount} NOK` : "No bids yet";

        if (currentBidTopEl) currentBidTopEl.textContent = bidText;
        if (currentBidSecondaryEl) currentBidSecondaryEl.textContent = bidText;

        // ends in
        if (endsInEl) {
            endsInEl.textContent = formatTimeRemaining(listing.endsAt);
        }
    }

    function getHighestBid(listing) {
        if (!Array.isArray(listing.bids) || !listing.bids.length) {
            return null;
        }

        return listing.bids.reduce((max, bid) =>
            !max || bid.amount > max.amount ? bid : max,
            null 
        );
    }

    function formatTimeRemaining(endsAt) {
        if (!endsAt) return "Unknown";

        const end = new Date(endsAt);
        const now = new Date();
        const diffMs = end - now;

        if (diffMs <= 0) {
            return "Ended";
        }

        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / (60 * 60 *24));
        const hours = Math.floor(
            (totalSeconds % (60 * 60 * 24)) / (60 * 60)
        );

        if (days <= 0 && hours <= 0) {
            return "Less than an hour";
        }

        if (days <= 0) {
            return `${hours} hour${hours === 1 ? "" : "s"}`;
        }

        return `${days} day${days === 1 ? "" : "s"} and ${hours} hour${hours === 1 ? "" : "s"}`;
    }

    /**
     * Render bid history (newest first)
     */
    function renderBidHistory(listing) {
        if (!bidsListEl || !bidsEmptyEl) return;

        const bids = Array.isArray(listing.bids) ? [...listing.bids] : [];

        if (!bids.length) {
            bidsListEl.innerHTML = "";
            bidsEmptyEl.hidden = false;
            return;
        }

        bids.sort((a, b) => {
            const aDate = a.created ? new Date(a.created) : 0;
            const bDate = b.created ? new Date(b.created) : 0;
            return bDate - aDate; // newest to oldest
        });

        bidsListEl.innerHTML = "";

        bids.forEach((bid) => {
            const li = document.createElement("li");
            li.className = "bid-item";

            const bidderName = bid.bidder?.name || "Unknown bidder";
            const amountText = `${bid.amount} NOK`;

            li.innerHTML = `
              <span class="bidder-name">${bidderName}</span>
              <span class="bid-amount">${amountText}</span>
            `;
            bidsListEl.appendChild(li);
        });

        bidsEmptyEl.hidden = true;
    }

    /**
     * Toggle UI based on:
     * -logged out
     * -logged in (not owner)
     * -owner (cannot bid)
     */
    function applyAuthState(listing) {
        const isLoggedIn = Boolean(token && user);
        const sellerName = listing.seller?.name;
        const isOwner = isLoggedIn && sellerName && user?.name === sellerName;

        if (bidFormEl) bidFormEl.hidden = true;
        if (bidLoginMessageEl) bidLoginMessageEl.hidden = true;
        if (bidErrorEl) bidErrorEl.textContent = "";

        // owner: can't bid on own listing
        if (isOwner) {
            if (bidLoginMessageEl) {
                bidLoginMessageEl.hidden = false;
                bidLoginMessageEl.textContent =
                    "You can't bid on your own listing. Manage this listing from your profile.";
            }
            return;
        }

        // logged in not owner (show bid form)
        if (isLoggedIn) {
            if (bidFormEl) bidFormEl.hidden = false;
            return;
        }

        // logged out: show: sign in to place bid
        if (bidLoginMessageEl) {
            bidLoginMessageEl.hidden = false;
            bidLoginMessageEl.textContent = "Sign in to place a bid.";
        }
    }

    // submit bid handler
    async function handleBidSubmit(event) {
        event.preventDefault();
        clearBidError();

        if (!currentListing) {
            showBidError("We couldn't find this listing. Please refresh the page and try again.");
            return;
        }

        if (!token) {
            showBidError("You must be logged in to place a bid.");
            return;
        }

        const formData = new FormData(bidFormEl);
        const rawAmount = formData.get("amount");
        const amount = Number(rawAmount);

        if (!rawAmount || Number.isNaN(amount) || amount <= 0) {
            showBidError("Please enter a valid bid amount.");
            return;
        }

        const highestBid = getHighestBid(currentListing);
        if (highestBid && amount <= highestBid.amount) {
            showBidError(
                `Your bid must be higher than the current bid (${highestBid.amount} NOK).`
            );
            return;
        }

        const submitButton = bidFormEl.querySelector("button[type='submit']");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Placing bid...";
        }

        try {
            await placeBid(currentListing.id, amount, token);

            const updated = await getListingById(currentListing.id);
            currentListing = updated;

            renderListingDetails(updated);
            renderBidHistory(updated);
            applyAuthState(updated);

            const amountInput = bidFormEl.querySelector("[name='amount']");
            if (amountInput) {
                amountInput.value = "";
            }
        } catch (error) {
            showBidError(
                error?.message ||
                    "We couldn't place your bid right now. Please try again."
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Place bid";
            }
        }
    }

    function clearBidError() {
        if (bidErrorEl) {
            bidErrorEl.textContent = "";
        }
    }

    function showBidError(message) {
        if (bidErrorEl) {
            bidErrorEl.textContent = message;
        }
    }
});