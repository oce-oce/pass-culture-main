from datetime import datetime
from typing import Any
from typing import List
from typing import Optional
from typing import Union

from pydantic import BaseModel

from pcapi.serialization.utils import dehumanize_field
from pcapi.serialization.utils import humanize_field
from pcapi.serialization.utils import to_camel
from pcapi.utils.date import format_into_utc_date


# DEPRECATED: (venaud, 2021-01-19): to remove when new offer and stock creation is deployed
class StockCreationBodyModelDeprecated(BaseModel):
    beginning_datetime: Optional[datetime]
    booking_limit_datetime: Optional[datetime]
    offer_id: int
    price: float
    quantity: Optional[int]

    # FIXME (cgaunet, 2020-11-05): these two fields are actually
    # unused for the stock creation. But the webapp does send them so
    # we must list them here (because of the `extra = "forbid"` below.
    beginning_time: Optional[str]
    offerer_id: Optional[str]

    _dehumanize_offer_id = dehumanize_field("offer_id")

    class Config:
        alias_generator = to_camel
        extra = "forbid"


# DEPRECATED: (venaud, 2021-01-19): to remove when new offer and stock creation is deployed
class StockEditionBodyModelDeprecated(BaseModel):
    beginning_datetime: Optional[datetime]
    booking_limit_datetime: Optional[datetime]
    offer_id: Optional[str]
    price: Optional[float]
    quantity: Optional[int]

    # FIXME (cgaunet, 2020-11-05): these three fields are actually
    # unused for the stock edition. But the webapp does send them so
    # we must list them here (because of the `extra = "forbid"` below.
    beginning_time: Optional[str]
    offerer_id: Optional[str]
    id: Optional[Any]

    class Config:
        alias_generator = to_camel
        extra = "forbid"


class StockResponseModel(BaseModel):
    beginningDatetime: Optional[datetime]
    bookingLimitDatetime: Optional[datetime]
    bookingsQuantity: int
    dateCreated: datetime
    dateModified: datetime
    id: str
    isEventDeletable: bool
    isEventExpired: bool
    offerId: str
    price: float
    quantity: Optional[int]

    _humanize_id = humanize_field("id")
    _humanize_offer_id = humanize_field("offerId")

    class Config:
        json_encoders = {datetime: format_into_utc_date}
        orm_mode = True


class StocksResponseModel(BaseModel):
    stocks: List[StockResponseModel]

    class Config:
        json_encoders = {datetime: format_into_utc_date}


class StockCreationBodyModel(BaseModel):
    beginning_datetime: Optional[datetime]
    booking_limit_datetime: Optional[datetime]
    price: float
    quantity: Optional[int]

    class Config:
        alias_generator = to_camel
        extra = "forbid"


class StockEditionBodyModel(BaseModel):
    beginning_datetime: Optional[datetime]
    booking_limit_datetime: Optional[datetime]
    id: int
    price: float
    quantity: Optional[int]

    _dehumanize_id = dehumanize_field("id")

    class Config:
        alias_generator = to_camel
        extra = "forbid"


class StockIdResponseModel(BaseModel):
    id: str

    _humanize_stock_id = humanize_field("id")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        arbitrary_types_allowed = True


class StocksUpsertBodyModel(BaseModel):
    offer_id: int
    stocks: List[Union[StockCreationBodyModel, StockEditionBodyModel]]

    _dehumanize_offer_id = dehumanize_field("offer_id")

    class Config:
        alias_generator = to_camel


class StockIdsResponseModel(BaseModel):
    stockIds: List[StockIdResponseModel]
