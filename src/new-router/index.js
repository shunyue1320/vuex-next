


function createCurrentLocation() {
  const { pathname, search, hash } = window.location
  return pathname + search + hash
}

function useHistoryStateNavigation() {
  const currentLocation = {
    value: createCurrentLocation()
  }
  const historyState = {
    value: window.history.state
  }
}

function createWebHistory() {
  const historyNavigation = useHistoryStateNavigation()
}


const history = createWebHistory()