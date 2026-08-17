import os

from dotenv import load_dotenv
from fraud_engine import analyze_transaction
from ai.fraud_model import predict_fraud
from voice_engine import analyze_voice_transcript
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import bcrypt
from database import Base, engine, get_db
from models import User, Transaction, FraudAlert

from auth import (
    create_access_token,
    verify_access_token,
)


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Comma-separated production/development frontend origins.
#
# Vercel production frontend:
# https://fraud-sheild-ai-6tju.vercel.app
#
# You can also add additional frontend URLs in Vercel as:
# FRONTEND_URLS=http://localhost:5173,https://your-domain.vercel.app
DEFAULT_FRONTEND_URLS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://fraud-sheild-ai-6tju.vercel.app",
]

FRONTEND_URLS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_URLS",
        ",".join(DEFAULT_FRONTEND_URLS),
    ).split(",")
    if origin.strip()
]

# Always allow the known production frontend.
PRODUCTION_FRONTEND_URL = "https://fraud-sheild-ai-6tju.vercel.app"

if PRODUCTION_FRONTEND_URL not in FRONTEND_URLS:
    FRONTEND_URLS.append(PRODUCTION_FRONTEND_URL)
MAX_REQUEST_SIZE = int(
    os.getenv("MAX_REQUEST_SIZE", str(2 * 1024 * 1024))
)


# =====================================================
# CONFIGURATION VALIDATION
# =====================================================

if not GOOGLE_CLIENT_ID:
    raise RuntimeError(
        "GOOGLE_CLIENT_ID is missing from backend/.env"
    )

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is missing from backend/.env"
    )


# =====================================================
# DATABASE
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# FRAUDSHIELD AI
# =====================================================

app = FastAPI(
    title="FraudShield AI",
    description=(
        "Explainable Real-Time Fraud Detection System "
        "for UPI, Voice Phishing and Social Engineering"
    ),
    version="1.0.0",
)


# =====================================================
# SECURITY
# =====================================================

security = HTTPBearer()


# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# SECURITY MIDDLEWARE
# =====================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add basic browser security headers and reject unusually
    large requests before they reach application endpoints.
    """

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")

        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_SIZE:
                    return Response(
                        content="Request body is too large.",
                        status_code=413,
                        media_type="text/plain",
                    )
            except ValueError:
                return Response(
                    content="Invalid Content-Length header.",
                    status_code=400,
                    media_type="text/plain",
                )

        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        # HSTS is only appropriate when the API itself is served over HTTPS.
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response


app.add_middleware(SecurityHeadersMiddleware)



# =====================================================
# REQUEST MODELS
# =====================================================

class GoogleLoginRequest(BaseModel):
    credential: str

# =====================================================
# EMAIL REGISTRATION
# =====================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


# =====================================================
# EMAIL LOGIN
# =====================================================

class LoginRequest(BaseModel):
    email: str
    password: str
class FraudAnalysisRequest(BaseModel):
    amount: float
    beneficiary_new: bool
    device_new: bool
    location_changed: bool
    transaction_count_last_hour: int
    is_night_transaction: bool

    # Optional identifiers used by Fraud Network Detection.
    # Existing frontend requests continue to work because these
    # fields are optional.
    device_id: str | None = None
    beneficiary_id: str | None = None
    location: str | None = None




class VoiceAnalysisRequest(BaseModel):
    transcript: str
# =====================================================
# ROOT API
# =====================================================

@app.get("/api")
def root():
    return {
        "message": "FraudShield AI API is running",
        "status": "success",
        "version": "1.0.0",
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FraudShield AI",
        "backend": "FastAPI",
    }


# =====================================================
# TEST FRAUD RISK API
# =====================================================

@app.get("/api/test-risk")
def test_risk():
    return {
        "risk_score": 25,
        "risk_level": "LOW",
        "decision": "ALLOW",
        "message": "This is a test fraud risk response.",
    }

# =====================================================
# EMAIL REGISTRATION
# =====================================================

@app.post("/api/auth/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    name = data.name.strip()
    email = data.email.strip().lower()
    password = data.password

    # -------------------------------------------------
    # VALIDATION
    # -------------------------------------------------

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )

    # bcrypt only uses the first 72 bytes. Reject longer passwords
    # instead of silently truncating them.
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or fewer."
        )

    # -------------------------------------------------
    # CHECK EXISTING USER
    # -------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:

        if existing_user.google_id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "An account with this email already exists "
                    "through Google. Please continue with Google."
                )
            )

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    # -------------------------------------------------
    # HASH PASSWORD
    # -------------------------------------------------

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # -------------------------------------------------
    # CREATE USER
    # -------------------------------------------------

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        google_id=None,
        picture=None,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # -------------------------------------------------
    # CREATE JWT
    # -------------------------------------------------

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "message": "Account created successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_active": user.is_active,
            "role": _get_user_role(user),
        },
    }

# =====================================================
# EMAIL LOGIN
# =====================================================

@app.post("/api/auth/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = data.email.strip().lower()
    password = data.password

    # -------------------------------------------------
    # VALIDATION
    # -------------------------------------------------

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required.",
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required.",
        )

    # -------------------------------------------------
    # FIND USER
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # -------------------------------------------------
    # GOOGLE-ONLY ACCOUNT
    # -------------------------------------------------

    if not user.password_hash:
        if user.google_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "This account uses Google login. "
                    "Please continue with Google."
                ),
            )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # -------------------------------------------------
    # CHECK PASSWORD
    # -------------------------------------------------

    try:
        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # -------------------------------------------------
    # CHECK ACTIVE ACCOUNT
    # -------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is currently disabled.",
        )

    # -------------------------------------------------
    # CREATE JWT
    # -------------------------------------------------

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "google_id": user.google_id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_active": user.is_active,
            "role": _get_user_role(user),
        },
    }

# =====================================================
# GOOGLE LOGIN
# =====================================================

@app.post("/api/auth/google")
def google_login(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        user_info = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        google_user_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        email_verified = user_info.get(
            "email_verified",
            False,
        )

        if not google_user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid Google account.",
            )

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Google account does not contain an email.",
            )

        if not email_verified:
            raise HTTPException(
                status_code=401,
                detail="Google email is not verified.",
            )

        user = (
            db.query(User)
            .filter(User.google_id == google_user_id)
            .first()
        )

        if not user:
            user = (
                db.query(User)
                .filter(User.email == email)
                .first()
            )

        if not user:
            user = User(
                google_id=google_user_id,
                name=name or "FraudShield User",
                email=email,
                picture=picture,
                is_active=True,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        else:
            user.google_id = google_user_id
            user.name = name or user.name
            user.picture = picture
            user.is_active = True

            db.commit()
            db.refresh(user)

        access_token = create_access_token(user.id)

        return {
            "success": True,
            "message": "Google login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "google_id": user.google_id,
                "name": user.name,
                "email": user.email,
                "picture": user.picture,
                "is_active": user.is_active,
                "role": _get_user_role(user),
            },
        }

    except HTTPException:
        raise

    except ValueError as e:
        print("======================================")
        print("GOOGLE TOKEN VERIFICATION FAILED")
        print("ERROR:", repr(e))
        print("EXPECTED GOOGLE CLIENT ID IS SET:", bool(GOOGLE_CLIENT_ID))
        print("======================================")

        raise HTTPException(
            status_code=401,
            detail=f"Google token verification failed: {str(e)}",
        )


# =====================================================
# GET CURRENT AUTHENTICATED USER
# =====================================================

@app.get("/api/auth/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication token does not contain a user ID.",
        )

    try:
        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID in authentication token.",
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_active": user.is_active,
            "role": _get_user_role(user),
        },
    }


# =====================================================
# AUTHENTICATION STATUS
# =====================================================

@app.get("/api/auth/status")
def auth_status(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = _get_authenticated_user(credentials, db)

    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_active": user.is_active,
            "role": _get_user_role(user),
        },
    }


# =====================================================
# FRAUD ANALYSIS API
# =====================================================

@app.post("/api/fraud/analyze")
def analyze_fraud(
    data: FraudAnalysisRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    # -------------------------------------------------
    # VERIFY JWT
    # -------------------------------------------------

    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    # -------------------------------------------------
    # FIND USER
    # -------------------------------------------------

    try:
        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    # -------------------------------------------------
    # BASIC INPUT VALIDATION
    # -------------------------------------------------

    if data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Transaction amount must be greater than zero.",
        )

    if data.transaction_count_last_hour < 0:
        raise HTTPException(
            status_code=400,
            detail="Transaction count cannot be negative.",
        )
    # -------------------------------------------------
    # EXISTING RULE-BASED ENGINE
    # -------------------------------------------------

    rule_result = analyze_transaction(
        amount=data.amount,
        beneficiary_new=data.beneficiary_new,
        device_new=data.device_new,
        location_changed=data.location_changed,
        transaction_count_last_hour=data.transaction_count_last_hour,
        is_night_transaction=data.is_night_transaction,
    )


    # -------------------------------------------------
    # MACHINE LEARNING ENGINE
    # -------------------------------------------------

    ml_result = predict_fraud(
        amount=data.amount,
        new_beneficiary=data.beneficiary_new,
        new_device=data.device_new,
        location_changed=data.location_changed,
        night_transaction=data.is_night_transaction,
        transactions_last_hour=data.transaction_count_last_hour,
        previous_fraud=False,
    )


    # -------------------------------------------------
    # HYBRID RISK SCORE
    # -------------------------------------------------

    rule_score = int(
        rule_result.get(
            "risk_score",
            0
        )
    )

    ml_score = int(
        ml_result.get(
            "risk_score",
            0
        )
    )


    # Give ML more influence than the
    # existing rule engine.

    combined_score = round(
        (ml_score * 0.60)
        +
        (rule_score * 0.40)
    )


    combined_score = max(
        0,
        min(
            combined_score,
            100
        )
    )


    # -------------------------------------------------
    # FINAL RISK LEVEL
    # -------------------------------------------------

    if combined_score >= 70:

        risk_level = "HIGH"

        decision = "BLOCK"


    elif combined_score >= 40:

        risk_level = "MEDIUM"

        decision = "REVIEW"


    else:

        risk_level = "LOW"

        decision = "ALLOW"


    # -------------------------------------------------
    # CONFIDENCE
    # -------------------------------------------------

    ml_probability = float(
        ml_result.get(
            "fraud_probability",
            0
        )
    )


    confidence = round(
        (
            ml_probability
            +
            float(rule_result.get(
                "confidence",
                60
            ))
        ) / 2
    )


    confidence = max(
        0,
        min(
            confidence,
            100
        )
    )


    # -------------------------------------------------
    # EXPLAINABLE REASONS
    # -------------------------------------------------

    reasons = list(
        rule_result.get(
            "reasons",
            []
        )
    )


    if ml_score >= 70:

        reasons.append(
            f"Machine learning model estimated "
            f"a {ml_probability:.1f}% fraud probability."
        )


    elif ml_score >= 40:

        reasons.append(
            f"Machine learning model detected "
            f"moderate fraud probability "
            f"({ml_probability:.1f}%)."
        )


    else:

        reasons.append(
            f"Machine learning model estimated "
            f"a low fraud probability "
            f"({ml_probability:.1f}%)."
        )


    # Remove duplicate reasons

    reasons = list(
        dict.fromkeys(
            reasons
        )
    )


    # -------------------------------------------------
    # FINAL MESSAGE
    # -------------------------------------------------

    if risk_level == "HIGH":

        message = (
            "FraudShield AI detected a high-risk "
            "transaction using both behavioral "
            "rules and machine-learning analysis. "
            "The transaction should be blocked "
            "or manually reviewed."
        )


    elif risk_level == "MEDIUM":

        message = (
            "FraudShield AI detected suspicious "
            "transaction behavior. Additional "
            "verification is recommended before "
            "completing the transaction."
        )


    else:

        message = (
            "FraudShield AI detected low-risk "
            "transaction behavior. No major "
            "fraud indicators were identified."
        )


    # -------------------------------------------------
    # FINAL ANALYSIS RESULT
    # -------------------------------------------------

    result = {

        "risk_score":
            combined_score,

        "risk_level":
            risk_level,

        "decision":
            decision,

        "confidence":
            confidence,

        "fraud_probability":
            ml_probability,

        "ml_risk_score":
            ml_score,

        "rule_risk_score":
            rule_score,

        "reasons":
            reasons,

        "message":
            message,

        "model":
            "Hybrid Rule Engine + Random Forest",

    }

    # -------------------------------------------------
    # SAVE TRANSACTION
    # -------------------------------------------------

    reasons = result.get("reasons", [])

    transaction = Transaction(
        user_id=user.id,

        # Fraud Network identifiers
        device_id=data.device_id,
        beneficiary_id=data.beneficiary_id,
        location=data.location,

        amount=data.amount,
        beneficiary_new=data.beneficiary_new,
        device_new=data.device_new,
        location_changed=data.location_changed,
        transaction_count_last_hour=data.transaction_count_last_hour,
        is_night_transaction=data.is_night_transaction,
        risk_score=int(result.get("risk_score", 0)),
        risk_level=result.get("risk_level", "LOW"),
        decision=result.get("decision", "ALLOW"),
        confidence=int(result.get("confidence", 0)),
        reasons=" | ".join(reasons),
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # -------------------------------------------------
    # CREATE FRAUD ALERT
    # -------------------------------------------------

    alert = None

    if int(result.get("risk_score", 0)) >= 70:

        alert = FraudAlert(
            user_id=user.id,
            transaction_id=transaction.id,
            amount=transaction.amount,
            risk_score=transaction.risk_score,
            risk_level=transaction.risk_level,
            decision=transaction.decision,
            message=result.get(
                "message",
                "High-risk transaction detected.",
            ),
            is_read=False,
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------

    return {
        "success": True,
        "transaction_id": transaction.id,
        "user_id": user.id,

        "transaction": {
            "id": transaction.id,
            "amount": transaction.amount,
            "beneficiary_new": transaction.beneficiary_new,
            "device_new": transaction.device_new,
            "device_id": transaction.device_id,
            "beneficiary_id": transaction.beneficiary_id,
            "location": transaction.location,
            "location_changed": transaction.location_changed,
            "transaction_count_last_hour": (
                transaction.transaction_count_last_hour
            ),
            "is_night_transaction": (
                transaction.is_night_transaction
            ),
        },

        "analysis": result,

        "alert": (
            {
                "id": alert.id,
                "amount": alert.amount,
                "risk_score": alert.risk_score,
                "risk_level": alert.risk_level,
                "decision": alert.decision,
                "message": alert.message,
                "is_read": alert.is_read,
                "review_status": (
                    "CONFIRMED_FRAUD"
                    if alert.decision == "CONFIRMED_FRAUD"
                    else "FALSE_POSITIVE"
                    if alert.decision == "FALSE_POSITIVE"
                    else "PENDING"
                ),
                "created_at": alert.created_at,
            }
            if alert
            else None
        ),
    }



# =====================================================
# VOICE PHISHING ANALYSIS API
# =====================================================

@app.post("/api/voice/analyze")
def analyze_voice(
    data: VoiceAnalysisRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    # -------------------------------------------------
    # VERIFY JWT
    # -------------------------------------------------

    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    # -------------------------------------------------
    # VALIDATE TRANSCRIPT
    # -------------------------------------------------

    transcript = data.transcript.strip()

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty.",
        )

    if len(transcript) > 10000:
        raise HTTPException(
            status_code=400,
            detail=(
                "Transcript is too long. "
                "Maximum length is 10,000 characters."
            ),
        )

    # -------------------------------------------------
    # ANALYZE TRANSCRIPT
    # -------------------------------------------------

    result = analyze_voice_transcript(transcript)

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------

    return {
        "success": True,
        "type": "voice_phishing",
        "user_id": user.id,
        "transcript": transcript,
        "analysis": result,
    }

# =====================================================
# TRANSACTION HISTORY
# =====================================================

@app.get("/api/transactions")
def get_transactions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "success": True,
        "count": len(transactions),
        "transactions": [
            {
                "id": transaction.id,
                "amount": transaction.amount,
                "risk_score": transaction.risk_score,
                "risk_level": transaction.risk_level,
                "decision": transaction.decision,
                "confidence": transaction.confidence,
                "reasons": (
                    transaction.reasons.split(" | ")
                    if transaction.reasons
                    else []
                ),
                "created_at": transaction.created_at,
            }
            for transaction in transactions
        ],
    }


# =====================================================
# FRAUD ALERTS
# =====================================================

def _get_authenticated_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
):
    """
    Centralized authentication + active-account check.

    Every protected endpoint should resolve the current user through
    this helper so an authenticated user can only access their own data.
    """
    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    return user


def _get_user_role(user: User) -> str:
    """
    Resolve the user's application role.

    Expected roles:
        USER
        ANALYST
        ADMIN

    If the User model contains a role column, that value is used.
    Environment-based email lists can also be used as an emergency/
    bootstrap mechanism for existing databases.
    """
    role = getattr(user, "role", None)

    if role:
        role = str(role).strip().upper()
        if role in {"USER", "ANALYST", "ADMIN"}:
            return role

    email = str(getattr(user, "email", "") or "").strip().lower()

    admin_emails = {
        item.strip().lower()
        for item in os.getenv("ADMIN_EMAILS", "").split(",")
        if item.strip()
    }

    analyst_emails = {
        item.strip().lower()
        for item in os.getenv("ANALYST_EMAILS", "").split(",")
        if item.strip()
    }

    if email in admin_emails:
        return "ADMIN"

    if email in analyst_emails:
        return "ANALYST"

    return "USER"


def _get_authenticated_user_id(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
):
    user = _get_authenticated_user(credentials, db)
    return user.id


def _require_role(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
    allowed_roles: set[str],
):
    """
    Authenticate the request and enforce role-based authorization.
    """
    user = _get_authenticated_user(credentials, db)
    role = _get_user_role(user)

    normalized_roles = {
        str(item).strip().upper()
        for item in allowed_roles
    }

    if role not in normalized_roles:
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to perform this action."
            ),
        )

    return user


def _alert_response(alert: FraudAlert):
    return {
        "id": alert.id,
        "transaction_id": alert.transaction_id,
        "amount": alert.amount,
        "risk_score": alert.risk_score,
        "risk_level": alert.risk_level,
        "decision": alert.decision,
        "message": alert.message,
        "is_read": alert.is_read,
        "review_status": getattr(
            alert,
            "review_status",
            "PENDING",
        ) or "PENDING",
        "analyst_decision": getattr(
            alert,
            "analyst_decision",
            None,
        ),
        "analyst_note": getattr(
            alert,
            "analyst_note",
            None,
        ),
        "reviewed_at": getattr(
            alert,
            "reviewed_at",
            None,
        ),
        "created_at": alert.created_at,
    }


@app.get("/api/fraud/alerts")
def get_fraud_alerts(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = _get_authenticated_user_id(
        credentials,
        db,
    )

    alerts = (
        db.query(FraudAlert)
        .filter(FraudAlert.user_id == user_id)
        .order_by(FraudAlert.created_at.desc())
        .limit(100)
        .all()
    )

    return {
        "success": True,
        "count": len(alerts),
        "alerts": [
            _alert_response(alert)
            for alert in alerts
        ],
    }


@app.patch("/api/fraud/alerts/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user_id = _get_authenticated_user_id(
        credentials,
        db,
    )

    alert = (
        db.query(FraudAlert)
        .filter(
            FraudAlert.id == alert_id,
            FraudAlert.user_id == user_id,
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Fraud alert not found.",
        )

    alert.is_read = True

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Fraud alert marked as read.",
        "alert": _alert_response(alert),
    }


# =====================================================
# ANALYST + ADMIN OPERATIONS
# =====================================================

@app.patch("/api/fraud/alerts/{alert_id}/confirm")
def confirm_fraud(
    alert_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = _require_role(
        credentials,
        db,
        {"ANALYST", "ADMIN"},
    )

    alert = (
        db.query(FraudAlert)
        .filter(FraudAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Fraud alert not found.",
        )

    alert.decision = "CONFIRMED_FRAUD"
    alert.review_status = "CONFIRMED_FRAUD"
    alert.analyst_decision = "CONFIRMED_FRAUD"
    alert.is_read = True
    alert.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Fraud confirmed successfully.",
        "review_status": "CONFIRMED_FRAUD",
        "reviewed_by": {
            "id": user.id,
            "role": _get_user_role(user),
        },
        "alert": _alert_response(alert),
    }


@app.patch("/api/fraud/alerts/{alert_id}/false-positive")
def mark_false_positive(
    alert_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = _require_role(
        credentials,
        db,
        {"ANALYST", "ADMIN"},
    )

    alert = (
        db.query(FraudAlert)
        .filter(FraudAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Fraud alert not found.",
        )

    alert.decision = "FALSE_POSITIVE"
    alert.review_status = "FALSE_POSITIVE"
    alert.analyst_decision = "FALSE_POSITIVE"
    alert.is_read = True
    alert.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Alert marked as false positive.",
        "review_status": "FALSE_POSITIVE",
        "reviewed_by": {
            "id": user.id,
            "role": _get_user_role(user),
        },
        "alert": _alert_response(alert),
    }


class AlertReviewRequest(BaseModel):
    analyst_decision: str
    analyst_note: str | None = None


@app.patch("/api/fraud/alerts/{alert_id}/review")
def review_fraud_alert(
    alert_id: int,
    data: AlertReviewRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = _require_role(
        credentials,
        db,
        {"ANALYST", "ADMIN"},
    )

    decision = (
        data.analyst_decision
        .strip()
        .upper()
    )

    if decision not in {
        "CONFIRMED_FRAUD",
        "FALSE_POSITIVE",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "analyst_decision must be "
                "CONFIRMED_FRAUD or FALSE_POSITIVE."
            ),
        )

    alert = (
        db.query(FraudAlert)
        .filter(FraudAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Fraud alert not found.",
        )

    alert.analyst_decision = decision
    alert.review_status = decision
    alert.decision = decision
    alert.analyst_note = (
        data.analyst_note.strip()
        if data.analyst_note
        else None
    )
    alert.reviewed_at = datetime.utcnow()
    alert.is_read = True

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": (
            "Fraud alert review saved successfully."
        ),
        "reviewed_by": {
            "id": user.id,
            "role": _get_user_role(user),
        },
        "alert": _alert_response(alert),
    }


# =====================================================
# ADMIN-ONLY OPERATION
# =====================================================

@app.delete("/api/fraud/alerts/{alert_id}")
def delete_fraud_alert(
    alert_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    user = _require_role(
        credentials,
        db,
        {"ADMIN"},
    )

    alert = (
        db.query(FraudAlert)
        .filter(FraudAlert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Fraud alert not found.",
        )

    db.delete(alert)
    db.commit()

    return {
        "success": True,
        "message": "Fraud alert dismissed successfully.",
        "alert_id": alert_id,
        "deleted_by": {
            "id": user.id,
            "role": _get_user_role(user),
        },
    }


# =====================================================
# FRAUD INTELLIGENCE ANALYTICS
# =====================================================

@app.get("/api/fraud/analytics")
def fraud_analytics(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    # -------------------------------------------------
    # VERIFY JWT
    # -------------------------------------------------

    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    # -------------------------------------------------
    # TRANSACTIONS
    # -------------------------------------------------

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(100)
        .all()
    )

    # -------------------------------------------------
    # FRAUD ALERTS
    # -------------------------------------------------

    alerts = (
        db.query(FraudAlert)
        .filter(FraudAlert.user_id == user_id)
        .order_by(FraudAlert.created_at.desc())
        .limit(100)
        .all()
    )

    total_transactions = len(transactions)

    # -------------------------------------------------
    # RISK DISTRIBUTION
    # -------------------------------------------------

    high_risk = sum(
        1 for t in transactions
        if str(t.risk_level).upper() == "HIGH"
    )

    medium_risk = sum(
        1 for t in transactions
        if str(t.risk_level).upper() == "MEDIUM"
    )

    low_risk = sum(
        1 for t in transactions
        if str(t.risk_level).upper() == "LOW"
    )

    # -------------------------------------------------
    # DECISIONS
    # -------------------------------------------------

    blocked = sum(
        1 for t in transactions
        if str(t.decision).upper() == "BLOCK"
    )

    allowed = sum(
        1 for t in transactions
        if str(t.decision).upper() == "ALLOW"
    )

    review = sum(
        1 for t in transactions
        if str(t.decision).upper() == "REVIEW"
    )

    # -------------------------------------------------
    # AVERAGE RISK
    # -------------------------------------------------

    average_risk = (
        round(
            sum(t.risk_score or 0 for t in transactions)
            / total_transactions,
            2,
        )
        if total_transactions
        else 0
    )

    # -------------------------------------------------
    # AMOUNT AT RISK
    # -------------------------------------------------

    amount_at_risk = sum(
        float(t.amount or 0)
        for t in transactions
        if str(t.risk_level).upper() == "HIGH"
    )

    # -------------------------------------------------
    # ANALYST FEEDBACK
    # -------------------------------------------------

    confirmed_fraud = sum(
        1 for alert in alerts
        if str(alert.decision).upper() == "CONFIRMED_FRAUD"
    )

    false_positive = sum(
        1 for alert in alerts
        if str(alert.decision).upper() == "FALSE_POSITIVE"
    )

    pending = sum(
        1 for alert in alerts
        if str(alert.decision).upper()
        not in ["CONFIRMED_FRAUD", "FALSE_POSITIVE"]
    )

    # -------------------------------------------------
    # TOP RISK SIGNALS
    # -------------------------------------------------

    signal_counts = {}

    for transaction in transactions:

        reasons = transaction.reasons or ""

        for reason in reasons.split(" | "):

            reason = reason.strip()

            if reason:
                signal_counts[reason] = (
                    signal_counts.get(reason, 0) + 1
                )

    top_signals = sorted(
        signal_counts.items(),
        key=lambda item: item[1],
        reverse=True,
    )[:10]

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------

    return {
        "success": True,

        "summary": {
            "total_transactions": total_transactions,
            "total_alerts": len(alerts),
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "blocked": blocked,
            "allowed": allowed,
            "review": review,
            "average_risk": average_risk,
            "amount_at_risk": amount_at_risk,
        },

        "risk_distribution": {
            "HIGH": high_risk,
            "MEDIUM": medium_risk,
            "LOW": low_risk,
        },

        "decisions": {
            "BLOCK": blocked,
            "ALLOW": allowed,
            "REVIEW": review,
        },

        "analyst_feedback": {
            "CONFIRMED_FRAUD": confirmed_fraud,
            "FALSE_POSITIVE": false_positive,
            "PENDING": pending,
        },

        "top_risk_signals": [
            {
                "signal": signal,
                "count": count,
            }
            for signal, count in top_signals
        ],
    }


# =====================================================
# FRAUD NETWORK DETECTION
# =====================================================

@app.get("/api/fraud/network")
def fraud_network(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Build a fraud-network view for the authenticated user.

    The network is derived from stored transaction identifiers:
    user -> device
    user -> beneficiary
    user -> location

    Only transactions belonging to the authenticated user are exposed.
    """

    # -------------------------------------------------
    # VERIFY JWT
    # -------------------------------------------------

    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    # -------------------------------------------------
    # VERIFY USER
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    # -------------------------------------------------
    # GET RECENT TRANSACTIONS
    # -------------------------------------------------

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(100)
        .all()
    )

    nodes = []
    edges = []
    node_ids = set()
    edge_keys = set()

    def normalize(value):
        if value is None:
            return None

        value = str(value).strip()

        return value if value else None

    def add_node(
        node_id,
        label,
        node_type,
        risk="LOW",
    ):
        if node_id in node_ids:
            return

        node_ids.add(node_id)

        nodes.append(
            {
                "id": node_id,
                "label": label,
                "type": node_type,
                "risk": risk,
            }
        )

    def add_edge(
        source,
        target,
        relationship,
        transaction_id,
    ):
        edge_key = (
            source,
            target,
            relationship,
            transaction_id,
        )

        if edge_key in edge_keys:
            return

        edge_keys.add(edge_key)

        edges.append(
            {
                "source": source,
                "target": target,
                "relationship": relationship,
                "transaction_id": transaction_id,
            }
        )

    # -------------------------------------------------
    # CURRENT USER
    # -------------------------------------------------

    user_node = f"user_{user.id}"

    add_node(
        user_node,
        user.name or f"User {user.id}",
        "user",
        "LOW",
    )

    # -------------------------------------------------
    # BUILD NETWORK
    # -------------------------------------------------

    for transaction in transactions:

        transaction_risk = str(
            transaction.risk_level or "LOW"
        ).upper()

        # ---------------------------------------------
        # TRANSACTION NODE
        # ---------------------------------------------

        transaction_node = (
            f"transaction_{transaction.id}"
        )

        add_node(
            transaction_node,
            f"Transaction #{transaction.id}",
            "transaction",
            transaction_risk,
        )

        add_edge(
            user_node,
            transaction_node,
            "MADE",
            transaction.id,
        )

        # ---------------------------------------------
        # DEVICE
        # ---------------------------------------------

        device_id = normalize(
            getattr(transaction, "device_id", None)
        )

        if device_id:

            device_node = f"device_{device_id}"

            add_node(
                device_node,
                device_id,
                "device",
                transaction_risk,
            )

            add_edge(
                transaction_node,
                device_node,
                "USED_DEVICE",
                transaction.id,
            )

        # ---------------------------------------------
        # BENEFICIARY
        # ---------------------------------------------

        beneficiary_id = normalize(
            getattr(
                transaction,
                "beneficiary_id",
                None,
            )
        )

        if beneficiary_id:

            beneficiary_node = (
                f"beneficiary_{beneficiary_id}"
            )

            add_node(
                beneficiary_node,
                beneficiary_id,
                "beneficiary",
                transaction_risk,
            )

            add_edge(
                transaction_node,
                beneficiary_node,
                "PAID_TO",
                transaction.id,
            )

        # ---------------------------------------------
        # LOCATION
        # ---------------------------------------------

        location = normalize(
            getattr(transaction, "location", None)
        )

        if location:

            location_node = (
                f"location_{location}"
            )

            add_node(
                location_node,
                location,
                "location",
                transaction_risk,
            )

            add_edge(
                transaction_node,
                location_node,
                "FROM_LOCATION",
                transaction.id,
            )

    # -------------------------------------------------
    # NETWORK RISK
    # -------------------------------------------------

    high_risk_transactions = sum(
        1
        for transaction in transactions
        if str(
            transaction.risk_level or ""
        ).upper() == "HIGH"
    )

    medium_risk_transactions = sum(
        1
        for transaction in transactions
        if str(
            transaction.risk_level or ""
        ).upper() == "MEDIUM"
    )

    blocked_transactions = sum(
        1
        for transaction in transactions
        if str(
            transaction.decision or ""
        ).upper() == "BLOCK"
    )

    if high_risk_transactions >= 3:
        network_risk = "HIGH"

    elif (
        high_risk_transactions >= 1
        or medium_risk_transactions >= 2
    ):
        network_risk = "MEDIUM"

    else:
        network_risk = "LOW"

    # -------------------------------------------------
    # NETWORK SUMMARY
    # -------------------------------------------------

    return {
        "success": True,

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": _get_user_role(user),
        },

        "network_risk": network_risk,

        "statistics": {
            "transactions": len(transactions),
            "nodes": len(nodes),
            "connections": len(edges),
            "high_risk_transactions": (
                high_risk_transactions
            ),
            "medium_risk_transactions": (
                medium_risk_transactions
            ),
            "blocked_transactions": (
                blocked_transactions
            ),
        },

        "nodes": nodes,
        "edges": edges,
    }


