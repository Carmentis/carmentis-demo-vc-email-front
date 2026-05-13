<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { CarmentisJsonRpcPopup } from '@cmts-dev/carmentis-desk-connect-vuejs'
import { api } from '@/api'
import { useIssuerAuthStore } from '@/stores/issuer-auth'

const router = useRouter()
const toast = useToast()
const store = useIssuerAuthStore()

const loading = ref(true)
const popupVisible = ref(false)
const challenge = ref('')
const challengeId = ref('')
const relayUrl = ref('https://relay.testnet.carmentis.io')
const authenticating = ref(false)

async function fetchConfig() {
  try {
    const config = await api<{ relayUrl: string }>('/issuer/config')
    relayUrl.value = config.relayUrl
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load config', life: 5000 })
  }
}

async function fetchChallenge() {
  try {
    const data = await api<{ challenge: string; challengeId: string }>('/issuer/challenge')
    challenge.value = data.challenge
    challengeId.value = data.challengeId
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to get challenge',
      life: 5000,
    })
  }
}

async function onAuthResponse(response: { result: unknown }) {
  console.log('onAuthResponse', response.result)
  const result = response.result as { pk: string; signature: string }
  const pk = result.pk
  const signature = result.signature
  console.log('pk=', pk)
  console.log('signature=', signature)
  authenticating.value = true
  try {
    const data = await api<{ sessionToken: string }>('/issuer/auth', {
      method: 'POST',
      body: JSON.stringify({
        challengeId: challengeId.value,
        pk: result.pk,
        signature: result.signature,
      }),
    })
    store.setAuth(data.sessionToken, result.pk)
    toast.add({
      severity: 'success',
      summary: 'Welcome',
      detail: 'Signed in successfully',
      life: 3000,
    })
    router.push('/issuer/space')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: String(err), life: 5000 })
  } finally {
    authenticating.value = false
  }
}

function onAuthError(error: Error) {
  toast.add({ severity: 'error', summary: 'Auth Error', detail: error.message, life: 5000 })
}

async function openPopup() {
  await fetchChallenge()
  popupVisible.value = true
}

const authRequestJsonRpc = computed(() => ({
  jsonrpc: '2.0',
  id: 1,
  method: '/v1/auth/pk',
  params: {
    origin: 'Demo email',
    b64Challenge: challenge.value,
    pkFormat: 'did',
    sigFormat: 'jws',
  },
}))
onMounted(async () => {
  if (store.isAuthenticated) {
    router.replace('/issuer/space')
    return
  }
  await fetchConfig()
  loading.value = false
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <i class="pi pi-id-card login-icon" />
        <h1>Credential Issuer</h1>
        <p class="login-subtitle">
          Sign in with your Carmentis Desk wallet to verify your email addresses and obtain
          verifiable credentials.
        </p>
      </div>

      <div v-if="loading" class="center">
        <ProgressSpinner />
      </div>
      <div v-else class="login-actions">
        <Button
          label="Sign in with Carmentis Desk"
          icon="pi pi-wallet"
          :loading="authenticating"
          size="large"
          class="login-btn"
          @click="openPopup"
        />
        <p class="login-hint">You will be asked to approve the connection in your wallet.</p>
      </div>
    </div>

    <!--CarmentisAuthPopup
      v-if="popupVisible"
      :visible="popupVisible"
      :relay-url="relayUrl"
      :challenge="challenge"
      @response="onAuthResponse"
      @error="onAuthError"
      @close="popupVisible = false"
    /-->
    <CarmentisJsonRpcPopup
      v-if="popupVisible"
      :visible="popupVisible"
      :relay-url="relayUrl"
      :request="authRequestJsonRpc as any"
      title="Authenticate"
      @disconnected="popupVisible = false"
      @close-requested="popupVisible = false"
      @response="onAuthResponse"
      @error="onAuthError"
    />
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid var(--p-surface-200);
  background: var(--p-surface-0);
}

:root.dark .login-card {
  border-color: var(--p-surface-700);
  background: var(--p-surface-900);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  font-size: 0.9rem;
  opacity: 0.7;
  line-height: 1.5;
}

.center {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.login-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-btn {
  width: 100%;
}

.login-hint {
  font-size: 0.8rem;
  opacity: 0.5;
  text-align: center;
}
</style>
