<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import * as v from 'valibot'
import { api } from '@/api'
import { useIssuerAuthStore, type IssuedCredential } from '@/stores/issuer-auth'

const router = useRouter()
const toast = useToast()
const store = useIssuerAuthStore()

// Verify flow state
const email = ref('')
const emailError = ref('')
const code = ref('')
const codeError = ref('')
const codeSent = ref(false)
const pendingEmail = ref('')
const sendingCode = ref(false)
const verifying = ref(false)

const EmailSchema = v.pipe(v.string(), v.email('Please enter a valid email address'))
const CodeSchema = v.pipe(v.string(), v.length(6, 'Code must be 6 digits'))

async function sendCode() {
  emailError.value = ''
  try {
    v.parse(EmailSchema, email.value)
  } catch (err) {
    emailError.value = (err as v.ValiError<typeof EmailSchema>).issues[0]?.message ?? 'Invalid email'
    return
  }

  sendingCode.value = true
  try {
    await api('/issuer/email/send-code', {
      method: 'POST',
      body: JSON.stringify({ email: email.value }),
      sessionToken: store.sessionToken!,
    })
    pendingEmail.value = email.value
    codeSent.value = true
    toast.add({ severity: 'success', summary: 'Code Sent', detail: `Verification code sent to ${email.value}`, life: 5000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: String(err), life: 5000 })
  } finally {
    sendingCode.value = false
  }
}

async function verifyCode() {
  codeError.value = ''
  try {
    v.parse(CodeSchema, code.value)
  } catch (err) {
    codeError.value = (err as v.ValiError<typeof CodeSchema>).issues[0]?.message ?? 'Invalid code'
    return
  }

  verifying.value = true
  try {
    const data = await api<{ credential: string }>('/issuer/email/verify-code', {
      method: 'POST',
      body: JSON.stringify({ code: code.value }),
      sessionToken: store.sessionToken!,
    })
    store.addCredential(pendingEmail.value, data.credential)
    toast.add({ severity: 'success', summary: 'Credential Issued', detail: `Credential for ${pendingEmail.value} is ready`, life: 5000 })
    resetForm()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: String(err), life: 5000 })
  } finally {
    verifying.value = false
  }
}

function resetForm() {
  email.value = ''
  code.value = ''
  emailError.value = ''
  codeError.value = ''
  codeSent.value = false
  pendingEmail.value = ''
}

