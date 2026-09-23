const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { action } = req.body || {};

    // ==========================================
    // SIGN UP
    // ==========================================

    if (action === "signup") {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email and password are required.",
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Account created successfully. Please check your email to confirm your account.",
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
            }
          : null,
      });
    }

    // ==========================================
    // SIGN IN
    // ==========================================

    if (action === "signin") {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Signed in successfully.",
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || "",
            }
          : null,
        session: data.session,
      });
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    if (action === "forgot-password") {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email address is required.",
        });
      }

      const baseUrl =
        process.env.SITE_URL ||
        `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;

      const redirectTo = `${baseUrl}/resetpassword.html`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        },
      );

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }

    // ==========================================
    // INVALID ACTION
    // ==========================================

    return res.status(400).json({
      success: false,
      message: "Invalid authentication action.",
    });
  } catch (error) {
    console.error("Auth API error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
