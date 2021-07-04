import { createApp } from 'vue'
// import App from './App.vue'
// import store from './store'

import App from './my-app.vue'
import store from './my-store'
import router from './router'


// Vue.use(store) 插件的用法， 会默认调用store中的install方法
createApp(App).use(store).use(router).mount('#app')
