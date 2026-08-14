import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


# =====================================================
# FRAUDSHIELD AI — ML TRAINING
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)


# =====================================================
# CREATE TRAINING DATA
# =====================================================

np.random.seed(42)

ROWS = 5000

data = pd.DataFrame({

    "amount": np.random.randint(
        100,
        300000,
        ROWS
    ),

    "new_beneficiary": np.random.randint(
        0,
        2,
        ROWS
    ),

    "new_device": np.random.randint(
        0,
        2,
        ROWS
    ),

    "location_changed": np.random.randint(
        0,
        2,
        ROWS
    ),

    "night_transaction": np.random.randint(
        0,
        2,
        ROWS
    ),

    "transactions_last_hour": np.random.randint(
        0,
        15,
        ROWS
    ),

    "previous_fraud": np.random.randint(
        0,
        2,
        ROWS
    ),
})


# =====================================================
# GENERATE SYNTHETIC FRAUD LABEL
# =====================================================

risk_signal = (

    (data["amount"] > 100000) * 2

    + data["new_beneficiary"] * 2

    + data["new_device"] * 2

    + data["location_changed"] * 2

    + data["night_transaction"] * 1

    + (data["transactions_last_hour"] >= 5) * 2

    + data["previous_fraud"] * 3
)


# Add small randomness so the model doesn't learn
# a perfectly deterministic rule.

noise = np.random.randint(
    0,
    3,
    ROWS
)

data["fraud"] = (
    risk_signal + noise >= 6
).astype(int)


# =====================================================
# FEATURES
# =====================================================

FEATURES = [

    "amount",
    "new_beneficiary",
    "new_device",
    "location_changed",
    "night_transaction",
    "transactions_last_hour",
    "previous_fraud",

]


X = data[FEATURES]

y = data["fraud"]


# =====================================================
# TRAIN / TEST SPLIT
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42,

    stratify=y,

)


# =====================================================
# RANDOM FOREST
# =====================================================

model = RandomForestClassifier(

    n_estimators=200,

    max_depth=10,

    min_samples_split=5,

    random_state=42,

    class_weight="balanced",

)


model.fit(
    X_train,
    y_train,
)


# =====================================================
# EVALUATION
# =====================================================

predictions = model.predict(
    X_test
)

print(
    classification_report(
        y_test,
        predictions,
        target_names=[
            "Legitimate",
            "Fraud",
        ],
    )
)


# =====================================================
# SAVE MODEL
# =====================================================

joblib.dump(
    {
        "model": model,
        "features": FEATURES,
    },
    MODEL_PATH,
)


print()
print(
    "FraudShield ML model trained successfully."
)

print(
    f"Model saved to: {MODEL_PATH}"
)