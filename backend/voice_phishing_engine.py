import re


# =====================================================
# PHISHING SIGNALS
# =====================================================

PHISHING_PATTERNS = {

    "otp_request": [
        r"\botp\b",
        r"one time password",
        r"verification code",
        r"security code",
    ],

    "upi_pin_request": [
        r"upi pin",
        r"upi password",
        r"pin.*share",
        r"share.*pin",
    ],

    "bank_impersonation": [
        r"calling from your bank",
        r"from the bank",
        r"bank representative",
        r"bank officer",
        r"customer care",
        r"bank support",
    ],

    "urgency": [
        r"immediately",
        r"urgent",
        r"right now",
        r"within.*minutes",
        r"today",
        r"immediately verify",
        r"act now",
    ],

    "account_threat": [
        r"account.*blocked",
        r"account.*suspended",
        r"account.*closed",
        r"account.*deactivated",
        r"will be blocked",
        r"will be suspended",
    ],

    "personal_information": [
        r"card number",
        r"debit card",
        r"credit card",
        r"cvv",
        r"date of birth",
        r"account number",
        r"password",
        r"secret code",
    ],

    "money_transfer": [
        r"transfer.*money",
        r"send.*money",
        r"payment.*verify",
        r"refund.*process",
        r"refund.*account",
    ],

    "remote_access": [
        r"anydesk",
        r"teamviewer",
        r"remote access",
        r"screen sharing",
        r"share your screen",
        r"install.*application",
    ],
}


# =====================================================
# RISK WEIGHTS
# =====================================================

RISK_WEIGHTS = {

    "otp_request": 25,
    "upi_pin_request": 30,
    "bank_impersonation": 20,
    "urgency": 15,
    "account_threat": 20,
    "personal_information": 20,
    "money_transfer": 20,
    "remote_access": 25,

}


# =====================================================
# VOICE PHISHING ANALYZER
# =====================================================

def analyze_voice_transcript(transcript: str):

    # -------------------------------------------------
    # VALIDATE
    # -------------------------------------------------

    if not transcript:

        return {
            "success": False,
            "risk_score": 0,
            "risk_level": "LOW",
            "decision": "ALLOW",
            "confidence": 0,
            "message": "No transcript was provided.",
            "reasons": [],
            "detected_signals": [],
        }


    # -------------------------------------------------
    # NORMALIZE
    # -------------------------------------------------

    text = transcript.lower().strip()


    # -------------------------------------------------
    # DETECT SIGNALS
    # -------------------------------------------------

    detected_signals = []

    reasons = []

    risk_score = 0


    for signal, patterns in PHISHING_PATTERNS.items():

        detected = False

        for pattern in patterns:

            if re.search(
                pattern,
                text,
                re.IGNORECASE,
            ):

                detected = True
                break


        if detected:

            detected_signals.append(signal)

            risk_score += RISK_WEIGHTS.get(
                signal,
                0,
            )


    # -------------------------------------------------
    # LIMIT SCORE
    # -------------------------------------------------

    risk_score = min(
        risk_score,
        100,
    )


    # -------------------------------------------------
    # EXPLAINABLE REASONS
    # -------------------------------------------------

    if "otp_request" in detected_signals:

        reasons.append(
            "Request for OTP or verification code detected."
        )


    if "upi_pin_request" in detected_signals:

        reasons.append(
            "Request for UPI PIN or payment PIN detected."
        )


    if "bank_impersonation" in detected_signals:

        reasons.append(
            "Possible bank or customer-support impersonation detected."
        )


    if "urgency" in detected_signals:

        reasons.append(
            "Urgent or pressure-based language detected."
        )


    if "account_threat" in detected_signals:

        reasons.append(
            "Threat of account blocking or suspension detected."
        )


    if "personal_information" in detected_signals:

        reasons.append(
            "Request for sensitive personal or banking information detected."
        )


    if "money_transfer" in detected_signals:

        reasons.append(
            "Suspicious money-transfer or payment instruction detected."
        )


    if "remote_access" in detected_signals:

        reasons.append(
            "Request for remote access or screen sharing detected."
        )


    # -------------------------------------------------
    # RISK LEVEL
    # -------------------------------------------------

    if risk_score >= 70:

        risk_level = "HIGH"
        decision = "BLOCK"


    elif risk_score >= 40:

        risk_level = "MEDIUM"
        decision = "REVIEW"


    else:

        risk_level = "LOW"
        decision = "ALLOW"


    # -------------------------------------------------
    # CONFIDENCE
    # -------------------------------------------------

    if len(detected_signals) >= 4:

        confidence = 95

    elif len(detected_signals) == 3:

        confidence = 90

    elif len(detected_signals) == 2:

        confidence = 82

    elif len(detected_signals) == 1:

        confidence = 70

    else:

        confidence = 60


    # -------------------------------------------------
    # MESSAGE
    # -------------------------------------------------

    if risk_level == "HIGH":

        message = (
            "This conversation contains multiple "
            "strong voice-phishing indicators. "
            "Do not share sensitive information "
            "or make a payment."
        )


    elif risk_level == "MEDIUM":

        message = (
            "This conversation contains suspicious "
            "social-engineering indicators. "
            "Verify the caller independently."
        )


    else:

        message = (
            "No major voice-phishing indicators "
            "were detected in the transcript."
        )


    # -------------------------------------------------
    # RETURN RESULT
    # -------------------------------------------------

    return {

        "success": True,

        "risk_score": risk_score,

        "risk_level": risk_level,

        "decision": decision,

        "confidence": confidence,

        "message": message,

        "reasons": reasons,

        "detected_signals": detected_signals,

    }