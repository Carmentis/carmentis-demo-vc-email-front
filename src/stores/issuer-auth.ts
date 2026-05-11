import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface IssuedCredential {
  email: string
  credential: string
  issuedAt: number
}

export const useIssuerAuthStore = defineStore('issuer-auth', () => {
  const publicKey = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const credentials = ref<IssuedCredential[]>([])

  const isAuthenticated = computed(() => !!sessionToken.value)

  function setAuth(token: string, pk: string) {
    sessionToken.value = token
    publicKey.value = pk
  }

  function addCredential(email: string, credential: string) {
    credentials.value.push({ email, credential, issuedAt: Date.now() })
  }

  function clear() {
    publicKey.value = null
    sessionToken.value = null
    credentials.value = []
  }

  return { publicKey, sessionToken, credentials, isAuthenticated, setAuth, addCredential, clear }
})
