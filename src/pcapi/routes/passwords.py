from flask import current_app as app
from flask import request
from flask_login import current_user
from flask_login import login_required

from pcapi.domain.password import check_password_strength
from pcapi.domain.password import check_password_validity
from pcapi.domain.password import check_reset_token_validity
from pcapi.domain.password import generate_reset_token
from pcapi.domain.password import validate_change_password_request
from pcapi.domain.password import validate_new_password_request
from pcapi.domain.password import validate_reset_request
from pcapi.domain.user_emails import send_reset_password_email_to_pro
from pcapi.domain.user_emails import send_reset_password_email_to_user
from pcapi.flask_app import private_api
from pcapi.models import ApiErrors
from pcapi.repository import repository
from pcapi.repository.user_queries import find_user_by_email
from pcapi.repository.user_queries import find_user_by_reset_password_token
from pcapi.utils.mailing import MailServiceException
from pcapi.utils.mailing import send_raw_email
from pcapi.utils.rest import expect_json_data


@private_api.route('/users/current/change-password', methods=['POST'])
@login_required
@expect_json_data
def post_change_password():
    json = request.get_json()
    validate_change_password_request(json)
    user = find_user_by_email(current_user.email)
    new_password = json['newPassword']
    new_confirmation_password = json['newConfirmationPassword']
    old_password = json['oldPassword']
    check_password_validity(new_password, new_confirmation_password, old_password, user)
    user.setPassword(new_password)
    repository.save(user)
    return '', 204


@private_api.route("/users/reset-password", methods=['POST'])
@expect_json_data
def post_for_password_token():
    validate_reset_request(request)
    email = request.get_json()['email']
    user = find_user_by_email(email)

    if not user:
        return '', 204

    generate_reset_token(user)
    repository.save(user)

    is_not_pro_user = user.canBookFreeOffers

    if is_not_pro_user:
        try:
            send_reset_password_email_to_user(user, send_raw_email)
        except MailServiceException as mail_service_exception:
            app.logger.exception('[send_reset_password_email_to_user] '
                             'Mail service failure', mail_service_exception)
    else:
        try:
            send_reset_password_email_to_pro(user, send_raw_email)
        except MailServiceException as mail_service_exception:
            app.logger.exception('[send_reset_password_email_to_pro] '
                             'Mail service failure', mail_service_exception)

    return '', 204


@private_api.route("/users/new-password", methods=['POST'])
@expect_json_data
def post_new_password():
    validate_new_password_request(request)
    token = request.get_json()['token']
    new_password = request.get_json()['newPassword']
    user = find_user_by_reset_password_token(token)

    if not user:
        errors = ApiErrors()
        errors.add_error('token', 'Votre lien de changement de mot de passe est invalide.')
        raise errors

    check_reset_token_validity(user)
    check_password_strength('newPassword', new_password)

    user.setPassword(new_password)
    repository.save(user)

    return '', 204
