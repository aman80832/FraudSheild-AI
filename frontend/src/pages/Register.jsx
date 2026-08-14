import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // -------------------------------
    // VALIDATION
    // -------------------------------

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError(
        "Please accept the terms and security policy."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/register",
        {
          name: cleanName,
          email: cleanEmail,
          password: password,
        }
      );

      const data = response.data;

      // -------------------------------
      // SAVE LOGIN SESSION
      // -------------------------------

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setSuccess(
        "Account created successfully!"
      );

      // -------------------------------
      // REDIRECT
      // -------------------------------

      setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 800);

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to create your account."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-wrapper">

        {/* BACK TO HOME */}

        <Link
          to="/"
          className="register-back"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        {/* CARD */}

        <div className="register-card">

          {/* LOGO */}

          <div className="register-logo">
            <ShieldCheck size={30} />
          </div>

          <h1>
            Create your account
          </h1>

          <p className="register-subtitle">
            Join FraudShield AI and protect
            your digital transactions.
          </p>

          {/* ERROR */}

          {error && (
            <div className="register-message error">
              <AlertCircle size={18} />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="register-message success">
              <CheckCircle2 size={18} />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleRegister}
            className="register-form"
          >

            {/* NAME */}

            <div className="register-field">

              <label>
                Full name
              </label>

              <div className="register-input">

                <User size={18} />

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="register-field">

              <label>
                Email address
              </label>

              <div className="register-input">

                <Mail size={18} />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="register-field">

              <label>
                Password
              </label>

              <div className="register-input">

                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="register-field">

              <label>
                Confirm password
              </label>

              <div className="register-input">

                <Lock size={18} />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* TERMS */}

            <label className="register-terms">

              <input
                type="checkbox"
                checked={agree}
                onChange={(e) =>
                  setAgree(e.target.checked)
                }
              />

              <span>
                I agree to the FraudShield AI
                security terms and privacy policy.
              </span>

            </label>

            {/* SUBMIT */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          {/* LOGIN */}

          <div className="register-login">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in to FraudShield
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;