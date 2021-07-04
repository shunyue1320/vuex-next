import { createWebHistory } from './history/html5'
import { createWebHashHistory } from './history/hash'


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
  console.log("matchers", matchers)
}


function createRouter(options) {
  const routerHistory = options.history
  
  // '/a' => { A, parent: Home }  先渲染父级 后渲染子集

  const matcher = createRouterMatcher(options.routes)

  const router = {
    install(app) {
      app.component('RouterLink', {
        setup: (props, { slots }) => () => <a>{ slots.default && slots.default() }</a>
      })
      app.component('RouterView', {
        setup: (props, { slots }) => () => <div>11</div>
      })
    }
  }

  return router
}

 export {
  createRouter,
  createWebHistory,
  createWebHashHistory
 }