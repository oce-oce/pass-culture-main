from decimal import Decimal
import logging

import pcapi.core.bookings.factories as bookings_factories
import pcapi.core.offerers.factories as offerers_factories
import pcapi.core.offers.factories as offers_factories
from pcapi.core.users.models import User


logger = logging.getLogger(__name__)


def create_industrial_activation_offers() -> None:
    logger.info("create_industrial_activation_offers")

    activated_user = User.query.filter_by(has_beneficiary_role=True).first()
    offerer = offerers_factories.OffererFactory()
    venue = offerers_factories.VirtualVenueFactory(managingOfferer=offerer)
    offer = offers_factories.OfferFactory(venue=venue)
    stock = offers_factories.StockFactory(
        offer=offer,
        price=Decimal(0),
        quantity=10000,
    )

    bookings_factories.IndividualBookingFactory(
        individualBooking__user=activated_user,
        user=activated_user,
        stock=stock,
        token="ACTIVA",
    )

    logger.info("created 1 activation offer")
