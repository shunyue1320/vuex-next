import { createWebHistory } from './history/html5'
import { createWebHashHistory } from './history/hash'
import { ref, shallowRef, computed, reactive, unref } from 'vue'

// 格式化用户参数
function normalizeRouteRecord(record) {
  return {
    path: record.path, // 状态机 解析路径的分数 算出匹配规则
    meta: record.meta || {},
    name: record.name,
    components: {
      default: record.component
    },
    beforeEnter: record.beforeEnter,
    children: record.children || []
  }
}

// 创造匹配记录 构建父子关系
function createRouteRecordMatcher(record, parent) {
  // 修改 path 正则情况
  const matcher = {
    path: record.path,
    record,
    parent,
    children: []
  }

  if (parent) {
    parent.children.push(matcher)
  }

  return matcher
}

// 树的遍历
function createRouterMatcher(routes) {
  const matchers = []

  function addRoute(route, parent) {
    let normalizeRecord = normalizeRouteRecord(route)
    if (parent) { // 加上父级的路径
      normalizeRecord.path = parent.path + normalizeRecord.path
    }
    const matcher = createRouteRecordMatcher(normalizeRecord, parent)
    if ('children' in normalizeRecord) {
      let children = normalizeRecord.children
      for (let i = 0; i < children.length; i++) {
        addRoute(children[i], matcher) // 父级给到子集
      }
    }

    matchers.push(matcher) 
  }

  routes.forEach(route => addRoute(route))
  
  return {
    resolve,
    addRoute // 动态的添加路由
  }
}


const START_LOCATION_NORMALIZED = { // 初始化路由系统中的默认参数
  path: '/',
  // params: {}, // 路径参数
  // query: {},
  matched: [], // 当前路径匹配到的记录
}

function createRouter(options) {
  // 路由系统 { location: 路径, state: 状态, push, replace, listen: 钩子 }
  const routerHistory = options.history
  
  // '/a' => { A, parent: Home }  先渲染父级 后渲染子集
  const matcher = createRouterMatcher(options.routes)

  // 响应式 + 计算属性 （改变 value 更新视图）
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  function resolve(to) {
    if (typeof to === 'string') {
      matcher.resolve({path: to})
    } else {
      matcher.resolve(to)
    }
  }
  function pushWithRedirect(to) {
    const targetLocation = resolve(to)
    const from = currentRoute.value
    // 钩子 路由拦截
    
  }
  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    replace() {

    },
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


      app.component('RouterLink', {
        setup: (props, { slots }) => () => <a>{ slots.default && slots.default() }</a>
      })
      app.component('RouterView', {
        setup: (props, { slots }) => () => <div>11</div>
      })

      if (reactiveRoute.value == START_LOCATION_NORMALIZED) {
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