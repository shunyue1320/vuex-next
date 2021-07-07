import { h, inject, provide, computed } from "vue"


export const RouterView = {
  name: 'RouterView',
  // props: {
  //   name: ''
  // }
  setup(props, { slots }) {
    const depth = inject('depth', 0) // 标记路由的深度 多少个 <router-view />
    const injectRoute = inject('route location')
    console.log("depth-----", depth)
    const matchedRouteRef = computed(() => injectRoute.matched[depth])
    provide('depth', depth + 1)
    return () => {
      const matchRoute = matchedRouteRef.value // record
      const viewComponent = matchRoute && matchRoute.components.default
      console.log("matchRoute", matchRoute)
      if (!viewComponent) {
        return slots.default && slots.default
      }

      return h(viewComponent)
    }
  }
}