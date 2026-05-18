import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useDemoAuthStore = defineStore('demo-auth', () => {
  const publicKey = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const vpSubmitted = ref(false)
  const email = ref<string | null>(null)

  const isAuthenticated = computed(() => !!sessionToken.value)
  const canSendEmail = computed(() => vpSubmitted.value && !!email.value)

  function setAuth(token: string, pk: string) {
    sessionToken.value = token
    publicKey.value = pk
  }

  function setVp(e: string) {
    vpSubmitted.value = true
    email.value = e
  }

  function clearVp() {
    vpSubmitted.value = false
    email.value = null
  }

  function clear() {
    publicKey.value = null
    sessionToken.value = null
    vpSubmitted.value = false
    email.value = null
  }

  return { publicKey, sessionToken, vpSubmitted, email, isAuthenticated, canSendEmail, setAuth, setVp, clearVp, clear }
})
