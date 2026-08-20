import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Brain,
  Mic,
  Activity,
  ArrowRight,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="landing-page">

      {/* Navbar */}
      <nav className="navbar">

        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <span>FraudShield AI</span>
        </div>

        <div className="nav-links">
          <a href="#features">{t("features")}</a>
          <a href="#security">{t("security")}</a>
          <a href="#how-it-works">{t("howItWorks")}</a>
        </div>

        <div className="nav-actions">

          {/* =================================================
              LIGHT / DARK MODE TOGGLE
          ================================================= */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            title={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          <LanguageSelector />

          <Link to="/login" className="login-link">
            {t("login")}
          </Link>

          <Link to="/register" className="signup-btn">
            {t("getStarted")}
          </Link>

        </div>

      </nav>


      {/* Hero */}
      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            <Activity size={16} />
            {t("aiProtection")}
          </div>

          <h1>
            {t("stopFraud")}
            <br />

            <span>{t("beforeItHappens")}</span>
          </h1>

          <p>
            FraudShield AI detects suspicious UPI transactions,
            voice phishing and social engineering attacks in real time —
            while explaining exactly why something looks risky.
          </p>

          <div className="hero-buttons">

            <Link to="/register" className="primary-btn">
              {t("protectAccount")}
              <ArrowRight size={18} />
            </Link>

            <a href="#how-it-works" className="secondary-btn">
              {t("seeHowItWorks")}
            </a>

          </div>

          <div className="trust-row">

            <div>
              <CheckCircle size={18} />
              {t("realTimeDetection")}
            </div>

            <div>
              <CheckCircle size={18} />
              {t("explainableAI")}
            </div>

            <div>
              <CheckCircle size={18} />
              {t("privacyFirst")}
            </div>

          </div>

        </div>


        {/* Risk Card */}
        <div className="hero-visual">

          <div className="risk-card">

            <div className="risk-header">

              <div>
                <span className="small-label">
                  {t("transactionSecurity")}
                </span>

                <h3>₹35,000</h3>
              </div>

              <div className="risk-badge">
                {t("highRisk")}
              </div>

            </div>


            <div className="risk-score">

              <div className="score-circle">
                <strong>87</strong>
                <span>/100</span>
              </div>

              <div>
                <h4>{t("suspiciousActivity")}</h4>

                <p>
                  {t("multipleSignals")}
                </p>
              </div>

            </div>


            <div className="risk-reasons">

              <div>
                <span>{t("newBeneficiary")}</span>
                <strong>+25</strong>
              </div>

              <div>
                <span>{t("unusualAmount")}</span>
                <strong>+20</strong>
              </div>

              <div>
                <span>{t("newDevice")}</span>
                <strong>+15</strong>
              </div>

              <div>
                <span>{t("suspiciousVoice")}</span>
                <strong>+20</strong>
              </div>

            </div>


            <button className="protect-btn">
              {t("reviewTransaction")}
            </button>

          </div>

        </div>

      </section>


      {/* Features */}
      <section id="features" className="features-section">

        <div className="section-heading">

          <span>{t("powerfulProtection")}</span>

          <h2>
            {t("moreThanFraud")}
            <br />
            <span>{t("fraudDetection")}</span>
          </h2>

          <p>
            FraudShield combines transaction intelligence,
            behavioural analysis and AI-powered social engineering
            detection.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">

            <Brain size={30} />

            <h3>Explainable AI</h3>

            <p>
              Understand exactly why a transaction was
              flagged instead of receiving a black-box decision.
            </p>

          </div>


          <div className="feature-card">

            <Mic size={30} />

            <h3>Voice Scam Detection</h3>

            <p>
              Detect urgency, impersonation, OTP requests
              and other social-engineering patterns.
            </p>

          </div>


          <div className="feature-card">

            <Activity size={30} />

            <h3>Behaviour Intelligence</h3>

            <p>
              Learn normal transaction behaviour and identify
              unusual activity automatically.
            </p>

          </div>


          <div className="feature-card">

            <ShieldCheck size={30} />

            <h3>Adaptive Protection</h3>

            <p>
              Verify suspicious transactions without unnecessarily
              blocking legitimate payments.
            </p>

          </div>

        </div>

      </section>


      {/* How it works */}
      <section id="how-it-works" className="how-section">

        <div className="section-heading">

          <span>HOW IT WORKS</span>

          <h2>
            Detect.
            <span> Explain.</span>
            Protect.
          </h2>

        </div>


        <div className="steps">

          <div className="step">

            <div>01</div>

            <h3>Analyze</h3>

            <p>
              Transaction, device and behavioural signals
              are analyzed in real time.
            </p>

          </div>


          <div className="step">

            <div>02</div>

            <h3>Understand</h3>

            <p>
              AI identifies suspicious patterns and explains
              the signals behind the risk score.
            </p>

          </div>


          <div className="step">

            <div>03</div>

            <h3>Protect</h3>

            <p>
              The system recommends the safest action based
              on the calculated risk.
            </p>

          </div>

        </div>

      </section>


      {/* Footer */}
      <footer>

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>

          FraudShield AI

        </div>

        <p>
          Intelligent protection for the digital payment era.
        </p>

      </footer>

    </div>
  );
}

export default Landing;