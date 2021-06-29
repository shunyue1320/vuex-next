import Module from './module'
import { forEachValue } from '../utils'

export default class ModuleCollection {
  constructor(rootModule) {
    this.root = null
    this.register(rootModule, [])
  }
  register(rawModule, path) {
    const newModule = new Module(rawModule)
    if (path.length == 0) {
      this.root = newModule
    } else {
      // 通过 path 一层一层往下取到 parent 通过父级添加 childModule
      const parent = path.slice(0, -1).reduce((module, current) => {
        return module.getChild(current)
      }, this.root)
      parent.addChild(path[path.length - 1], newModule)
    }

    rawModule.modules && forEachValue(rawModule.modules, (rawChildModule, key) => {
      this.register(rawChildModule, path.concat(key))
    })
  }
  getNamespaced(path) {
    let module = this.root
    return path.reduce((namespacedStr, key) => {
      module = module.getChild(key)
      return namespacedStr + (module.namespaced ? key + '/' : '')
    }, '')
  }
  // register(rootModule, path) {
  //   const _children = {}
  //   const isModules = rootModule.modules
  //   isModules && forEachValue(rootModule.modules, function(module, moduleName) {
  //     _children[moduleName] = this.register(module)
  //   })
  //   return {
  //     _raw: rootModule,
  //     state: rootModule.state,
  //     _children: isModules ? _children : {}
  //   }
  // }
}