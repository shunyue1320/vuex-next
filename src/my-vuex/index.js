import { useStore } from './injectKey'
import Store from './store'

function createStore(options) {
  return new Store(options)
}

export {
  useStore,
  createStore
}

/**
 * 步骤拆分，逻辑统一，定位标志
 * 
1. 将 options 变成如下格式：（实现方法要考虑到后续的插入与删除模块操作 函数复用性）
  核心解构方法都已 path 数组作为参考系，path 犹如进度百分比，path 的作用可便后续新增 增删改查 操作
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

2. 解构出能直接使用的根方法：（用一套逻辑实现嵌套的解构 函数复用性 便于理解性）
store = {
  _modules: 第一步,
  state: { aa: data, bbM: { aa: data } }
  _wrappedGetters：{ aa: fn, bbM/aa: fn },
  _mutations: { aa: fn, aa/bb: fn },
  _actions: { aa: fn, aa/bb: fn }
}

3. 实现响应式状态
store.state
store.getters
*/