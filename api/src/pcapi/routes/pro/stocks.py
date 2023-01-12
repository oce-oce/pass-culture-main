import decimal
import logging

from flask_login import current_user
from flask_login import login_required

from pcapi.core.offerers import exceptions as offerers_exceptions
from pcapi.core.offerers.models import Venue
import pcapi.core.offerers.repository as offerers_repository
from pcapi.core.offers import exceptions as offers_exceptions
import pcapi.core.offers.api as offers_api
from pcapi.core.offers.models import Offer
from pcapi.core.offers.models import Stock
from pcapi.core.offers.repository import get_stocks_for_offer
from pcapi.models.api_errors import ApiErrors
from pcapi.repository import transaction
from pcapi.routes.apis import private_api
from pcapi.routes.serialization import stock_serialize
from pcapi.routes.serialization.stock_serialize import StockIdResponseModel
from pcapi.routes.serialization.stock_serialize import StockResponseModel
from pcapi.routes.serialization.stock_serialize import StocksResponseModel
from pcapi.routes.serialization.stock_serialize import StocksUpsertBodyModel
from pcapi.serialization import utils as serialization_utils
from pcapi.serialization.decorator import spectree_serialize
from pcapi.utils.human_ids import dehumanize
from pcapi.utils.rest import check_user_has_access_to_offerer

from . import blueprint


logger = logging.getLogger(__name__)


@private_api.route("/offers/<offer_id>/stocks", methods=["GET"])
@login_required
@spectree_serialize(response_model=StocksResponseModel, api=blueprint.pro_private_schema)
def get_stocks(offer_id: str) -> StocksResponseModel:
    try:
        offerer = offerers_repository.get_by_offer_id(dehumanize(offer_id))  # type: ignore [arg-type]
    except offerers_exceptions.CannotFindOffererForOfferId:
        raise ApiErrors({"offerer": ["Aucune structure trouvée à partir de cette offre"]}, status_code=404)
    check_user_has_access_to_offerer(current_user, offerer.id)
    stocks = get_stocks_for_offer(dehumanize(offer_id))  # type: ignore [arg-type]
    return StocksResponseModel(
        stocks=[StockResponseModel.from_orm(stock) for stock in stocks],
    )


def _get_existing_stocks(
    offer_id: int, stocks_payload: list[stock_serialize.StockCreationBodyModel | stock_serialize.StockEditionBodyModel]
) -> dict[int, Stock]:
    existing_stocks = Stock.query.filter(
        Stock.offerId == offer_id,
        Stock.id.in_(
            [
                stock_payload.id
                for stock_payload in stocks_payload
                if isinstance(stock_payload, stock_serialize.StockEditionBodyModel)
            ]
        ),
    ).all()
    return {existing_stocks.id: existing_stocks for existing_stocks in existing_stocks}


@private_api.route("/stocks/bulk", methods=["POST"])
@login_required
@spectree_serialize(on_success_status=201, response_model=StocksResponseModel, api=blueprint.pro_private_schema)
def upsert_stocks(body: StocksUpsertBodyModel) -> StocksResponseModel:
    try:
        offerer = offerers_repository.get_by_offer_id(body.offer_id)
    except offerers_exceptions.CannotFindOffererForOfferId:
        raise ApiErrors({"offerer": ["Aucune structure trouvée à partir de cette offre"]}, status_code=404)
    check_user_has_access_to_offerer(current_user, offerer.id)

    offer = Offer.query.get(body.offer_id)
    existing_stocks = _get_existing_stocks(body.offer_id, body.stocks)
    upserted_stocks = []
    edited_stocks_with_update_info: list[tuple[Stock, bool]] = []
    try:
        with transaction():
            for stock_payload in body.stocks:
                if isinstance(stock_payload, stock_serialize.StockEditionBodyModel):
                    if stock_payload.id not in existing_stocks:
                        raise ApiErrors(
                            {"stock_id": ["Le stock avec l'id %s n'existe pas" % stock_payload.id]}, status_code=400
                        )
                    edited_stock, is_beginning_updated = offers_api.edit_stock(
                        existing_stocks[stock_payload.id],
                        price=decimal.Decimal(stock_payload.price),
                        quantity=stock_payload.quantity,
                        beginning_datetime=serialization_utils.as_utc_without_timezone(stock_payload.beginning_datetime)
                        if stock_payload.beginning_datetime
                        else None,
                        booking_limit_datetime=serialization_utils.as_utc_without_timezone(
                            stock_payload.booking_limit_datetime
                        )
                        if stock_payload.booking_limit_datetime
                        else None,
                    )
                    upserted_stocks.append(edited_stock)
                    edited_stocks_with_update_info.append((edited_stock, is_beginning_updated))
                else:
                    created_stock = offers_api.create_stock(
                        offer,
                        price=decimal.Decimal(stock_payload.price),
                        activation_codes=stock_payload.activation_codes,
                        activation_codes_expiration_datetime=stock_payload.activation_codes_expiration_datetime,
                        quantity=stock_payload.quantity,
                        beginning_datetime=stock_payload.beginning_datetime,
                        booking_limit_datetime=stock_payload.booking_limit_datetime,
                    )
                    upserted_stocks.append(created_stock)

    except offers_exceptions.BookingLimitDatetimeTooLate:
        raise ApiErrors(
            {"stocks": ["La date limite de réservation ne peut être postérieure à la date de début de l'évènement"]},
            status_code=400,
        )
    offers_api.handle_stocks_edition(body.offer_id, edited_stocks_with_update_info)

    return StocksResponseModel(stocks=[StockResponseModel.from_orm(stock) for stock in upserted_stocks])


@private_api.route("/stocks/<stock_id>", methods=["DELETE"])
@login_required
@spectree_serialize(response_model=StockIdResponseModel, api=blueprint.pro_private_schema)
def delete_stock(stock_id: str) -> StockIdResponseModel:
    # fmt: off
    stock = (
        Stock.queryNotSoftDeleted()
            .filter_by(id=dehumanize(stock_id))
            .join(Offer, Venue)
            .first_or_404()
    )
    # fmt: on

    offerer_id = stock.offer.venue.managingOffererId
    check_user_has_access_to_offerer(current_user, offerer_id)

    offers_api.delete_stock(stock)

    return StockIdResponseModel.from_orm(stock)
