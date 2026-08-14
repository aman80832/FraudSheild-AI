import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react";
import api from "../api/api";


function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleError, setGoogleError] = useState("");


  // =====================================================
  // GOOGLE SIGN-IN INITIALIZATION
  // =====================================================

  useEffect(() => {
    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );


    const initializeGoogle = () => {
      if (!window.google) {
        console.error(
          "Google Identity Services failed to load."
        );

        return;
      }


      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID;


      console.log(
        "Google Client ID loaded:",
        clientId ? "YES" : "NO"
      );


      if (!clientId) {
        console.error(
          "VITE_GOOGLE_CLIENT_ID is missing from frontend/.env"
        );

        setGoogleError(
          "Google Login is not configured correctly."
        );

        return;
      }


      const buttonContainer =
        document.getElementById(
          "google-login-button"
        );


      if (!buttonContainer) {
        return;
      }


      // Clear previously rendered button
      buttonContainer.innerHTML = "";


      // =================================================
      // INITIALIZE GOOGLE IDENTITY SERVICES
      // =================================================

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });


      // =================================================
      // RENDER GOOGLE BUTTON
      // =================================================

      window.google.accounts.id.renderButton(
        buttonContainer,
        {
          theme: "outline",
          size: "large",
          width: 350,
          text: "continue_with",
          shape: "rectangular",
        }
      );
    };


    // =====================================================
    // LOAD GOOGLE SCRIPT
    // =====================================================

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

        setGoogleError(
          "Unable to load Google Login."
        );
      };


      document.body.appendChild(script);

    } else {

      // Google script already exists

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


    // We intentionally do not remove the Google
    // script when the component unmounts.

  }, []);


  // =====================================================
  // GOOGLE LOGIN RESPONSE
  // =====================================================

  async function handleGoogleResponse(response) {

    try {

      setGoogleError("");


      console.log(
        "Google credential received:",
        response?.credential
          ? "YES"
          : "NO"
      );


      // =================================================
      // CHECK GOOGLE CREDENTIAL
      // =================================================

      if (
        !response ||
        !response.credential
      ) {

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

      if (!result.data.access_token) {

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

      localStorage.setItem(
        "user",
        JSON.stringify(
          result.data.user
        )
      );


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
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {

        setGoogleError(
          "Cannot connect to FraudShield server. Make sure the FastAPI backend is running on port 8000."
        );

        return;
      }


      // =================================================
      // BACKEND ERROR
      // =================================================

      setGoogleError(
        error.response?.data?.detail ||
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

      if (!result.data?.access_token) {
        setGoogleError(
          "Login succeeded, but the server did not return an authentication token."
        );
        return;
      }

      localStorage.setItem(
        "access_token",
        result.data.access_token
      );

      if (result.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(result.data.user)
        );
      }

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Email login error:",
        error
      );

      if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {
        setGoogleError(
          "Cannot connect to FraudShield server. Make sure the FastAPI backend is running on port 8000."
        );
        return;
      }

      setGoogleError(
        error.response?.data?.detail ||
          "Email login failed. Please check your email and password."
      );
    }
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="auth-page">

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
                    setEmail(
                      event.target.value
                    )
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
                    setPassword(
                      event.target.value
                    )
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

      </div>

    </div>
  );
}


export default Login;