async function copyCredential(cred: IssuedCredential) {
  try {
    await navigator.clipboard.writeText(cred.credential)
    toast.add({ severity: 'success', summary: 'Copied', detail: `Credential for ${cred.email} copied`, life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy', life: 3000 })
  }
}

function downloadCredential(cred: IssuedCredential) {
  const blob = new Blob([cred.credential], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `credential-${cred.email.replace('@', '_at_')}.sdjwt`
  a.click()
  URL.revokeObjectURL(url)
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function logout() {
  store.clear()
  router.push('/issuer/auth')
}
</script>

<template>
  <div class="dashboard">
    <!-- Header bar -->
    <div class="dash-header">
      <div class="dash-header-left">
        <i class="pi pi-id-card" style="font-size: 1.25rem;" />
        <h1>Credential Issuer</h1>
      </div>
      <div class="dash-header-right">
        <Tag severity="info" class="pk-tag">
          <i class="pi pi-key" style="margin-right: 0.35rem;" />
          {{ store.publicKey?.slice(0, 8) }}...{{ store.publicKey?.slice(-6) }}
        </Tag>
        <Button
          icon="pi pi-sign-out"
          severity="secondary"
          text
          rounded
          aria-label="Sign out"
          @click="logout"
        />
      </div>
    </div>

    <div class="dash-grid">
      <!-- Issue new credential card -->
      <Card class="dash-card">
        <template #title>
          <i class="pi pi-plus-circle" style="margin-right: 0.5rem;" />
          Issue New Credential
        </template>
        <template #content>
          <!-- Step 1: enter email -->
          <div v-if="!codeSent" class="form-section">
            <p class="form-hint">
              Enter an email address to verify. You will receive a 6-digit code.
            </p>
            <div class="field">
              <label for="email">Email Address</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                :invalid="!!emailError"
                fluid
                @keyup.enter="sendCode"
              />
              <Message v-if="emailError" severity="error" :closable="false" class="field-error">
                {{ emailError }}
              </Message>
            </div>
            <Button
              label="Send Verification Code"
              icon="pi pi-send"
              :loading="sendingCode"
              @click="sendCode"
            />
          </div>

          <!-- Step 2: enter code -->
          <div v-else class="form-section">
            <p class="form-hint">
              A 6-digit code was sent to <strong>{{ pendingEmail }}</strong>.
            </p>
            <div class="field">
              <label for="code">Verification Code</label>
              <InputText
                id="code"
                v-model="code"
                placeholder="000000"
                maxlength="6"
                :invalid="!!codeError"
                fluid
                @keyup.enter="verifyCode"
              />
              <Message v-if="codeError" severity="error" :closable="false" class="field-error">
                {{ codeError }}
              </Message>
            </div>
            <div class="button-row">
              <Button
                label="Verify & Issue Credential"
                icon="pi pi-check"
                :loading="verifying"
                @click="verifyCode"
              />
              <Button
                label="Cancel"
                severity="secondary"
                text
                @click="resetForm"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Issued credentials card -->
      <Card class="dash-card">
        <template #title>
          <i class="pi pi-list" style="margin-right: 0.5rem;" />
          My Credentials
          <Tag v-if="store.credentials.length" :value="String(store.credentials.length)" severity="info" class="count-tag" />
        </template>
        <template #content>
          <div v-if="store.credentials.length === 0" class="empty-state">
            <i class="pi pi-inbox" style="font-size: 2rem; margin-bottom: 0.75rem;" />
            <p>No credentials issued yet.</p>
            <p class="empty-hint">Verify an email address to get your first credential.</p>
          </div>

          <div v-else class="credentials-list">
            <div
              v-for="(cred, index) in [...store.credentials].reverse()"
              :key="index"
              class="credential-item"
            >
              <div class="credential-header">
                <div class="credential-info">
                  <strong>{{ cred.email }}</strong>
                  <span class="credential-time">{{ formatTime(cred.issuedAt) }}</span>
                </div>
                <div class="credential-actions">
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    aria-label="Copy credential"
                    @click="copyCredential(cred)"
                  />
                  <Button
                    icon="pi pi-download"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    aria-label="Download credential"
                    @click="downloadCredential(cred)"
                  />
                </div>
              </div>
              <code class="credential-preview">{{ cred.credential.slice(0, 80) }}...</code>
              <Divider v-if="index < store.credentials.length - 1" />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header bar */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.dash-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dash-header-left h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.dash-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pk-tag {
  font-family: monospace;
  font-size: 0.8rem;
}

/* Grid layout */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 860px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}

.dash-card {
  height: 100%;
}

/* Form */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-hint {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.8;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-weight: 600;
  font-size: 0.85rem;
}

.field-error {
  margin: 0;
}

.button-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Credentials list */
.count-tag {
  margin-left: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.credentials-list {
  display: flex;
  flex-direction: column;
}

.credential-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.credential-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.credential-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.credential-time {
  font-size: 0.75rem;
  opacity: 0.5;
}

.credential-actions {
  display: flex;
  gap: 0.25rem;
}

.credential-preview {
  font-size: 0.7rem;
  word-break: break-all;
  padding: 0.5rem;
  border-radius: 6px;
  background: var(--p-surface-100);
  line-height: 1.4;
  opacity: 0.7;
}

:root.dark .credential-preview {
  background: var(--p-surface-800);
}
</style>
