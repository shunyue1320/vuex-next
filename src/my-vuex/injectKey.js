import { inject } from 'vue'

// 容器默认名
export const storeKey = 'store'
export function useStore(injectKey = storeKey) {
  return inject(injectKey)
}