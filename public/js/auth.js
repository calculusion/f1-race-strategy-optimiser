// ==========================================
// AUTH CONFIGURATION
// ==========================================

const DASHBOARD_URL = "/home/overview/race-overview.html";
const SIGNIN_URL = "/signin.html";
const API_URL = "/api/auth";

// ==========================================
// API REQUEST
// ==========================================

async function authRequest(payload) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong.");
    }

    return result;
  } catch (error) {
    console.error("Authentication request failed:", error);
    throw error;
  }
}

// ==========================================
// MESSAGE DISPLAY
// ==========================================

function showAuthMessage(form, message, type = "error") {
  let messageElement = form.querySelector("[data-auth-message]");

  if (!messageElement) {
    messageElement = document.createElement("div");
    messageElement.setAttribute("data-auth-message", "");
    messageElement.className = "mt-3 text-sm";
    form.appendChild(messageElement);
  }

  messageElement.textContent = message;

  messageElement.classList.remove(
    "text-red-500",
    "text-green-500",
    "text-yellow-500",
  );

  if (type === "success") {
    messageElement.classList.add("text-green-500");
  } else if (type === "warning") {
    messageElement.classList.add("text-yellow-500");
  } else {
    messageElement.classList.add("text-red-500");
  }
}

function clearAuthMessage(form) {
  const messageElement = form.querySelector("[data-auth-message]");

  if (messageElement) {
    messageElement.textContent = "";
  }
}

// ==========================================
// BUTTON LOADING STATE
// ==========================================

function setButtonLoading(button, loading, loadingText = "Please wait...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent.trim();
    button.disabled = true;
    button.classList.add("opacity-60", "cursor-not-allowed");
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.classList.remove("opacity-60", "cursor-not-allowed");

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

// ==========================================
// MANUAL SIGN IN
// ==========================================

const signinForm = document.getElementById("signinForm");

if (signinForm) {
  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAuthMessage(signinForm);

    const email = signinForm.elements.namedItem("email")?.value.trim();
    const password = signinForm.elements.namedItem("password")?.value;

    const submitButton = signinForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showAuthMessage(signinForm, "Please enter your email and password.");
      return;
    }

    setButtonLoading(submitButton, true, "Signing in...");

    try {
      const result = await authRequest({
        action: "signin",
        email,
        password,
      });

      if (!result.success || !result.session) {
        throw new Error(result.message || "Sign-in failed. Please try again.");
      }

      // Save the session in the browser.
      const { data, error } = await supabaseClient.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("Your session could not be saved.");
      }

      // Confirm the session is available before navigating.
      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Unable to verify your login session.");
      }

      window.location.replace(DASHBOARD_URL);
    } catch (error) {
      console.error("Sign-in error:", error);

      showAuthMessage(
        signinForm,
        error.message || "Unable to sign in. Please try again.",
      );

      setButtonLoading(submitButton, false);
    }
  });
}

// ==========================================
// SIGN UP
// ==========================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAuthMessage(signupForm);

    const name = signupForm.elements.namedItem("name")?.value.trim();
    const email = signupForm.elements.namedItem("email")?.value.trim();
    const password = signupForm.elements.namedItem("password")?.value;

    const submitButton = signupForm.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
      showAuthMessage(signupForm, "Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      showAuthMessage(signupForm, "Password must be at least 6 characters.");
      return;
    }

    setButtonLoading(submitButton, true, "Creating account...");

    try {
      const result = await authRequest({
        action: "signup",
        name,
        email,
        password,
      });

      if (!result.success) {
        throw new Error(result.message || "Signup failed.");
      }

      showAuthMessage(
        signupForm,
        result.message ||
          "Account created. Please check your email to confirm.",
        "success",
      );

      signupForm.reset();
    } catch (error) {
      console.error("Signup error:", error);

      showAuthMessage(
        signupForm,
        error.message || "Unable to create your account.",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAuthMessage(forgotPasswordForm);

    const email = forgotPasswordForm.elements.namedItem("email")?.value.trim();

    const submitButton = forgotPasswordForm.querySelector(
      'button[type="submit"]',
    );

    if (!email) {
      showAuthMessage(forgotPasswordForm, "Please enter your email address.");
      return;
    }

    setButtonLoading(submitButton, true, "Sending...");

    try {
      const result = await authRequest({
        action: "forgot-password",
        email,
      });

      if (!result.success) {
        throw new Error(result.message || "Unable to send the reset email.");
      }

      showAuthMessage(
        forgotPasswordForm,
        result.message ||
          "If an account exists, a password reset link has been sent.",
        "success",
      );

      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Forgot password error:", error);

      showAuthMessage(
        forgotPasswordForm,
        error.message || "Unable to send the reset email.",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
}

// ==========================================
// GOOGLE AND GITHUB LOGIN
// ==========================================

async function socialLogin(provider) {
  try {
    const redirectTo = `${window.location.origin}${DASHBOARD_URL}`;

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`${provider} login error:`, error);
    alert(error.message || `Unable to sign in with ${provider}.`);
  }
}

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    const provider = button.dataset.provider;

    if (provider !== "google" && provider !== "github") {
      return;
    }

    setButtonLoading(button, true, "Redirecting...");

    await socialLogin(provider);
  });
});

// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.passwordToggle;
    const input = document.getElementById(targetId);

    if (!input) return;

    input.type = input.type === "password" ? "text" : "password";

    button.setAttribute(
      "aria-label",
      input.type === "password" ? "Show password" : "Hide password",
    );
  });
});
