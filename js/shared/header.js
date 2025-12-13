document.addEventListener("DOMContentLoaded", () => {
    setupMenuToggle();
    setupAuthHeader();
});

function setupMenuToggle() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".header-nav");

    if (!toggle || !nav) return;

    // Open/close on button click
    toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");
            toggle.classList.toggle("open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
    });

    //Close menu when clicking outside
        document.addEventListener("click", (event) => {
            const isOpen = nav.classList.contains("is-open");

            if (
                isOpen &&
                !nav.contains(event.target) &&
                !toggle.contains(event.target)
            ) {
                nav.classList.remove("is-open");
                toggle.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });   
}

function setupAuthHeader() {
    const token = localStorage.getItem("lm_token");
    const rawUser = localStorage.getItem("lm_user");

    let user = null;
    if (rawUser) {
        try {
            user = JSON.parse(rawUser);
        } catch {
            user = null;
        }
    }

    const isLoggedIn = Boolean(token && user);

    const loginLinks = document.querySelectorAll(".login-link");
    const registerLinks = document.querySelectorAll(".register-button, .register-link");
    const profileLinks = document.querySelectorAll(".profile-link");
    const logoutLinks = document.querySelectorAll(".logout-link");
    const creditsEl = document.querySelector("[data-user-credits]");

    if (isLoggedIn) {
        // hide login/register
        loginLinks.forEach(hideElement);
        registerLinks.forEach(hideElement);

        //show profile + logout
        profileLinks.forEach(showElement);
        logoutLinks.forEach(showElement);

        // show credits placeholder only when logged in ( fill real value later)
        if (creditsEl) {
            creditsEl.style.display = "block";
            creditsEl.textContent = ""; //replaced later
        }
    } else {
        // show login/register
        loginLinks.forEach(showElement);
        registerLinks.forEach(showElement);

        // hide profile + logout
        profileLinks.forEach(hideElement)
        logoutLinks.forEach(hideElement);

        if (creditsEl) {
            creditsEl.style.display = "none";
            creditsEl.textContent = "";
        }
    }

    // logout functionality
    logoutLinks.forEach((links) => {
        links.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.removeItem("lm_token");
            localStorage.removeItem("lm_user");

            // go to home after logout
            window.location.href = "../index.html"
        });
    });
}

function showElement(el) {
    el.hidden = false;
    el.style.display = "";
}

function hideElement(el) {
    el.hidden = true;
    el.style.display = "none";
}



