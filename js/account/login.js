import { loginUser } from "../api/auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#login-form");
    const errorEl = document.querySelector("#login-error");
    const successEl = document.querySelector("#login-success");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Clear previous messages
        if (errorEl) errorEl.textContent = "";
        if (successEl) successEl.textContent = "";

        const formData = new FormData(form);
        const email = formData.get("email")?.toString().trim();
        const password = formData.get("password")?.toString();

        // Validation
        if (!email || !password) {
            if (errorEl) {
                errorEl.textContent = "Please fill in both email and password.";
            }
            return;
        }

        // Email must be @stud.noroff.no
        if (!email.endsWith("@stud.noroff.no")) {
            if (errorEl) {
                errorEl.textContent = "You must use a @stud.noroff.no email address to sign in."
            }
            return;
        }

        // Disable button while submitting 
        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            // Calls Api
            const user = await loginUser({ email, password });

            // Save auth info to localStorage
            if (user.accessToken) {
                localStorage.setItem("lm_token", user.accessToken);
            }
            localStorage.setItem("lm_user", JSON.stringify(user));

            if (user.accessToken) {
                localStorage.setItem("accessToken", user.accessToken);
            }

            if (successEl) {
                successEl.textContent = "Login successful! Redirecting to your profile...";
            }

            // Redirect to profile
            setTimeout(() => {
                window.location.href = "profile.html";
            }, 1000);
        } catch (error) {
            if (errorEl) {
                errorEl.textContent =
                  error.message || "Login failed. Please check your details and try again.";
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
});