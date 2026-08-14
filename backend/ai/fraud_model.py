import os
import joblib
import pandas as pd


# =====================================================
# FRAUDSHIELD AI - ML PREDICTION ENGINE
# =====================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)


# =====================================================
# LOAD TRAINED MODEL
# =====================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Fraud model not found: {MODEL_PATH}"
    )


model_data = joblib.load(
    MODEL_PATH
)

model = model_data["model"]

FEATURES = model_data["features"]


# =====================================================
# PREDICT FRAUD
# =====================================================

def predict_fraud(
    amount: float,
    new_beneficiary: bool,
    new_device: bool,
    location_changed: bool,
    night_transaction: bool,
    transactions_last_hour: int,
    previous_fraud: bool = False,
):

    input_data = pd.DataFrame([
        {
            "amount": float(amount),

            "new_beneficiary":
                int(new_beneficiary),

            "new_device":
                int(new_device),

            "location_changed":
                int(location_changed),

            "night_transaction":
                int(night_transaction),

            "transactions_last_hour":
                int(transactions_last_hour),

            "previous_fraud":
                int(previous_fraud),
        }
    ])


    # Keep exact feature order
    input_data = input_data[
        FEATURES
    ]


    # =================================================
    # MODEL PREDICTION
    # =================================================

    probability = model.predict_proba(
        input_data
    )[0][1]


    fraud_probability = round(
        probability * 100,
        2
    )


    risk_score = round(
        probability * 100
    )


    # =================================================
    # DECISION
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
    # RETURN RESULT
    # =================================================

    return {

        "fraud_probability":
            fraud_probability,

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "decision":
            decision,

    }