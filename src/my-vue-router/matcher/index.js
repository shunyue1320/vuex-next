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
export function createRouterMatcher(routes) {
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

  // 解析路径与对应的组件 { path: '/a', matched: [Home, A] }
  function resolve(location) {
    const matched = []
    const path =  location.path
    let matcher = matchers.find(m => m.path === path)

    while (matcher) {
      matched.unshift(matcher.record)
      matcher = matcher.parent
    }

    return {
      path,
      matched
    }
  }
  
  return {
    resolve,
    addRoute // 动态的添加路由
  }
}