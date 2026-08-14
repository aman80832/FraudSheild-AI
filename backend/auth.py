import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from jose import jwt, JWTError


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()


# =====================================================
# JWT SETTINGS
# =====================================================

JWT_SECRET = os.getenv("JWT_SECRET")

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)

JWT_EXPIRE_MINUTES = int(
    os.getenv(
        "JWT_EXPIRE_MINUTES",
        "60"
    )
)


# =====================================================
# VALIDATE CONFIGURATION
# =====================================================

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is missing from backend/.env"
    )


print("JWT configuration loaded")
print("JWT algorithm:", JWT_ALGORITHM)
print("JWT secret loaded:", bool(JWT_SECRET))
print("JWT secret length:", len(JWT_SECRET))


# =====================================================
# CREATE ACCESS TOKEN
# =====================================================

def create_access_token(user_id: int):

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=JWT_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return token


# =====================================================
# VERIFY ACCESS TOKEN
# =====================================================

def verify_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[
                JWT_ALGORITHM
            ]
        )

        user_id = payload.get("sub")

        if not user_id:
            return None

        return payload

    except JWTError as error:

        print(
            "JWT verification failed:",
            str(error)
        )

        return None