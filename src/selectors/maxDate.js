import createCachedSelector from 're-reselect'

import occurrencesSelector from './occurrences'

export default createCachedSelector(
  (state, venueId, eventId) => occurrencesSelector(state, venueId, eventId),
  occurrences => {
    return occurrences.reduce(
      (max, d) =>
        max && max.isAfter(d.beginningDatetimeMoment)
          ? max
          : d.beginningDatetimeMoment,
      null
    )
  }
)((state, venueId, eventId) => `${venueId || ''}/${eventId || ''}`)
