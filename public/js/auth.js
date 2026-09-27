// ==========================================
// EMAIL AUTH REQUEST
// ==========================================

async function authRequest(payload) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed.");
  }

  return data;
}

// ==========================================
// SOCIAL LOGIN
// ==========================================

async function socialLogin(provider) {
  try {
    const redirectTo = `${window.location.origin}/home/overview/race-overview.html`;

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error(`${provider} login error:`, error);

      alert(error.message);
    }
  } catch (error) {
    console.error("Social login error:", error);

    alert("Unable to continue with social login.");
  }
}

// ==========================================
// GOOGLE SIGN IN
// ==========================================

const googleSigninBtn = document.getElementById("googleSigninBtn");

if (googleSigninBtn) {
  googleSigninBtn.addEventListener("click", () => {
    socialLogin("google");
  });
}

// ==========================================
// GITHUB SIGN IN
// ==========================================

const githubSigninBtn = document.getElementById("githubSigninBtn");

if (githubSigninBtn) {
  githubSigninBtn.addEventListener("click", () => {
    socialLogin("github");
  });
}

// ==========================================
// GOOGLE SIGN UP
// ==========================================

const googleSignupBtn = document.getElementById("googleSignupBtn");

if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", () => {
    socialLogin("google");
  });
}

// ==========================================
// GITHUB SIGN UP
// ==========================================

const githubSignupBtn = document.getElementById("githubSignupBtn");

if (githubSignupBtn) {
  githubSignupBtn.addEventListener("click", () => {
    socialLogin("github");
  });
}

// ==========================================
// PASSWORD VISIBILITY
// ==========================================

function setupPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!button || !input) {
    return;
  }

  button.addEventListener("click", () => {
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    button.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password",
    );

    const icon = button.querySelector("i");

    if (icon) {
      icon.setAttribute("data-lucide", isHidden ? "eye-off" : "eye");

      if (window.lucide) {
        lucide.createIcons();
      }
    }
  });
}

// ==========================================
// PASSWORD VISIBILITY
// ==========================================

function setupPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!button || !input) return;

  button.addEventListener("click", () => {
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    button.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password",
    );

    // Replace the icon completely
    button.innerHTML = `
      <i
        data-lucide="${isHidden ? "eye-off" : "eye"}"
        class="w-4 h-4"
      ></i>
    `;

    lucide.createIcons();
  });
}

// ==========================================
// SIGNUP PASSWORD
// ==========================================

setupPasswordToggle("toggleSignupPassword", "signupPassword");

// ==========================================
// SIGNUP CONFIRM PASSWORD
// ==========================================

setupPasswordToggle("toggleSignupConfirmPassword", "signupConfirmPassword");

// ==========================================
// SIGNIN PASSWORD
// ==========================================

setupPasswordToggle("toggleSigninPassword", "signinPassword");

// ==========================================
// RESET PASSWORD
// ==========================================

setupPasswordToggle("toggleResetPassword", "resetPassword");

// ==========================================
// RESET CONFIRM PASSWORD
// ==========================================

setupPasswordToggle("toggleResetConfirmPassword", "resetConfirmPassword");
