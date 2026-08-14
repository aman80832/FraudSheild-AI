import os
import random

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)


# =====================================================
# PATHS
# =====================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data"
)

os.makedirs(
    DATA_DIR,
    exist_ok=True
)

DATASET_PATH = os.path.join(
    DATA_DIR,
    "fraud_transactions.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "fraud_model.pkl"
)


# =====================================================
# RANDOM SEED
# =====================================================

random.seed(42)


# =====================================================
# GENERATE DATASET
# =====================================================

ROWS = 5000

data = []


for _ in range(ROWS):

    amount = random.randint(
        100,
        100000
    )

    beneficiary_new = random.randint(
        0,
        1
    )

    device_new = random.randint(
        0,
        1
    )

    location_changed = random.randint(
        0,
        1
    )

    transaction_count_last_hour = random.randint(
        0,
        15
    )

    is_night_transaction = random.randint(
        0,
        1
    )


    # =================================================
    # SYNTHETIC FRAUD SIGNAL
    # =================================================

    fraud_score = 0


    if amount > 50000:
        fraud_score += 2

    elif amount > 20000:
        fraud_score += 1


    if beneficiary_new:
        fraud_score += 2


    if device_new:
        fraud_score += 2


    if location_changed:
        fraud_score += 2


    if transaction_count_last_hour >= 5:
        fraud_score += 2


    if is_night_transaction:
        fraud_score += 1


    fraud_score += random.choice(
        [-1, 0, 0, 0, 1]
    )


    fraud = (
        1
        if fraud_score >= 5
        else 0
    )


    data.append({

        "amount": amount,

        "beneficiary_new":
            beneficiary_new,

        "device_new":
            device_new,

        "location_changed":
            location_changed,

        "transaction_count_last_hour":
            transaction_count_last_hour,

        "is_night_transaction":
            is_night_transaction,

        "fraud":
            fraud

    })


# =====================================================
# DATAFRAME
# =====================================================

df = pd.DataFrame(
    data
)


df.to_csv(
    DATASET_PATH,
    index=False
)


print(
    f"Dataset saved: {DATASET_PATH}"
)

print(
    f"Total records: {len(df)}"
)

print(
    f"Fraud records: {df['fraud'].sum()}"
)

print(
    f"Legitimate records: "
    f"{len(df) - df['fraud'].sum()}"
)


# =====================================================
# FEATURES
# =====================================================

FEATURES = [

    "amount",

    "beneficiary_new",

    "device_new",

    "location_changed",

    "transaction_count_last_hour",

    "is_night_transaction"

]


X = df[FEATURES]

y = df["fraud"]


# =====================================================
# TRAIN / TEST
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

    stratify=y

)


# =====================================================
# RANDOM FOREST
# =====================================================

model = RandomForestClassifier(

    n_estimators=200,

    max_depth=10,

    random_state=42,

    class_weight="balanced"

)


print(
    "\nTraining FraudShield AI model..."
)


model.fit(
    X_train,
    y_train
)


# =====================================================
# PREDICTIONS
# =====================================================

predictions = model.predict(
    X_test
)

probabilities = model.predict_proba(
    X_test
)[:, 1]


# =====================================================
# METRICS
# =====================================================

accuracy = accuracy_score(
    y_test,
    predictions
)

precision = precision_score(
    y_test,
    predictions,
    zero_division=0
)

recall = recall_score(
    y_test,
    predictions,
    zero_division=0
)

f1 = f1_score(
    y_test,
    predictions,
    zero_division=0
)

auc = roc_auc_score(
    y_test,
    probabilities
)


# =====================================================
# DISPLAY RESULTS
# =====================================================

print(
    "\n======================================"
)

print(
    "      FRAUDSHIELD AI MODEL"
)

print(
    "======================================"
)

print(
    f"Accuracy  : {accuracy * 100:.2f}%"
)

print(
    f"Precision : {precision * 100:.2f}%"
)

print(
    f"Recall    : {recall * 100:.2f}%"
)

print(
    f"F1 Score  : {f1 * 100:.2f}%"
)

print(
    f"ROC-AUC   : {auc:.4f}"
)


# =====================================================
# CLASSIFICATION REPORT
# =====================================================

print(
    "\nClassification Report:"
)

print(
    classification_report(
        y_test,
        predictions,
        target_names=[
            "Legitimate",
            "Fraud"
        ],
        zero_division=0
    )
)


# =====================================================
# CONFUSION MATRIX
# =====================================================

matrix = confusion_matrix(
    y_test,
    predictions
)

print(
    "Confusion Matrix:"
)

print(matrix)


# =====================================================
# FEATURE IMPORTANCE
# =====================================================

importance = pd.DataFrame({

    "feature": FEATURES,

    "importance":
        model.feature_importances_

})


importance = importance.sort_values(
    by="importance",
    ascending=False
)


print(
    "\nFeature Importance:"
)

print(
    importance.to_string(
        index=False
    )
)


# =====================================================
# SAVE MODEL + METADATA
# =====================================================

model_package = {

    "model": model,

    "features": FEATURES,

    "metrics": {

        "accuracy": float(accuracy),

        "precision": float(precision),

        "recall": float(recall),

        "f1_score": float(f1),

        "roc_auc": float(auc)

    },

    "feature_importance":
        importance.to_dict(
            orient="records"
        )

}


joblib.dump(
    model_package,
    MODEL_PATH
)


print(
    "\nModel saved successfully:"
)

print(
    MODEL_PATH
)

print(
    "\nTraining complete."
)