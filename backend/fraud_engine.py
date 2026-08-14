# =====================================================
# FRAUDSHIELD AI
# HYBRID FRAUD RISK ENGINE
# =====================================================

import os
import joblib
import pandas as pd


# =====================================================
# LOAD TRAINED ML MODEL
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "fraud_model.pkl"
)


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Fraud model not found: {MODEL_PATH}"
    )


model_package = joblib.load(MODEL_PATH)

model = model_package["model"]

FEATURES = model_package["features"]

MODEL_METRICS = model_package.get(
    "metrics",
    {}
)


# =====================================================
# HYBRID FRAUD ANALYSIS
# =====================================================

def analyze_transaction(
    amount: float,
    beneficiary_new: bool,
    device_new: bool,
    location_changed: bool,
    transaction_count_last_hour: int,
    is_night_transaction: bool,
):

    # -------------------------------------------------
    # PREPARE FEATURES
    # -------------------------------------------------

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


    # -------------------------------------------------
    # ML PREDICTION
    # -------------------------------------------------

    prediction = int(
        model.predict(input_data)[0]
    )

    probabilities = model.predict_proba(
        input_data
    )[0]


    fraud_probability = float(
        probabilities[1]
    )


    ml_score = round(
        fraud_probability * 100
    )


    # -------------------------------------------------
    # RULE-BASED SIGNALS
    # -------------------------------------------------

    rule_score = 0

    reasons = []


    # New beneficiary
    if beneficiary_new:

        rule_score += 20

        reasons.append(
            "New beneficiary detected."
        )


    # New device
    if device_new:

        rule_score += 20

        reasons.append(
            "Transaction originated from a new device."
        )


    # Location
    if location_changed:

        rule_score += 15

        reasons.append(
            "Unusual location change detected."
        )


    # Amount
    if amount >= 50000:

        rule_score += 25

        reasons.append(
            "Very high transaction amount detected."
        )

    elif amount >= 20000:

        rule_score += 20

        reasons.append(
            "High transaction amount detected."
        )

    elif amount >= 10000:

        rule_score += 10

        reasons.append(
            "Elevated transaction amount detected."
        )


    # Frequency
    if transaction_count_last_hour >= 10:

        rule_score += 20

        reasons.append(
            "Very high transaction frequency detected."
        )

    elif transaction_count_last_hour >= 5:

        rule_score += 15

        reasons.append(
            "Unusually high transaction frequency detected."
        )

    elif transaction_count_last_hour >= 3:

        rule_score += 5

        reasons.append(
            "Multiple recent transactions detected."
        )


    # Night
    if is_night_transaction:

        rule_score += 5

        reasons.append(
            "Transaction occurred during unusual hours."
        )


    rule_score = min(
        rule_score,
        100
    )


    # -------------------------------------------------
    # HYBRID SCORE
    # -------------------------------------------------

    hybrid_score = round(
        (ml_score * 0.65) +
        (rule_score * 0.35)
    )


    hybrid_score = max(
        0,
        min(
            hybrid_score,
            100
        )
    )


    # -------------------------------------------------
    # RISK LEVEL
    # -------------------------------------------------

    if hybrid_score >= 70:

        risk_level = "HIGH"

        decision = "BLOCK"

    elif hybrid_score >= 40:

        risk_level = "MEDIUM"

        decision = "REVIEW"

    else:

        risk_level = "LOW"

        decision = "ALLOW"


    # -------------------------------------------------
    # DEFAULT REASON
    # -------------------------------------------------

    if not reasons:

        reasons.append(
            "No major suspicious transaction signals detected."
        )


    # -------------------------------------------------
    # CONFIDENCE
    # -------------------------------------------------

    confidence = round(
        max(probabilities) * 100
    )


    # -------------------------------------------------
    # MESSAGE
    # -------------------------------------------------

    if risk_level == "HIGH":

        message = (
            "High-risk transaction detected. "
            "Multiple behavioural and transaction "
            "signals indicate possible fraud."
        )

    elif risk_level == "MEDIUM":

        message = (
            "Suspicious transaction detected. "
            "Additional verification is recommended."
        )

    else:

        message = (
            "Transaction appears to have a low "
            "fraud risk."
        )


    # -------------------------------------------------
    # FINAL RESULT
    # -------------------------------------------------

    return {

        "risk_score": hybrid_score,

        "risk_level": risk_level,

        "decision": decision,

        "confidence": confidence,

        "fraud_probability": round(
            fraud_probability * 100,
            2
        ),

        "ml_score": ml_score,

        "rule_score": rule_score,

        "prediction": prediction,

        "reasons": reasons,

        "message": message,

        "model": {
            "type": "Random Forest",
            "weight": "65%"
        },

        "explainability": {
            "ml_score": ml_score,
            "rule_score": rule_score,
            "signals_detected": len(reasons)
        }

    }