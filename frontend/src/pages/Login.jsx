import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react";
import api from "../api/api";

function saveAuthenticatedUser(user, fallbackEmail = "") {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));

    if (user?.email) {
      localStorage.setItem("user_email", String(user.email));
    }

    const name =
      user?.name ||
      user?.full_name ||
      user?.fullName ||
      user?.username ||
      user?.first_name ||
      user?.given_name ||
      "";

    if (name) {
      localStorage.setItem("user_name", String(name).trim());
    }

    return;
  }

  if (fallbackEmail) {
    localStorage.setItem("user_email", String(fallbackEmail));

    const fallbackName = String(fallbackEmail)
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();

    if (fallbackName) {
      localStorage.setItem("user_name", fallbackName);
    }
  }
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(true);

  // =====================================================
  // GOOGLE SIGN-IN INITIALIZATION
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const initializeGoogle = () => {
      if (!isMounted) return;

      if (!window.google) {
        console.error("Google Identity Services failed to load.");

        setGoogleError(
          "Unable to load Google Login. Please refresh the page."
        );

        setGoogleLoading(false);
        return;
      }

      // IMPORTANT:
      // This must be configured in Vercel Environment Variables
      // as VITE_GOOGLE_CLIENT_ID
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      console.log(
        "Google Client ID loaded:",
        clientId ? "YES" : "NO"
      );

      if (!clientId) {
        console.error(
          "VITE_GOOGLE_CLIENT_ID is missing."
        );

        setGoogleError(
          "Google Login is not configured correctly."
        );

        setGoogleLoading(false);
        return;
      }

      const buttonContainer =
        document.getElementById("google-login-button");

      if (!buttonContainer) {
        console.error(
          "Google login button container not found."
        );

        setGoogleLoading(false);
        return;
      }

      // Clear previous Google button
      buttonContainer.innerHTML = "";

      try {
        // =================================================
        // INITIALIZE GOOGLE IDENTITY SERVICES
        // =================================================

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // =================================================
        // RENDER GOOGLE BUTTON
        // =================================================

        const isDarkTheme =
          document.documentElement.getAttribute("data-theme") === "dark" ||
          document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark");

        window.google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: isDarkTheme ? "filled_black" : "outline",
            size: "large",
            width: 350,
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
          }
        );

        setGoogleLoading(false);
      } catch (error) {
        console.error(
          "Google initialization error:",
          error
        );

        setGoogleError(
          "Google Login could not be initialized."
        );

        setGoogleLoading(false);
      }
    };

    // =====================================================
    // LOAD GOOGLE IDENTITY SERVICES SCRIPT
    // =====================================================

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (!script) {
      script = document.createElement("script");

      script.src =
        "https://accounts.google.com/gsi/client";

      script.async = true;
      script.defer = true;

      script.onload = initializeGoogle;

      script.onerror = () => {
        console.error(
          "Unable to load Google Identity Services."
        );

        if (isMounted) {
          setGoogleError(
            "Unable to load Google Login. Check your internet connection."
          );

          setGoogleLoading(false);
        }
      };

      document.body.appendChild(script);
    } else {
      // Script already exists

      if (window.google) {
        initializeGoogle();
      } else {
        script.addEventListener(
          "load",
          initializeGoogle,
          { once: true }
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // KEEP GOOGLE LOGIN BUTTON IN SYNC WITH GLOBAL THEME
  // =====================================================

  useEffect(() => {
    const buttonContainer = document.getElementById("google-login-button");

    if (!buttonContainer || !window.google?.accounts?.id) return;

    const renderGoogleButtonForTheme = () => {
      const isDarkTheme =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");

      buttonContainer.innerHTML = "";

      window.google.accounts.id.renderButton(buttonContainer, {
        theme: isDarkTheme ? "filled_black" : "outline",
        size: "large",
        width: 350,
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    const observer = new MutationObserver(renderGoogleButtonForTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [googleLoading]);

  // =====================================================
  // GOOGLE LOGIN RESPONSE
  // =====================================================

  async function handleGoogleResponse(response) {
    try {
      setGoogleError("");

      console.log(
        "Google credential received:",
        response?.credential ? "YES" : "NO"
      );

      // =================================================
      // CHECK GOOGLE CREDENTIAL
      // =================================================

      if (!response?.credential) {
        setGoogleError(
          "Google did not return a valid credential."
        );

        return;
      }

      // =================================================
      // SEND GOOGLE CREDENTIAL TO FASTAPI
      // =================================================

      const result = await api.post(
        "/api/auth/google",
        {
          credential: response.credential,
        }
      );

      console.log(
        "Google login successful:",
        result.data
      );

      // =================================================
      // CHECK JWT
      // =================================================

      if (!result.data?.access_token) {
        setGoogleError(
          "Login succeeded, but the server did not return an authentication token."
        );

        return;
      }

      // =================================================
      // SAVE JWT
      // =================================================

      localStorage.setItem(
        "access_token",
        result.data.access_token
      );

      // =================================================
      // SAVE USER
      // =================================================

      saveAuthenticatedUser(result.data.user, result.data.user?.email || email);

      // =================================================
      // GO TO DASHBOARD
      // =================================================

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        error?.code === "ERR_NETWORK" ||
        error?.message === "Network Error"
      ) {
        setGoogleError(
          "Cannot connect to FraudShield server. Please check your backend URL."
        );

        return;
      }

      // =================================================
      // BACKEND ERROR
      // =================================================

      setGoogleError(
        error?.response?.data?.detail ||
          "Google login failed. Please try again."
      );
    }
  }

  // =====================================================
  // EMAIL LOGIN
  // =====================================================

  async function handleLogin(event) {
    event.preventDefault();

    setGoogleError("");

    try {
      const result = await api.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      // =================================================
      // CHECK JWT
      // =================================================

      if (!result.data?.access_token) {
        setGoogleError(
          "Login succeeded, but the server did not return an authentication token."
        );

        return;
      }

      // =================================================
      // SAVE JWT
      // =================================================

      localStorage.setItem(
        "access_token",
        result.data.access_token
      );

      // =================================================
      // SAVE USER
      // =================================================

      saveAuthenticatedUser(result.data.user, result.data.user?.email || email);

      // =================================================
      // GO TO DASHBOARD
      // =================================================

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Email login error:",
        error
      );

      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        error?.code === "ERR_NETWORK" ||
        error?.message === "Network Error"
      ) {
        setGoogleError(
          "Cannot connect to FraudShield server. Please check your backend URL."
        );

        return;
      }

      // =================================================
      // BACKEND ERROR
      // =================================================

      setGoogleError(
        error?.response?.data?.detail ||
          "Email login failed. Please check your email and password."
      );
    }
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="auth-page" data-page="login">
      <div className="auth-container">

        {/* =================================================
            BACK TO HOME
        ================================================= */}

        <Link
          to="/"
          className="back-home"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        {/* =================================================
            AUTH CARD
        ================================================= */}

        <div className="auth-card">

          {/* =================================================
              LOGO
          ================================================= */}

          <div className="auth-logo">
            <ShieldCheck size={30} />
          </div>

          {/* =================================================
              TITLE
          ================================================= */}

          <h1>
            Welcome back
          </h1>

          <p className="auth-subtitle">
            Sign in to access your
            FraudShield security dashboard.
          </p>

          {/* =================================================
              GOOGLE LOGIN
          ================================================= */}

          <div
            id="google-login-button"
            className="google-login-container"
          />

          {googleLoading && (
            <p
              style={{
                textAlign: "center",
                marginTop: "10px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Loading Google Login...
            </p>
          )}

          {/* =================================================
              GOOGLE ERROR
          ================================================= */}

          {googleError && (
            <div className="google-error">
              {googleError}
            </div>
          )}

          {/* =================================================
              DIVIDER
          ================================================= */}

          <div className="auth-divider">
            <span>
              OR CONTINUE WITH EMAIL
            </span>
          </div>

          {/* =================================================
              EMAIL LOGIN
          ================================================= */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <div className="form-group">
              <label>
                Email address
              </label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <label>
                Password
              </label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            {/* SIGN IN */}

            <button
              type="submit"
              className="auth-button"
            >
              Sign In
            </button>
          </form>

          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="auth-divider">
            <span>
              Don't have an account?
            </span>
          </div>

          <Link
            to="/register"
            className="register-link"
          >
            Create a FraudShield account
          </Link>

        </div>

        
      <style>{`
        /* =====================================================
           FRAUDSHIELD LOGIN THEME
           Supports:
           html[data-theme="dark"]
           html.dark
           body.dark
        ===================================================== */

        .auth-page {
          transition:
            background .25s ease,
            color .25s ease;
        }

        .auth-card,
        .input-wrapper,
        .google-error,
        .back-home,
        .register-link {
          transition:
            background .25s ease,
            border-color .25s ease,
            color .25s ease,
            box-shadow .25s ease;
        }

        /* ---------- LIGHT MODE ---------- */

        .auth-page {
          background: #f5f7fb;
          color: #0f172a;
        }

        .auth-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          box-shadow: 0 18px 50px rgba(15, 23, 42, .08);
        }

        .auth-logo {
          background: #0f172a;
          color: #ffffff;
        }

        .auth-card h1 {
          color: #0f172a;
        }

        .auth-subtitle {
          color: #64748b;
        }

        .back-home {
          color: #64748b;
        }

        .back-home:hover {
          color: #2563eb;
        }

        .auth-divider {
          color: #94a3b8;
        }

        .auth-divider::before,
        .auth-divider::after {
          background: #e2e8f0;
        }

        .form-group label {
          color: #334155;
        }

        .input-wrapper {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #94a3b8;
        }

        .input-wrapper:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .10);
        }

        .input-wrapper input {
          background: transparent !important;
          color: #0f172a !important;
          caret-color: #0f172a;
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .auth-button {
          background: #0f172a;
          color: #ffffff;
        }

        .auth-button:hover {
          background: #1e293b;
        }

        .register-link {
          color: #2563eb;
        }

        .google-login-container {
          min-height: 44px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          border-radius: 7px;
        }

        .google-error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          margin-top: 12px;
        }

        /* ---------- DARK MODE ---------- */

        html[data-theme="dark"] .auth-page,
        html.dark .auth-page,
        body.dark .auth-page {
          background:
            radial-gradient(
              circle at 50% 20%,
              rgba(37, 99, 235, .10),
              transparent 34%
            ),
            #050d19 !important;
          color: #e2e8f0;
        }

        html[data-theme="dark"] .auth-container,
        html.dark .auth-container,
        body.dark .auth-container {
          color: #e2e8f0;
        }

        html[data-theme="dark"] .back-home,
        html.dark .back-home,
        body.dark .back-home {
          color: #8da2b8;
        }

        html[data-theme="dark"] .back-home:hover,
        html.dark .back-home:hover,
        body.dark .back-home:hover {
          color: #60a5fa;
        }

        html[data-theme="dark"] .auth-card,
        html.dark .auth-card,
        body.dark .auth-card {
          background: #0b1726 !important;
          border: 1px solid rgba(148, 163, 184, .18) !important;
          color: #e2e8f0 !important;
          box-shadow:
            0 25px 70px rgba(0, 0, 0, .42),
            0 0 0 1px rgba(96, 165, 250, .025);
        }

        html[data-theme="dark"] .auth-logo,
        html.dark .auth-logo,
        body.dark .auth-logo {
          background: #17263a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(96, 165, 250, .15);
        }

        html[data-theme="dark"] .auth-card h1,
        html.dark .auth-card h1,
        body.dark .auth-card h1 {
          color: #f8fafc !important;
        }

        html[data-theme="dark"] .auth-subtitle,
        html.dark .auth-subtitle,
        body.dark .auth-subtitle {
          color: #8fa4ba !important;
        }

        html[data-theme="dark"] .auth-divider,
        html.dark .auth-divider,
        body.dark .auth-divider {
          color: #7890a8 !important;
        }

        html[data-theme="dark"] .auth-divider::before,
        html[data-theme="dark"] .auth-divider::after,
        html.dark .auth-divider::before,
        html.dark .auth-divider::after,
        body.dark .auth-divider::before,
        body.dark .auth-divider::after {
          background: rgba(148, 163, 184, .16) !important;
        }

        html[data-theme="dark"] .form-group label,
        html.dark .form-group label,
        body.dark .form-group label {
          color: #d4deea !important;
        }

        /*
          IMPORTANT:
          The input itself is transparent/dark. This prevents the
          browser's default white input background from appearing.
        */
        html[data-theme="dark"] .input-wrapper,
        html.dark .input-wrapper,
        body.dark .input-wrapper {
          background: #081522 !important;
          border: 1px solid #2a3b50 !important;
          color: #7890a8 !important;
          box-shadow: none !important;
        }

        html[data-theme="dark"] .input-wrapper:focus-within,
        html.dark .input-wrapper:focus-within,
        body.dark .input-wrapper:focus-within {
          background: #091827 !important;
          border-color: #3b82f6 !important;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, .14) !important;
        }

        html[data-theme="dark"] .input-wrapper input,
        html.dark .input-wrapper input,
        body.dark .input-wrapper input {
          background: transparent !important;
          color: #f1f5f9 !important;
          -webkit-text-fill-color: #f1f5f9 !important;
          caret-color: #60a5fa !important;
        }

        html[data-theme="dark"] .input-wrapper input::placeholder,
        html.dark .input-wrapper input::placeholder,
        body.dark .input-wrapper input::placeholder {
          color: #627991 !important;
          opacity: 1 !important;
        }

        /* Chrome/Edge autofill — prevents the white highlighted field. */
        html[data-theme="dark"] .auth-page input:-webkit-autofill,
        html[data-theme="dark"] .auth-page input:-webkit-autofill:hover,
        html[data-theme="dark"] .auth-page input:-webkit-autofill:focus,
        html.dark .auth-page input:-webkit-autofill,
        html.dark .auth-page input:-webkit-autofill:hover,
        html.dark .auth-page input:-webkit-autofill:focus,
        body.dark .auth-page input:-webkit-autofill,
        body.dark .auth-page input:-webkit-autofill:hover,
        body.dark .auth-page input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f1f5f9 !important;
          -webkit-box-shadow:
            0 0 0 1000px #081522 inset !important;
          box-shadow:
            0 0 0 1000px #081522 inset !important;
          background-color: #081522 !important;
          caret-color: #60a5fa !important;
        }

        html[data-theme="dark"] .auth-button,
        html.dark .auth-button,
        body.dark .auth-button {
          background: #17263a !important;
          color: #ffffff !important;
          border: 1px solid rgba(96, 165, 250, .12);
        }

        html[data-theme="dark"] .auth-button:hover,
        html.dark .auth-button:hover,
        body.dark .auth-button:hover {
          background: #1d3048 !important;
        }

        html[data-theme="dark"] .register-link,
        html.dark .register-link,
        body.dark .register-link {
          color: #60a5fa !important;
        }

        html[data-theme="dark"] .register-link:hover,
        html.dark .register-link:hover,
        body.dark .register-link:hover {
          color: #93c5fd !important;
        }

        html[data-theme="dark"] .google-error,
        html.dark .google-error,
        body.dark .google-error {
          background: rgba(239, 68, 68, .10) !important;
          border-color: rgba(248, 113, 113, .25) !important;
          color: #fca5a5 !important;
        }

        html[data-theme="dark"] #google-login-button,
        html.dark #google-login-button,
        body.dark #google-login-button {
          background: transparent !important;
        }

        html[data-theme="dark"] .auth-page p[style],
        html.dark .auth-page p[style],
        body.dark .auth-page p[style] {
          color: #7890a8 !important;
        }

        /*
          Keep the page usable on small screens while preserving
          the existing login layout.
        */
        @media (max-width: 480px) {
          .auth-card {
            width: calc(100vw - 32px) !important;
            box-sizing: border-box;
          }

          .google-login-container {
            width: 100%;
          }
        }
      `}</style>

      </div>
    </div>
  );
}

export default Login;