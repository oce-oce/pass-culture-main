import bookingSelector from '../booking'
import state from '../../mocks/global_state_2_Testing_10_10_18'

describe.skip('bookingSelector', () => {
  it('should select the global state', () => {
    expect(bookingSelector(state)).toEqual({})
  })
})
