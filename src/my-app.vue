<template>
  <div> count: {{ count }} | double: {{ double }} </div>
  <hr>
  <!-- $store 是挂载到实例上，兼容 vue2 用的 -->
  <div> {{ $store.state.count }} </div>
  <hr>
  <button @click="$store.state.count++">错误修改</button>
  <button @click="add">同步修改</button>
  <button @click="asyncAdd">异步修改</button>
  <hr>
  <div> aCount: {{ aCount }} | bCount: {{ bCount }} </div>
</template>

<script>
import { computed, toRefs } from 'vue'
import { useStore } from '@/my-vuex'
// import { useStore } from 'vuex'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    console.log("store", store)

    function add() {
      store.commit('add', 1)
    }
    function asyncAdd() {
      store.dispatch('asyncAdd', 1)
    }

    return {
      add,
      asyncAdd,
      // ...toRefs(store.state)
      count: computed(() => store.state.count),
      double: computed(() => store.getters.double),
      aCount: computed(() => store.state.aCount.count),
      bCount: computed(() => store.state.bCount.count),
    }
  }
}
</script>
