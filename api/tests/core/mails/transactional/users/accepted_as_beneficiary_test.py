import pytest

from pcapi.core.mails.transactional.sendinblue_template_ids import TransactionalEmail
from pcapi.core.mails.transactional.users.accepted_as_beneficiary import get_accepted_as_beneficiary_email_data
from pcapi.core.mails.transactional.users.accepted_as_beneficiary import get_accepted_as_underage_beneficiary_email_data
from pcapi.core.testing import override_features
from pcapi.core.users import factories as users_factories


pytestmark = pytest.mark.usefixtures("db_session")


class GetAcceptedAsBeneficiaryEmailMailjetTest:
    @override_features(ENABLE_SENDINBLUE_TRANSACTIONAL_EMAILS=False)
    def test_return_correct_email_metadata(self):
        # Given
        user = users_factories.BeneficiaryGrant18Factory.create(email="fabien+test@example.net")

        # When
        email_data = get_accepted_as_beneficiary_email_data(user)

        assert email_data == {
            "Mj-TemplateID": 2016025,
            "Mj-TemplateLanguage": True,
            "Mj-campaign": "confirmation-credit",
            "Vars": {
                "depositAmount": 300,
            },
        }


class GetAcceptedAsBeneficiaryEmailSendinblueTest:
    @override_features(ENABLE_SENDINBLUE_TRANSACTIONAL_EMAILS=True)
    def test_return_correct_email_metadata(self):
        # Given
        user = users_factories.BeneficiaryGrant18Factory.create(email="fabien+test@example.net")

        # When
        email = get_accepted_as_beneficiary_email_data(user)

        # Then
        assert email.template == TransactionalEmail.ACCEPTED_AS_BENEFICIARY.value
        assert email.params == {"CREDIT": 300}


class GetAcceptedAsUnderageBeneficiaryEmailSendinblueTest:
    @override_features(ENABLE_SENDINBLUE_TRANSACTIONAL_EMAILS=True)
    def test_return_correct_data_for_native_age_17_user_v2(self):
        # Given
        user = users_factories.UnderageBeneficiaryFactory(firstName="Fabien", subscription_age=17)

        # When
        data = get_accepted_as_underage_beneficiary_email_data(user)

        # Then
        assert data.params["FIRSTNAME"] == "Fabien"
        assert data.params["CREDIT"] == 30

    @override_features(ENABLE_SENDINBLUE_TRANSACTIONAL_EMAILS=True)
    def test_return_correct_data_for_native_age_16_user_v2(self):
        # Given

        user = users_factories.UnderageBeneficiaryFactory.create(firstName="Fabien", subscription_age=16)

        # When
        data = get_accepted_as_underage_beneficiary_email_data(user)

        # Then
        assert data.params["FIRSTNAME"] == "Fabien"
        assert data.params["CREDIT"] == 30

    @override_features(ENABLE_SENDINBLUE_TRANSACTIONAL_EMAILS=True)
    def test_return_correct_data_for_native_age_15_user_v2(self):
        # Given
        user = users_factories.UnderageBeneficiaryFactory.create(firstName="Fabien", subscription_age=15)

        # When
        data = get_accepted_as_underage_beneficiary_email_data(user)

        # Then
        assert data.params["FIRSTNAME"] == "Fabien"
        assert data.params["CREDIT"] == 20
