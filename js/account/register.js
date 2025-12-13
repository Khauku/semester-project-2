import { registerUser } from "../api/auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#register-form");
    const errorEl = document.querySelector("#register-error");
    const successEl = document.querySelector("#register-success");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        //Clear previous message
        if (errorEl) errorEl.textContent = "";
        if (successEl) successEl.textContent = "";

        const formData = new FormData(form);
        const name = formData.get("name")?.toString().trim();
        const email = formData.get("email")?.toString().trim();
        const password = formData.get("password")?.toString();

        // Validation
        if (!name || !email || !password) {
            if (errorEl) {
                errorEl.textContent = "Please fill in all fields";
            }
            return;
        }

        // Email must be @stud.noroff.no
        if (!email.endsWith("@stud.noroff.no")) {
            if (errorEl) {
                errorEl.textContent = "You must use a @stud.noroff.no email address to register."
            }
            return;
        }

        //Password length
        if (password.length < 8) {
            if (errorEl) {
                errorEl.textContent = "Your password must be at least 8 characters long."
            }
            return;
        }

        //Disable button while submitting
        const submitButton = form.querySelector("button[type='submit']");
        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            await registerUser({ name, email, password });

            if (successEl) {
                successEl.textContent =
                  "Registration successful! Redirecting you to the sign in page.";
            }

            // Small delay so message can be read
            setTimeout(() => {
                window.location.href = "/account/login.html";
            }, 1500);
        } catch (error) {
            if (errorEl) {
                errorEl.textContent =
                  error.message || "Registration failed. Please try again."            
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
});