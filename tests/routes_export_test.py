import os
from datetime import datetime

import pytest

from models import PcObject
from tests.conftest import clean_database

TOKEN = os.environ.get('EXPORT_TOKEN')

@pytest.mark.standalone
@clean_database
def test_export_model_returns_200_when_given_model_is_known(app):
    # given
    user = create_user(password='p@55sw0rd')
    PcObject.check_and_save(user)
    auth_request = req_with_auth(email=user.email, password='p@55sw0rd')

    # when
    response = auth_request.get(API_URL + '/exports/models/%s?token=%s' % ('Venue', TOKEN))

    # then
    assert response.status_code == 200


@pytest.mark.standalone
@clean_database
def test_export_model_returns_400_when_given_model_is_not_exportable(app):
    # given
    user = create_user(password='p@55sw0rd')
    PcObject.check_and_save(user)
    auth_request = req_with_auth(email=user.email, password='p@55sw0rd')

    # when
    response = auth_request.get(API_URL + '/exports/models/%s?token=%s' % ('VersionedMixin', TOKEN))

    # then
    assert response.status_code == 400
    assert response.json()['global'] == ['Classe non exportable : VersionedMixin']
import pytest
import requests

from tests.conftest import clean_database
from utils.test_utils import API_URL, create_user, req_with_auth


@pytest.mark.standalone
@clean_database
def test_get_users_per_department_returns_the_user_count_by_department_code_as_csv_file(app):
    # given
    user1 = create_user(email='user0@test.com', departement_code='93', date_created=datetime(2018, 2, 11))
    user2 = create_user(email='user5@test.com', departement_code='34', date_created=datetime(2018, 2, 13))
    user3 = create_user(email='user2@test.com', departement_code='75', date_created=datetime(2018, 3, 21))
    user4 = create_user(email='user3@test.com', departement_code='93', date_created=datetime(2018, 1, 23))
    user5 = create_user(email='user4@test.com', departement_code='34', date_created=datetime(2018, 4, 9))
    user6 = create_user(email='user1@test.com', departement_code='93', date_created=datetime(2018, 2, 1))

    PcObject.check_and_save(user1, user2, user3, user4, user5, user6)

    # when
    response = requests.get(API_URL + '/exports/users_stats?token=%s&date_intervall=%s' % (TOKEN, 'year'))

    # then
    print(response.content)
    assert response.status_code == 200
    assert response.content == b'department,date_intervall,distinct_user\r\n' \
                               b'34,2018-01-01 00:00:00,2\r\n' \
                               b'75,2018-01-01 00:00:00,1\r\n' \
                               b'93,2018-01-01 00:00:00,3\r\n'

@pytest.mark.standalone
@clean_database
def test_get_users_per_department_returns_bad_request_if_no_token_provided(app):
    # when
    response = requests.get(API_URL + '/exports/users')

    # then
    assert response.status_code == 400


def test_export_model_returns_400_when_given_model_is_unknown(app):
    # given
    user = create_user(password='p@55sw0rd')
    PcObject.check_and_save(user)
    auth_request = req_with_auth(email=user.email, password='p@55sw0rd')

    # when
    response = auth_request.get(API_URL + '/exports/models/%s?token=%s' % ('RandomStuff', TOKEN))

    # then
    assert response.status_code == 400
    assert response.json()['global'] == ['Classe inconnue : RandomStuff']
