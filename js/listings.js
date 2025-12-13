import { getListings } from "./api/auction.js";

document.addEventListener("DOMContentLoaded", () => {
    const gridEl = document.querySelector("#popular-listings");
    const statusEl = document.querySelector("#listings-status");
    const searchForm = document.querySelector(".browse-search");
    const searchInput = document.querySelector("#search-listings");
    const sortSelect = document.querySelector("#sort");

    let allListings = [];

    if (!gridEl) return;

    loadListings();

    async function loadListings() {
        // show loading message
        if (statusEl) {
            statusEl.textContent = "Loading listings...";
        }

        try {
            // fetch active listings, newest first
            const listings = await getListings({
                active: true,
                sort: "created",
                sortOrder: "desc",
            });

            if (!Array.isArray(listings) || listings.length === 0) {
                gridEl.innerHTML = "";
                if (statusEl) {
                    statusEl.textContent = "No listings are available at the moment.";
                }
                return;
            }

            // save a copy for search/filter
            allListings = listings;

            // clear any placeholder cards and status
            gridEl.innerHTML = "";
            if (statusEl) {
                statusEl.textContent = "";
            }

            renderListings(allListings);
        } catch (error) {
            //show error instead of breaking
            if (statusEl) {
                statusEl.textContent =
                "Sorry, we couldn't load the listings right now. Please try again later.";
            }
        }
    }

    /**
     * Render a set of listings into the grid element.
     * 
     * @param {any[]} listings
     */
    function renderListings(listings) {
        gridEl.innerHTML = "";

        listings.forEach((listing) => {
            const card = createListingCard(listing);
            gridEl.appendChild(card);
        });
    }
    
    /**
     * Create one listing card <li> element.
     * Safely handles missing title, description and media
     * 
     * @param {any} listing
     * @returns {HTMLElement}
     */
    function createListingCard(listing) {
        const li = document.createElement("li");
        li.className = "listing-card";

        const title = listing.title || "Untitled listing";
        const description =
          listing.description ||
          "No description has been added for this listing yet."; 

        // handle media safely
        let imageUrl = "";
        let imageAlt = "";

        if (Array.isArray(listing.media) && listing.media.length > 0) {
            const firstMedia = listing.media[0];
            imageUrl = firstMedia?.url || "";
            imageAlt = firstMedia?.alt || title;
        }

        // fallback image if no url provided
        if (!imageUrl) {
            // a placeholder image 
            imageUrl = "../images/no-image.jpg";
            imageAlt = imageAlt || "Placeholder listing image";
        }

        // short description
        const maxLength = 80;
        let snippet = description;
        if (description.length > maxLength) {
            snippet = description.slice(0, maxLength).trim() + "...";
        }

        // link to single listing page 
        const listingUrl = `/post/listing.html?id=${encodeURIComponent(listing.id)}`;

        li.innerHTML = `
         <article>
           <a href="${listingUrl}" class="listing-card-link">
             <figure class="listing-card-media">
               <img src="${imageUrl}" alt="${imageAlt}" class="listing-card-image">
             </figure>
             <div class="listing-card-body">
               <h3 class="listing-card-title">
                 ${title}
               </h3>
               <p class="listing-card-info">
                 ${snippet}
               </p>
               <span class="listing-card-more">read more</span>
             </div>
           </a>
         </article>
        `;
        return li;
    }

    // Search functionality

    if (searchForm && searchInput) {
        // handle submit 
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const query = searchInput.value.trim().toLowerCase();

            // if empty -> reset to all listings
            if (!query) {
                renderListings(allListings);
                if (statusEl) statusEl.textContent = "";
                return;
            }

            const filtered = allListings.filter((listing) => {
                const title = listing.title?.toLowerCase() || "";
                const description = listing.description?.toLowerCase() || "";
                return title.includes(query) || description.includes(query);
            });

            if (!filtered.length) {
                renderListings([]);
                if (statusEl) {
                    statusEl.textContent = "No results found.";
                }
            } else {
                if (statusEl) statusEl.textContent = "";
                renderListings(filtered);
            }
        });

        // reset on clear ( when user deletes all text)
        searchInput.addEventListener("input", () => {
            const value = searchInput.value.trim();
            if (!value) {
                renderListings(allListings);
                if (statusEl) statusEl.textContent = "";
            }
        });
    }

    // sorting functionality
    if(sortSelect) {
        sortSelect.addEventListener("change", (event) => {
            const value = event.target.value;
            applySorting(value);
        });
    }

    /**
     * Apply sorting to the current listings and render them.
     * 
     * @param {string} sortValue
     */
    function applySorting(sortValue) {
        if(!Array.isArray(allListings) || allListings.length === 0) {
            return;
        }

        // Start from the original order from API
        let sorted = [...allListings];

        switch (sortValue) {
            case "newest":
                //Newest first
                sorted.sort((a, b) => {
                    const aDate = new Date(a.created);
                    const bDate = new Date(b.created);
                    return bDate - aDate;
                });
                break;
            case "highest bid":
                // sort by number of bids
                sorted.sort((a, b) => {
                    const aBids = a._count?.bids ?? 0;
                    const bBids = b._count?.bids ?? 0;
                    return bBids - aBids;
                });
                break;
            case "recommended":
            default:
                // Recommended
                sorted = [...allListings];
                break;
        }

        // clear any "no results" or other messages
        if (statusEl) {
            statusEl.textContent = "";
        }

        renderListings(sorted);
    }
});