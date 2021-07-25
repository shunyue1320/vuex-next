import { createWebHistory } from './history/html5'
import { createWebHashHistory } from './history/hash'
import { ref, shallowRef, computed, reactive, unref } from 'vue'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'
import { createRouterMatcher } from './matcher'


const START_LOCATION_NORMALIZED = { // 初始化路由系统中的默认参数
  path: '/',
  // params: {}, // 路径参数
  // query: {},
  matched: [], // 当前路径匹配到的记录
}

function useCallback() {
  const handlers = []
  function add(handlers) {
    handlers.push(handlers)
  }

  return {
    add,
    list: () => handlers
  }
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
  function pushWithRedirect(to) {
    const targetLocation = resolve(to) // { path: '/a', matched: [Home, A] }
    const from = currentRoute.value
    // 钩子 路由拦截
    
    // 根据第一次是 replace
    finalizeNavigetion(targetLocation, from)
  }
  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    replace() {},
    beforeEach, // （发布订阅） 可以注册多个
    beforeResolve,
    aftarEach,
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