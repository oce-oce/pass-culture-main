from datetime import MINYEAR
from datetime import datetime
from datetime import timedelta
from typing import Optional

from sqlalchemy import Column
from sqlalchemy import func
from sqlalchemy.orm import Query
from sqlalchemy.sql.elements import BinaryExpression
from sqlalchemy.sql.functions import Function

from pcapi.core.users.models import User
from pcapi.core.users.utils import sanitize_email
from pcapi.models import db
from pcapi.models.beneficiary_import import BeneficiaryImport
from pcapi.models.beneficiary_import import BeneficiaryImportSources
from pcapi.models.beneficiary_import_status import BeneficiaryImportStatus
from pcapi.models.beneficiary_import_status import ImportStatus
from pcapi.models.user_offerer import UserOfferer


def _find_user_by_email_query(email: str):
    # FIXME (dbaty, 2021-05-02): remove call to `func.lower()` once
    # all emails have been sanitized in the database.
    return User.query.filter(func.lower(User.email) == sanitize_email(email))


def count_users_by_email(email: str) -> int:
    return _find_user_by_email_query(email).count()


def find_beneficiary_users_by_email_provider(email_provider: str) -> list[User]:
    formatted_email_provider = f"%@{email_provider}"
    return (
        User.query.filter_by(is_beneficiary=True, isActive=True)
        .filter(func.lower(User.email).like(func.lower(formatted_email_provider)))
        .all()
    )


def find_pro_users_by_email_provider(email_provider: str) -> list[User]:
    formatted_email_provider = f"%@{email_provider}"
    return (
        User.query.filter_by(is_beneficiary=False, isActive=True)
        .join(UserOfferer)
        .filter(User.offerers.any())
        .filter(func.lower(User.email).like(func.lower(formatted_email_provider)))
        .all()
    )


def beneficiary_by_civility_query(
    first_name: str,
    last_name: str,
    date_of_birth: datetime = None,
    interval: timedelta = None,
    exclude_email: Optional[str] = None,
) -> Query:
    civility_predicate = (
        (matching(User.firstName, first_name)) & (matching(User.lastName, last_name)) & (User.is_beneficiary == True)
    )
    if interval:
        civility_predicate = civility_predicate & (User.dateCreated >= (datetime.now() - interval))
    if date_of_birth:
        civility_predicate = civility_predicate & (User.dateOfBirth == date_of_birth)
    if exclude_email:
        civility_predicate = civility_predicate & (User.email != exclude_email)

    return User.query.filter(civility_predicate)


def find_by_validation_token(token: str) -> User:
    return User.query.filter_by(validationToken=token).one_or_none()


def get_all_users_wallet_balances():
    """Return wallet balances.

    WARNING: it ignores the expiration date of the deposits.
    """
    return (
        db.session.query(
            User.id.label("user_id"),
            func.get_wallet_balance(User.id, False).label("current_balance"),
            func.get_wallet_balance(User.id, True).label("real_balance"),
        )
        .filter(User.deposits != None)
        .order_by(User.id)
    )


def keep_only_webapp_users(query: Query) -> Query:
    return query.filter((~User.UserOfferers.any()) & (User.isAdmin.is_(False)))


def find_most_recent_beneficiary_creation_date_for_source(source: BeneficiaryImportSources, source_id: int) -> datetime:
    most_recent_creation = (
        BeneficiaryImportStatus.query.join(BeneficiaryImport)
        .filter(BeneficiaryImport.source == source.value)
        .filter(BeneficiaryImport.sourceId == source_id)
        .filter(BeneficiaryImportStatus.status == ImportStatus.CREATED)
        .order_by(BeneficiaryImportStatus.date.desc())
        .first()
    )

    if not most_recent_creation:
        return datetime(MINYEAR, 1, 1)

    return most_recent_creation.date


def matching(column: Column, search_value: str) -> BinaryExpression:
    return _sanitized_string(column) == _sanitized_string(search_value)


def _sanitized_string(value: str) -> Function:
    sanitized = func.replace(value, "-", "")
    sanitized = func.replace(sanitized, " ", "")
    sanitized = func.unaccent(sanitized)
    sanitized = func.lower(sanitized)
    return sanitized
