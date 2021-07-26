import { createWebHistory } from './history/html5'
import { createWebHashHistory } from './history/hash'
import { ref, shallowRef, computed, reactive, unref } from 'vue'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
import { createRouterMatcher } from './matcher'

// currentRoute = { path: '' , matched: [第一层<<router-view>组件A, 第二层<router-view>组件B ] }
// currentRoute => 核心就是已 START_LOCATION_NORMALIZED 为模板的一个响应式对象
// 当浏览器 url 改变时就会触发 matcher 内的方法去遍历 path 找到对应的<router-view>组件数组 matched
// 触发 matcher 方法是通过监听浏览器路由前进后退键 与 vue-router 内的路由的 push replace 等方法 
// 因为 provide 存入 currentRoute 是通过 computed 获取，与 reactive 存储响应式的
// 所以<router-view>组件就能通过 inject 响应式获取 matched 的值从而使路由组件响应式更新
// createWebHistory 负责记住上一页下一页的 path 等属性
// 路由钩子就是将函数存数组里，通过新旧 url 对比判断哪些组件 更新 卸载 新增 来执行对应钩子后再改变 matched
const START_LOCATION_NORMALIZED = { // 初始化路由系统中的默认参数
  path: '/',
  // params: {}, // 路径参数
  // query: {},
  matched: [], // 当前路径匹配到的记录
}

function useCallback() {
  const handlers = []
  function add(handler) {
    handlers.push(handler)
  }

  return {
    add,
    list: () => handlers
  }
}

function extractChangeRecords(to, from) {
  const leavingRecords = [], updatingRecords = [], enteringRecords = [];
  const len = Math.max(to.matched.length, from.matched.length)

  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i];
    if (recordFrom) {
      if (to.matched.find(record => record.path == recordFrom.path)) {
        updatingRecords.push(recordFrom)
      } else {
        leavingRecords.push(recordFrom)
      }
    }
    const recordTo = to.matched[i];
    if (recordTo) {
      if (!from.matched.find(record => record.path == recordTo.path)) {
        enteringRecords.push(recordTo)
      }
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords]
}
function guardToPromise(guard, to, from, record) {
  return () => new Promise((resolve, reject) => {
    const next = () => resolve()
    let guardReturn = guard.call(record, to, from, next)
    Promise.resolve(guardReturn).then(next) // 没有调用 next 通过 then 调用
  })
}

function extractComponentsGuards(matched, guradType, to, from) {
  const guards = []
  for (const record of matched) {
    let rawComponent = record.components.default
    const guard = rawComponent[guradType]
    // 钩子串联 pormise
    guard && guards.push(guardToPromise(guard, to, from, record))
  }
  return guards
}

// promise 组合函数
function runGuardQueue(guards) { // [ fn() => promise, fn() => promise ]
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve())
}

function createRouter(options) {
  // 路由系统 { location: 路径, state: 状态, push, replace, listen: 钩子 }
  const routerHistory = options.history
  
  // '/a' => { A, parent: Home }  先渲染父级 后渲染子集
  const matcher = createRouterMatcher(options.routes)

  // 响应式 + 计算属性 （改变 value 更新视图）
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  // 钩子订阅
  const beforeGuards = useCallback();
  const beforeResolveGuards = useCallback();
  const afterGuards = useCallback();

  function resolve(to) { // 标准化 to
    if (typeof to === 'string') {
      return matcher.resolve({path: to}) // 解析路径 组件
    } else {
      return matcher.resolve(to)
    }
  }
  let ready = false // 标记第一次渲染完毕
  function markAsReady() {
    if (ready) {
      return
    }
    ready = true

    routerHistory.listen((to) => { // 添加路由加监听 浏览器前进后退按钮
      const targetLocation = resolve(to)
      const from = currentRoute.value
      finalizeNavigetion(targetLocation, from, true) // 改变自实现的路由  replace 模式
    })
  }
  function finalizeNavigetion(to, from, replace) {
    if (from === START_LOCATION_NORMALIZED || replace) { // 第一次加载页面
      routerHistory.replace(to.path)
    } else {
      routerHistory.push(to.path)
    }
    currentRoute.value = to // 更新当前路径
    console.log("currentRoute", currentRoute.value)
    
    markAsReady() // 初始化监听 listen 监听浏览器前进后退按钮 改变 currentRoute
  }

  async function navigate(to, from) {
    // 进入组件 离开组件 更新组件
    const [ leavingRecords, updatingRecords, enteringRecords ] = extractChangeRecords(to, from)
    // 钩子执行顺序
    let guards = extractComponentsGuards( // 离开
      leavingRecords.reverse(), // 倒叙
      'beforeRouteLeave',
      to,
      from
    )

    return runGuardQueue(guards).then(() => {
      guards = []
      for (const guard of beforeGuards.list()) {
        guards.push(guardToPromise(guard, to, from, guard))
      }
      return runGuardQueue(guards)
    }).then(() => {
      guards = extractComponentsGuards( // 更新
        updatingRecords,
        'beforeRouteUpdate',
        to,
        from
      )
      return runGuardQueue(guards)
    }).then(() => {
      guards = []
      for (const record of to.matched) {
        if (record.beforeEnter) {
          guards.push(guardToPromise(record.beforeEnter, to, from, record))
        }
      }
      return runGuardQueue(guards)
    }).then(() => {
      guards = extractComponentsGuards( // 更新
        enteringRecords,
        'beforeRouteEnter',
        to,
        from
      )
      return runGuardQueue(guards)
    }).then(() => {
      guards = []
      for (const guard of beforeResolve.list()) {
        guards.push(guardToPromise(guard, to, from, guard))
      }
      return runGuardQueue(guards)
    })
  }

  function pushWithRedirect(to) {
    const targetLocation = resolve(to) // { path: '/a', matched: [Home, A] }
    const from = currentRoute.value
    
    // 生命周期钩子 路由拦截
    navigate(targetLocation, from).then(() => {
      // 根据第一次是 replace
      return finalizeNavigetion(targetLocation, from)
    }).then(() => {
      // 导航切换完毕执行 afterEach
      for (const guard of afterGuards.list()) {
        guard(to, from)
      }
    })
  }
  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    replace() {},
    beforeEach: beforeGuards.add, // （发布订阅） 可以注册多个
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
    install(app) {
      const router = this;
      app.config.globalProperties.$router = router
      // 响应式取值
      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRoute)
      })
      const reactiveRoute = {}
      for (let key in START_LOCATION_NORMALIZED) {
        reactiveRoute[key] = computed(() => currentRoute.value[key])
      }

      // 暴露出去
      app.provide('router', router) // 暴露方法
      app.provide('route location', reactive(reactiveRoute)) //暴露属性 reactive包裹后 不需要.value


      app.component('RouterLink', RouterLink)
      app.component('RouterView', RouterView)

      console.log("reactiveRoute.value", reactiveRoute.value)
      if (reactiveRoute.value == START_LOCATION_NORMALIZED) {
        console.log("reactiveRoute.22", reactiveRoute.value)
        // 默认就是初始化
        push(routerHistory.location)
      }

      // 解析路径

      // 页面的钩子
    }
  }

  return router
}

 export {
  createRouter,
  createWebHistory,
  createWebHashHistory
 }