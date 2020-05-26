from typing import Dict

from flask import json, jsonify

from domain.booking_recap.booking_recap import BookingRecap, EventBookingRecap
from domain.booking_recap.bookings_recap_paginated import BookingsRecapPaginated
from utils.date import format_into_ISO_8601, utc_datetime_to_department_timezone


def serialize_bookings_recap_paginated(bookings_recap_paginated: BookingsRecapPaginated) -> json:
    return {
        'bookings_recap': [__serialize_booking_recap(booking_recap) for booking_recap in bookings_recap_paginated.bookings_recap],
        'page': bookings_recap_paginated.page,
        'pages': bookings_recap_paginated.pages,
        'total': bookings_recap_paginated.total
    }


def __serialize_booking_recap(booking_recap: BookingRecap) -> Dict:
    serialized_booking_recap = {
        "stock": {
            "type": "thing",
            "offer_name": booking_recap.offer_name,
        },
        "beneficiary": {
            "lastname": booking_recap.beneficiary_lastname,
            "firstname": booking_recap.beneficiary_firstname,
            "email": booking_recap.beneficiary_email,
        },
        "booking_token": booking_recap.booking_token,
        "booking_date": str(utc_datetime_to_department_timezone(
            date_time=booking_recap.booking_date,
            departement_code=booking_recap.venue_department_code
        )),
        "booking_status": booking_recap.booking_status.value,
        "booking_is_duo": booking_recap.booking_is_duo,
    }

    if isinstance(booking_recap, EventBookingRecap):
        serialized_booking_recap['stock']['type'] = "event"
        serialized_booking_recap['stock']['venue_department_code'] = booking_recap.venue_department_code
        serialized_booking_recap['stock']['event_beginning_datetime'] = format_into_ISO_8601(
            booking_recap.event_beginning_datetime)

    return serialized_booking_recap
