from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    ForeignKey,
    Text,
    DateTime,
)

from database import Base


# =====================================================
# USER MODEL
# =====================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    google_id = Column(
        String,
        unique=True,
        nullable=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    # Used for normal email/password registration.
    # NULL for Google-only accounts.
    password_hash = Column(
        String,
        nullable=True,
    )

    picture = Column(
        String,
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    # =================================================
    # ROLE-BASED ACCESS CONTROL
    # =================================================

    # Available roles:
    #
    # USER
    # ANALYST
    # ADMIN
    #
    # Normal users get USER by default.
    # Analysts/Admins will later be given elevated
    # permissions for fraud investigation.
    role = Column(
        String,
        default="USER",
        nullable=False,
        index=True,
    )


# =====================================================
# TRANSACTION MODEL
# =====================================================

class Transaction(Base):

    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # =================================================
    # FRAUD NETWORK IDENTIFIERS
    # =================================================

    device_id = Column(
        String,
        nullable=True,
        index=True,
    )

    beneficiary_id = Column(
        String,
        nullable=True,
        index=True,
    )

    location = Column(
        String,
        nullable=True,
        index=True,
    )

    # =================================================
    # TRANSACTION DETAILS
    # =================================================

    amount = Column(
        Float,
        nullable=False,
    )

    beneficiary_new = Column(
        Boolean,
        default=False,
    )

    device_new = Column(
        Boolean,
        default=False,
    )

    location_changed = Column(
        Boolean,
        default=False,
    )

    transaction_count_last_hour = Column(
        Integer,
        default=1,
    )

    is_night_transaction = Column(
        Boolean,
        default=False,
    )

    # =================================================
    # FRAUD ANALYSIS RESULTS
    # =================================================

    risk_score = Column(
        Integer,
        nullable=False,
    )

    risk_level = Column(
        String,
        nullable=False,
    )

    decision = Column(
        String,
        nullable=False,
    )

    confidence = Column(
        Integer,
        nullable=False,
    )

    reasons = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


# =====================================================
# FRAUD ALERT MODEL
# =====================================================

class FraudAlert(Base):

    __tablename__ = "fraud_alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=False,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    risk_score = Column(
        Integer,
        nullable=False,
    )

    risk_level = Column(
        String,
        nullable=False,
    )

    decision = Column(
        String,
        nullable=False,
    )

    message = Column(
        String,
        nullable=True,
    )

    is_read = Column(
        Boolean,
        default=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # =================================================
    # ANALYST REVIEW
    # =================================================

    review_status = Column(
        String,
        default="PENDING",
    )

    analyst_decision = Column(
        String,
        nullable=True,
    )

    analyst_note = Column(
        Text,
        nullable=True,
    )

    reviewed_at = Column(
        DateTime,
        nullable=True,
    )