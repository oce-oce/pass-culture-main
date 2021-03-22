import { connect } from 'react-redux'
import { compose } from 'redux'
import { requestData } from 'redux-saga-data'

import withTracking from 'components/hocs/withTracking'
import { selectIsFeatureActive } from 'store/selectors/data/featuresSelectors'
import { selectOffererById } from 'store/selectors/data/offerersSelectors'
import { selectCurrentUser } from 'store/selectors/data/usersSelectors'
import { selectPhysicalVenuesByOffererId } from 'store/selectors/data/venuesSelectors'
import { offererNormalizer } from 'utils/normalizers'

import OffererDetails from './OffererDetails'
import { makeOffererComponentValueObject } from './OffererFactory'

export const mapStateToProps = (state, ownProps) => {
  const { match } = ownProps
  const {
    params: { offererId },
  } = match
  const currentUser = selectCurrentUser(state)
  return {
    currentUser,
    isNewHomepageActive: selectIsFeatureActive(state, 'PRO_HOMEPAGE'),
    offerer: makeOffererComponentValueObject(selectOffererById, offererId, state),
    offererId,
    venues: selectPhysicalVenuesByOffererId(state, offererId),
  }
}

export const mapDispatchToProps = dispatch => {
  return {
    loadOffererById: offererId => {
      dispatch(
        requestData({
          apiPath: `/offerers/${offererId}`,
          normalizer: offererNormalizer,
        })
      )
    },
  }
}

export default compose(
  withTracking('Offerer'),
  connect(mapStateToProps, mapDispatchToProps)
)(OffererDetails)
