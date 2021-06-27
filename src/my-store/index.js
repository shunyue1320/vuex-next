import { createStore } from '@/my-vuex'
// import { createStore } from 'vuex'

const store = createStore({
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
      setTimeout(() => {
        commit('add', payload)
      }, 1000)
    }
  },
  modules: {  // 子模块 实现逻辑拆分
    aCount: {
      namespaced: true,
      state: { count: 0 },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      },
      modules: {
        cCount: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            add(state, payload) {
              state.count += payload
            }
          }
        }
      }
    },
    bCount: {
      namespaced: true,
      state: { count: 0 },
      mutations: {
        add(state, payload) {
          state.count += payload
        }
      }
    }
  }
})

export default store