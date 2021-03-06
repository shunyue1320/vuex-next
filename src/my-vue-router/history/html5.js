// 生产state (后退的state, 当前的state, 前进的state, 是否替换, 滚动条位置)
function buildState(back, current, forward, replace = false, computedScroll = false) {
  return {
    back,
    current,
    forward,
    replace,
    scroll: computedScroll ? { left: window.pageXOffset, top: window.pageYOffset } : null,
    postition: window.history.length - 1 // 默认是2 因为浏览器初始重定向跳转了一次
  }
}

// 当前路由值
function createCurrentLocation(base) {
  const { pathname, search, hash } = window.location

  const hasPos = base.indexOf('#')  // 哈希

  if (hasPos > -1) {
    return base.slice(1) || '/'
  }
  return pathname + search + hash
}

// 开启历史路由导航
function useHistoryStateNavigation(base) {
  const currentLocation = {
    value: createCurrentLocation(base)
  }
  const historyState = {
    value: window.history.state 
  }

  // 第一次刷新页面没有状态
  if (!historyState.value) {
    changeLocation(currentLocation.value, buildState(null, currentLocation.value, null, true), true)
  }
  // 跳转更新状态
  function changeLocation(to, state, replace) {
    const hasPos = base.indexOf('#')
    const url = hasPos > -1 ? base + to : to;
    window.history[replace ? 'replaceState' : 'pushState'](state, null, url)
    historyState.value = state // 将自己生成的状态同步到路由系统中
  }

  // 为什么 changeLocation 两次， 目的是有一个跳转的过程 实现 befor 钩子
  function push(to, data) {
    /************* 跳转前 *************/
    // 跳转的时候 跳转前 beforRoute
    const currentState = Object.assign(
      {},
      historyState.value, // 当前状态
      { forward: to, scroll: { left: window.pageXOffset, top: window.pageYOffset } }
    )
    // 本质没有跳转 记入跳转前的状态 方法：replaceState
    changeLocation(currentState.current, currentState, true)

    /************* 跳转后 *************/
    // 新状态 此时currentLocation是前一个的
    const state = Object.assign(
      {},
      buildState(currentLocation.value, to, null),
      { postition: currentState.postition + 1 },
      data
    )
    // 再次跳转 真正的刷新页面 pushState
    changeLocation(to, state, false)
    currentLocation.value = to

  }

  function replace(to, data) {
    const state = Object.assign(
      {},
      buildState(historyState.value.back, to, historyState.value.forward, true),
      data
    )
    changeLocation(to, state, true)
    currentLocation.value = to // 替换后路径需要变为现在的
  }

  return {
    location: currentLocation,
    state: historyState,
    push,
    replace,
  }
}

// 监听 
function useHistoryListeners(base, historyState, currentLocation) {
  let listeners = []
  const PopStateHandler = ({state}) => {
    const to = createCurrentLocation(base)   // 去哪
    const from = currentLocation.value   // 从哪来
    const fromState = historyState.value // 从哪来状态

    currentLocation.value = to
    historyState.value = state

    // 判断 前进 还是 后退
    let isBack = state.postition < fromState.postition
    
    // 这里扩展钩子。。。
    listeners.forEach(listener => {
      listener(to, from, { isBack })
    })
  }
  window.addEventListener('popstate', PopStateHandler); // popstate 只能监听浏览器的前进后退键
 
  function listen(cb) {
    listeners.push(cb)
  }
  return {
    listen
  }
}

export function createWebHistory(base = '') {
  // 前进后退： 维护浏览器前进后退路由导航键
  const historyNavigation = useHistoryStateNavigation(base)
  // 监听：监听浏览器前进后退
  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location)
  
  const routerHistory = Object.assign({}, historyNavigation, historyListeners)
    
  // 代理一下 去掉 value
  Object.defineProperty(routerHistory, 'location', {
    get: () => historyNavigation.location.value
  })
  Object.defineProperty(routerHistory, 'state', {
    get: () => historyNavigation.state.value
  })
  
  return routerHistory
}
