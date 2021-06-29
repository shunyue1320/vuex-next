import { reactive } from 'vue'
import { forEachValue, isPromise } from './utils'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collection'

function getNestedState(state, path) { // 根据路径获取 store 上面的最新状态
  return path.reduce((state, key) => state[key], state)
}

function installModule(store, rootState, path, module) {
  let isRoot = !!path.length

  // const namespaced = store._modules.getNamespaced(path)
  // console.log("namespaced0---", namespaced)

  if (isRoot) {
    let parentState = path.slice(0, -1).reduce((state, key) => state[key], rootState)
    parentState[path[path.length - 1]] = module.state
  }

  // getters module._raw.getters
  module.forEachGetter((getter, key) => {
    store._wrappedGetters[key] = function () {
      return getter(getNestedState(store.state, path))
    }
  })

  // mutation { add: [fn, fn, fn ]}
  module.forEachMutation((mutation, key) => {
    const entry = store._mutations[key] || (store._mutations[key] = [])
    entry.push((payload) => { // stroe.commit('add', payload)
      mutation.call(store, getNestedState(store.state, path), payload)
    })
  })

  // actions (mutation 与 actions 的区别，action 执行后返回一个 promise)
  module.forEachAction((action, key) => {
    const entry = store._actions[key] || (store._actions[key] = [])
    entry.push((payload) => { // stroe.commit('add', payload)
      const res = action.call(store, store, payload)
      // 判断是否为 promise
      if (!isPromise(res)) {
        return Promise.resolve(res)
      }
      return res
    })
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}

function resetStoreState(store, state) {
  store._state = reactive({ data: state })
  const wrappedGetters = store._wrappedGetters
  store.getters = {}
  forEachValue(wrappedGetters, (getter, key) => {
    Object.defineProperty(store.getters, key, {
      enumerable: true,
      get: getter // computed 缓存
    })
  })
}

// 创建容器返回一个 store
export default class Store {
  constructor(options) {
    const store = this
    // 格式化配置
    store._modules = new ModuleCollection(options)
    // { add: [fn, fn, fn]} 发布订阅
    store._wrappedGetters = Object.create(null)
    store._mutations = Object.create(null)
    store._actions = Object.create(null)

    const state = store._modules.root.state
    installModule(store, state, [], store._modules.root)
    resetStoreState(store, state)
    console.log("store-----", store)
  }

  get state() {
    return this._state.data
  }

  commit = (type, payload) => {
    const entry = this._mutations[type] || []
    entry.forEach(handler => handler(payload))
  }

  dispatch = (type, payload) => {
    const entry = this._actions[type] || []
    return Promise.all(entry.map(handler => handler(payload)))
  }

  install(app, injectKey = storeKey) {
    // vue3 的 provide 方法给根 app 增加一个 _provides, 让子组件向上查找
    app.provide(injectKey, this)
    app.config.globalProperties.$store = this // 将 $store 加到 vue3 实例上 （兼容 vue2）
  }
}


/*
// store 格式化配置
root = {
  _raw: rootModule,
  state: rootModule.state,
  _children: {
    aCount: {
      _raw: aModule,
      state: aModule.state,
      _children: {}
    },
    bCount: {
      _raw: bModule,
      state: bModule.state,
      _children: null
    },
  }
}

// state 格式化配置

*/






// import { reactive } from 'vue'
// import { forEachValue } from './utils'
// import { storeKey } from './injectKey'
// // 创建容器返回一个 store
// export default class Store {
//   constructor(options) {
//     const store = this
//     // 解决重新赋值问题 store._state.data = xxx
//     store._state = reactive({ data: options.state })

//     // 实现 getters 其实就是实现一个计算属性
//     const _getters = options.getters
//     store.getters = {}
//     forEachValue(_getters, function (fn, key) {
//       Object.defineProperty(store.getters, key, {
//         enumerable: true,
//         get: () => fn(store.state) // 用 computed 包裹可以实现状态缓存
//       })
//     })

//     // 实现 dispatch commit
//     const _mutations = options.mutations
//     const _actions = options.actions
//     store._mutations = Object.create(null)
//     store._actions = Object.create(null)
//     forEachValue(_mutations, function (mutation, key) {
//       store._mutations[key] = (value) => {
//         mutation.call(store, store.state, value)
//       }
//     })
//     forEachValue(_actions, function (action, key) {
//       store._actions[key] = (value) => {
//         action.call(store, store, value)
//       }
//     })
//   }
//   get state() {
//     return this._state.data
//   }
//   dispatch = (type, value) => {
//     this._actions[type](value)
//   }
//   commit = (type, value) => {
//     this._mutations[type](value)
//   }

//   install(app, injectKey = storeKey) {
//     // vue3 的 provide 方法给根 app 增加一个 _provides, 让子组件向上查找
//     app.provide(injectKey, this)
//     app.config.globalProperties.$store = this // 将 $store 加到 vue3 实例上 （兼容 vue2）
//   }
// }