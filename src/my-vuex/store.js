import { reactive } from 'vue'
import { forEachValue } from './utils'
import { storeKey } from './injectKey'
import ModuleCollection from './module/module-collection'

function installModule(store, rootState, path, module) {
  let isRoot = path.length
  
}

// 创建容器返回一个 store
export default class Store {
  constructor(options) {
    const store = this
    // 格式化配置
    store._modules = new ModuleCollection(options)
    console.log("111111111112", store._modules)

    const state = store._modules.root.state
    installModule(store, state, [], store._modules.root)
  }

  install(app, injectKey = storeKey) {
    // vue3 的 provide 方法给根 app 增加一个 _provides, 让子组件向上查找
    app.provide(injectKey, this)
    app.config.globalProperties.$store = this // 将 $store 加到 vue3 实例上 （兼容 vue2）
  }
}


/*
// 格式化配置
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