from models import Offerer, Venue
from models.pc_object import PcObject
from utils.human_ids import dehumanize
from utils.logger import logger

def create_or_find_venue(venue_mock, offerer=None):
    if offerer is None:
        offerer = Offerer.query.get(dehumanize(venue_mock['offererId']))

    logger.info("look venue " + venue_mock['name'])

    venue = Venue.query.filter_by(
        managingOffererId=offerer.id,
        name=venue_mock['name']
    ).first()

    if venue is None:
        venue = Venue(from_dict=venue_mock)
        venue.managingOfferer = offerer
        if 'id' in venue_mock:
            venue.id = dehumanize(venue_mock['id'])
        PcObject.check_and_save(venue)
        logger.info("created venue " + str(venue))
    else:
        logger.info('--already here-- venue ' + str(venue))

    return venue

def create_or_find_venues(*venue_mocks):
    venues_count = str(len(venue_mocks))
    logger.info("venue mocks " + venues_count)

    venues = []
    for (venue_index, venue_mock) in enumerate(venue_mocks):
        logger.info(str(venue_index) + "/" + venues_count)
        venue = create_or_find_venue(venue_mock)
        venues.append(venue)

    return venues