# =====================================================
# USER RISK PROFILE
# =====================================================

@app.get("/api/fraud/user-risk")
def get_user_risk_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated user's fraud-risk profile.

    The profile is calculated from the user's stored transactions
    and fraud alerts. It is intentionally scoped to the current user.
    """

    # -------------------------------------------------
    # VERIFY JWT
    # -------------------------------------------------

    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID.",
        )

    # -------------------------------------------------
    # FIND USER
    # -------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    # -------------------------------------------------
    # LOAD USER DATA
    # -------------------------------------------------

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(100)
        .all()
    )

    alerts = (
        db.query(FraudAlert)
        .filter(FraudAlert.user_id == user_id)
        .order_by(FraudAlert.created_at.desc())
        .limit(100)
        .all()
    )

    # -------------------------------------------------
    # BASIC STATISTICS
    # -------------------------------------------------

    total_transactions = len(transactions)
    total_alerts = len(alerts)

    blocked_transactions = sum(
        1
        for t in transactions
        if str(t.decision or "").upper() == "BLOCK"
    )

    high_risk_transactions = sum(
        1
        for t in transactions
        if str(t.risk_level or "").upper() == "HIGH"
    )

    medium_risk_transactions = sum(
        1
        for t in transactions
        if str(t.risk_level or "").upper() == "MEDIUM"
    )

    low_risk_transactions = sum(
        1
        for t in transactions
        if str(t.risk_level or "").upper() == "LOW"
    )

    # -------------------------------------------------
    # UNIQUE DEVICES / BENEFICIARIES / LOCATIONS
    # -------------------------------------------------

    devices = sorted(
        {
            str(getattr(t, "device_id", "")).strip()
            for t in transactions
            if getattr(t, "device_id", None)
            and str(getattr(t, "device_id", "")).strip()
        }
    )

    beneficiaries = sorted(
        {
            str(getattr(t, "beneficiary_id", "")).strip()
            for t in transactions
            if getattr(t, "beneficiary_id", None)
            and str(getattr(t, "beneficiary_id", "")).strip()
        }
    )

    locations = sorted(
        {
            str(getattr(t, "location", "")).strip()
            for t in transactions
            if getattr(t, "location", None)
            and str(getattr(t, "location", "")).strip()
        }
    )

    # -------------------------------------------------
    # USER RISK SCORE
    # -------------------------------------------------

    if transactions:
        risk_score = round(
            sum(int(t.risk_score or 0) for t in transactions)
            / total_transactions
        )
    else:
        risk_score = 0

    # Give repeated high-risk activity a stronger profile signal.
    if high_risk_transactions >= 5:
        risk_score = max(risk_score, 90)
    elif high_risk_transactions >= 3:
        risk_score = max(risk_score, 80)
    elif high_risk_transactions >= 1:
        risk_score = max(risk_score, 70)

    risk_score = max(0, min(100, int(risk_score)))

    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # -------------------------------------------------
    # RISK FACTORS
    # -------------------------------------------------

    risk_reasons = []

    if high_risk_transactions:
        risk_reasons.append(
            f"{high_risk_transactions} high-risk transaction"
            f"{'s' if high_risk_transactions != 1 else ''} detected."
        )

    if blocked_transactions:
        risk_reasons.append(
            f"{blocked_transactions} transaction"
            f"{'s' if blocked_transactions != 1 else ''} blocked by FraudShield."
        )

    new_beneficiary_count = sum(
        1 for t in transactions if t.beneficiary_new
    )

    new_device_count = sum(
        1 for t in transactions if t.device_new
    )

    location_change_count = sum(
        1 for t in transactions if t.location_changed
    )

    night_transaction_count = sum(
        1 for t in transactions if t.is_night_transaction
    )

    if new_beneficiary_count:
        risk_reasons.append(
            f"{new_beneficiary_count} transaction"
            f"{'s' if new_beneficiary_count != 1 else ''} used a new beneficiary."
        )

    if new_device_count:
        risk_reasons.append(
            f"{new_device_count} transaction"
            f"{'s' if new_device_count != 1 else ''} originated from a new device."
        )

    if location_change_count:
        risk_reasons.append(
            f"{location_change_count} transaction"
            f"{'s' if location_change_count != 1 else ''} involved a location change."
        )

    if night_transaction_count:
        risk_reasons.append(
            f"{night_transaction_count} transaction"
            f"{'s' if night_transaction_count != 1 else ''} occurred during unusual hours."
        )

    if not risk_reasons:
        risk_reasons.append(
            "No major fraud risk factors have been recorded yet."
        )

    # -------------------------------------------------
    # TRANSACTION RESPONSE
    # -------------------------------------------------

    transaction_items = [
        {
            "id": t.id,
            "amount": t.amount,
            "risk_score": t.risk_score,
            "risk_level": t.risk_level,
            "decision": t.decision,
            "confidence": t.confidence,
            "device_id": getattr(t, "device_id", None),
            "beneficiary_id": getattr(t, "beneficiary_id", None),
            "location": getattr(t, "location", None),
            "beneficiary_new": t.beneficiary_new,
            "device_new": t.device_new,
            "location_changed": t.location_changed,
            "transaction_count_last_hour": t.transaction_count_last_hour,
            "is_night_transaction": t.is_night_transaction,
            "reasons": (
                t.reasons.split(" | ")
                if t.reasons
                else []
            ),
            "created_at": t.created_at,
        }
        for t in transactions
    ]

    # -------------------------------------------------
    # ALERT RESPONSE
    # -------------------------------------------------

    alert_items = [
        {
            "id": alert.id,
            "transaction_id": alert.transaction_id,
            "amount": alert.amount,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "decision": alert.decision,
            "message": alert.message,
            "is_read": alert.is_read,
            "review_status": getattr(
                alert,
                "review_status",
                "PENDING",
            ),
            "analyst_decision": getattr(
                alert,
                "analyst_decision",
                None,
            ),
            "analyst_note": getattr(
                alert,
                "analyst_note",
                None,
            ),
            "created_at": alert.created_at,
        }
        for alert in alerts
    ]

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------

    return {
        "success": True,

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_active": user.is_active,
            "role": _get_user_role(user),
        },

        "risk_score": risk_score,
        "risk_level": risk_level,

        "statistics": {
            "transactions": total_transactions,
            "alerts": total_alerts,
            "blocked": blocked_transactions,
            "devices": len(devices),
            "beneficiaries": len(beneficiaries),
            "locations": len(locations),
            "high_risk": high_risk_transactions,
            "medium_risk": medium_risk_transactions,
            "low_risk": low_risk_transactions,
        },

        "devices": [
            {"id": device_id}
            for device_id in devices
        ],

        "beneficiaries": [
            {"id": beneficiary_id}
            for beneficiary_id in beneficiaries
        ],

        "locations": [
            {"name": location}
            for location in locations
        ],

        "risk_reasons": risk_reasons,

        "transactions": transaction_items,

        "alerts": alert_items,
    }