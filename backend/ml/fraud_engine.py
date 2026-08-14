import os
import joblib
import pandas as pd


# =====================================================
# MODEL PATH
# =====================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "fraud_model.pkl"
)


# =====================================================
# LOAD MODEL PACKAGE
# =====================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Fraud model not found at: {MODEL_PATH}"
    )


model_package = joblib.load(MODEL_PATH)


# =====================================================
# GET MODEL
# =====================================================

model = model_package["model"]


# =====================================================
# GET FEATURES FROM TRAINED MODEL
# =====================================================

FEATURES = model_package["features"]


# =====================================================
# FRAUD ANALYSIS
# =====================================================

def analyze_transaction(
    amount: float,
    beneficiary_new: bool,
    device_new: bool,
    location_changed: bool,
    transaction_count_last_hour: int,
    is_night_transaction: bool,
):

    # =================================================
    # PREPARE INPUT DATA
    # =================================================

    input_data = pd.DataFrame(
        [[
            float(amount),
            int(beneficiary_new),
            int(device_new),
            int(location_changed),
            int(transaction_count_last_hour),
            int(is_night_transaction),
        ]],
        columns=FEATURES
    )


    # =================================================
    # ML PREDICTION
    # =================================================

    prediction = model.predict(
        input_data
    )[0]


    probabilities = model.predict_proba(
        input_data
    )[0]


    # =================================================
    # FRAUD PROBABILITY
    # =================================================

    fraud_probability = float(
        probabilities[1]
    )


    # =================================================
    # RISK SCORE
    # =================================================

    risk_score = round(
        fraud_probability * 100
    )


    # Keep score inside 0–100
    risk_score = max(
        0,
        min(
            risk_score,
            100
        )
    )


    # =================================================
    # RISK LEVEL + DECISION
    # =================================================

    if risk_score >= 70:

        risk_level = "HIGH"

        decision = "BLOCK"


    elif risk_score >= 40:

        risk_level = "MEDIUM"

        decision = "REVIEW"


    else:

        risk_level = "LOW"

        decision = "ALLOW"


    # =================================================
    # EXPLAINABLE AI REASONS
    # =================================================

    reasons = []


    # Transaction amount
    if amount > 50000:

        reasons.append(
            "Very high transaction amount detected."
        )

    elif amount > 20000:

        reasons.append(
            "High transaction amount detected."
        )


    # New beneficiary
    if beneficiary_new:

        reasons.append(
            "New beneficiary detected."
        )


    # New device
    if device_new:

        reasons.append(
            "Transaction originated from a new device."
        )


    # Location change
    if location_changed:

        reasons.append(
            "Unusual location change detected."
        )


    # Transaction frequency
    if transaction_count_last_hour >= 5:

        reasons.append(
            "Unusually high transaction frequency detected."
        )


    # Night transaction
    if is_night_transaction:

        reasons.append(
            "Transaction occurred during unusual hours."
        )


    # No suspicious signals
    if not reasons:

        reasons.append(
            "No major suspicious transaction signals detected."
        )


    # =================================================
    # MODEL CONFIDENCE
    # =================================================

    confidence = round(
        max(probabilities) * 100
    )


    # =================================================
    # MESSAGE
    # =================================================

    if risk_level == "HIGH":

        message = (
            "This transaction shows multiple "
            "high-risk characteristics and should "
            "be blocked."
        )


    elif risk_level == "MEDIUM":

        message = (
            "This transaction contains suspicious "
            "signals and should be reviewed."
        )


    else:

        message = (
            "This transaction appears to have "
            "a low fraud risk."
        )


    # =================================================
    # FINAL RESULT
    # =================================================

    return {

        "risk_score": risk_score,

        "risk_level": risk_level,

        "decision": decision,

        "confidence": confidence,

        "fraud_probability": round(
            fraud_probability * 100,
            2
        ),

        "prediction": int(
            prediction
        ),

        "message": message,

        "reasons": reasons,

    }