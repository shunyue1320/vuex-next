import { createRouter, createWebHistory, createWebHashHistory } from '@/my-vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      { path: 'a', component: {render: () => <h1>a页面</h1>}},
      { path: 'b', component: {render: () => <h1>b页面</h1>}}
    ],
    beforeEnter(to, from, next) {
      console.log("beforeEnter--------",to, from, next)
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  console.log("beforeEach--------",to, from, next)
})
router.beforeResolve((to, from, next) => {
  console.log('beforeResolve-------', to, from, next)
})
router.afterEach((to, from, next) => {
  console.log('afterEach------', to, from, next)
})

export default router