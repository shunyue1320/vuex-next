import { createStore } from '@/my-vuex'
// import { createStore } from 'vuex'

function customPlugin(store) {
  let local = localStorage.getItem('VUEX:STATE')
  if (local) {
    store.replaceState(JSON.parse(local))
  }
  store.subscribe((mutation, state) => {
    localStorage.setItem('VUEX:STATE', JSON.stringify(state))
  })
}

const store = createStore({
  plugins: [ // 每次state改变 顺序依次执行插件 参数1 store
    customPlugin
  ],
  strict: true, // 严格模式 只能在 actions 执行 mutations
  state: {
    count: 0
  },
  getters: {
    double(state) {
      return state.count * 2
    }
  },
  mutations: {
    add(state, payload) {
      state.count += payload
    }
  },
  actions: {
    asyncAdd({ commit }, payload) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          commit('add', payload)
          resolve()
        }, 1000)
      })
    }
  },
  modules: {  // 子模块 实现逻辑拆分
    aCount: {
      namespaced: true,
      state: { count: 0 },
      getters: {
        double(state) {
          return state.count * 2
        }
      },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      },
      actions: {
        asyncAdd1({ commit }, payload) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              commit('add', payload)
              resolve()
            }, 1000)
          })
        }
      },
      // modules: {
      //   cCount: {
      //     namespaced: true,
      //     state: { count: 100 },
      //     getters: {
      //       double2(state) {
      //         return state.count * 2
      //       }
      //     },
      //     mutations: {
      //       add(state, payload) {
      //         state.count += payload
      //       }
      //     }
      //   }
      // }
    },
    bCount: {
      namespaced: true,
      state: { count: 0 },
      getters: {
        double(state) {
          return state.count * 2
        }
      },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      }
    }
  }
})

store.registerModule(['aCount', 'cCount'], {
  namespaced: true,
  state: {
    count: 100
  },
  mutations: {
    add(state, payload) {
      state.count += payload
    }
  },
  mutation:{
    add(state, payload) {
      console.log("11111111")
      state.count += payload
    }
  },
})

export default store