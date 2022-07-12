import { useHistory, useLocation } from 'react-router-dom'

import { Events } from 'core/FirebaseEvents/constants'
import { Location } from 'history'
import { RootState } from 'store/reducers'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

const useLogNavigation = (): void => {
  const history = useHistory()
  const location = useLocation()
  const logEvent = useSelector((state: RootState) => state.app.logEvent)
  useEffect(() => {
    if (logEvent) logEvent(Events.PAGE_VIEW, { from: location.pathname })
  }, [logEvent])

  useEffect(() => {
    if (logEvent) {
      const unlisten = history.listen((nextLocation: Location) => {
        logEvent(Events.PAGE_VIEW, { from: nextLocation.pathname })
      })
      return unlisten
    }
    return
  }, [location, history, logEvent])
}

export default useLogNavigation
