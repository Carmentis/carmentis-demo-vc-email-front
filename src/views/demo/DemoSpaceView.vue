<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import * as v from 'valibot'
import { api, apiMultipart } from '@/api'
import { useDemoAuthStore } from '@/stores/demo-auth'

const router = useRouter()
const toast = useToast()
const store = useDemoAuthStore()

// VP state
const vp = ref('')
const vpSubmitting = ref(false)
const vpError = ref('')

// Email form state
const emailTo = ref('')
const emailSubject = ref('')
const emailMessage = ref('')
const emailAttachments = ref<File[]>([])
const emailSending = ref(false)
const emailErrors = ref<Record<string, string>>({})

const EmailSchema = v.pipe(v.string(), v.email('Please enter a valid email address'))

async function loadProfile() {
  try {
    const profile = await api<{ publicKey: string; hasVp: boolean; email: string | null }>(
      '/demo/profile',
      { sessionToken: store.sessionToken! },
    )
    if (profile.hasVp && profile.email) {
      store.setVp(profile.email)
    }
  } catch {
    // Profile load failed silently
  }
}

async function submitVp() {
  vpError.value = ''
  if (!vp.value.trim()) {
    vpError.value = 'Please paste your verifiable presentation'
    return
  }

  vpSubmitting.value = true
  try {
    const data = await api<{ valid: boolean; email: string }>('/demo/profile/vp', {
      method: 'POST',
      body: JSON.stringify({ vp: vp.value.trim() }),
      sessionToken: store.sessionToken!,
    })
    store.setVp(data.email)
    toast.add({ severity: 'success', summary: 'VP Verified', detail: `Email verified: ${data.email}`, life: 5000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: String(err), life: 5000 })
  } finally {
    vpSubmitting.value = false
  }
}

function validateEmail(): boolean {
  emailErrors.value = {}
  try {
    v.parse(EmailSchema, emailTo.value)
  } catch {
    emailErrors.value.to = 'Please enter a valid recipient email'
  }
  if (!emailSubject.value.trim()) {
    emailErrors.value.subject = 'Subject is required'
  }
  if (!emailMessage.value.trim()) {
    emailErrors.value.message = 'Message is required'
  }
  return Object.keys(emailErrors.value).length === 0
}

function onFileSelect(event: { files: File[] }) {
  emailAttachments.value = event.files
}

async function sendEmail() {
  if (!validateEmail()) return

  emailSending.value = true
  try {
    const formData = new FormData()
    formData.append('to', emailTo.value)
    formData.append('subject', emailSubject.value)
    formData.append('message', emailMessage.value)
    for (const file of emailAttachments.value) {
      formData.append('attachments', file)
    }

    await apiMultipart('/demo/email/send', formData, store.sessionToken!)
    toast.add({ severity: 'success', summary: 'Email Sent', detail: `Email sent to ${emailTo.value}`, life: 5000 })
    emailTo.value = ''
    emailSubject.value = ''
    emailMessage.value = ''
    emailAttachments.value = []
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: String(err), life: 5000 })
  } finally {
    emailSending.value = false
  }
}

function logout() {
  store.clear()
  router.push('/demo/auth')
}

onMounted(loadProfile)
</script>

<template>
  <div class="dashboard">
    <!-- Header bar -->
    <div class="dash-header">
      <div class="dash-header-left">
        <i class="pi pi-envelope" style="font-size: 1.25rem;" />
        <h1>My Space</h1>
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
      <!-- Profile / Identity card -->
      <Card class="dash-card profile-card">
        <template #title>
          <i class="pi pi-user" style="margin-right: 0.5rem;" />
          Identity
        </template>
        <template #content>
          <div class="profile-field">
            <span class="profile-label">Public Key</span>
            <code class="pk-display">{{ store.publicKey }}</code>
          </div>

          <Divider />

          <div v-if="store.canSendEmail" class="profile-field">
            <span class="profile-label">Verified Email</span>
            <div class="verified-email">
              <span>{{ store.email }}</span>
              <Tag value="Verified" severity="success" />
            </div>
          </div>

          <div v-else class="vp-section">
            <p class="vp-hint">
              Submit a verifiable presentation (SD-JWT) to prove your email and
              unlock the email feature.
            </p>
            <div class="field">
              <label for="vp-input">Verifiable Presentation</label>
              <Textarea
                id="vp-input"
                v-model="vp"
                rows="5"
                placeholder="Paste your SD-JWT presentation here..."
                :invalid="!!vpError"
                fluid
              />
              <Message v-if="vpError" severity="error" :closable="false" class="field-error">
                {{ vpError }}
              </Message>
            </div>
            <Button
              label="Verify Presentation"
              icon="pi pi-check-circle"
              :loading="vpSubmitting"
              @click="submitVp"
            />
          </div>
        </template>
      </Card>

      <!-- Compose email card -->
      <Card class="dash-card compose-card" :class="{ 'card-locked': !store.canSendEmail }">
        <template #title>
          <i class="pi pi-pencil" style="margin-right: 0.5rem;" />
          Compose Email
        </template>
        <template #content>
          <div v-if="!store.canSendEmail" class="locked-overlay">
            <i class="pi pi-lock" style="font-size: 2rem; margin-bottom: 0.75rem;" />
            <p>Submit a verifiable presentation to unlock email sending.</p>
          </div>

          <form v-else class="email-form" @submit.prevent="sendEmail">
            <div class="form-meta">
              Sending as <strong>{{ store.email }}</strong>
            </div>

            <div class="field">
              <label for="email-to">To</label>
              <InputText
                id="email-to"
                v-model="emailTo"
                type="email"
                placeholder="recipient@example.com"
                :invalid="!!emailErrors.to"
                fluid
              />
              <Message v-if="emailErrors.to" severity="error" :closable="false" class="field-error">
                {{ emailErrors.to }}
              </Message>
            </div>

            <div class="field">
              <label for="email-subject">Subject</label>
              <InputText
                id="email-subject"
                v-model="emailSubject"
                placeholder="Email subject"
                :invalid="!!emailErrors.subject"
                fluid
              />
              <Message v-if="emailErrors.subject" severity="error" :closable="false" class="field-error">
                {{ emailErrors.subject }}
              </Message>
            </div>

            <div class="field">
              <label for="email-message">Message</label>
              <Textarea
                id="email-message"
                v-model="emailMessage"
                rows="8"
                placeholder="Type your message..."
                :invalid="!!emailErrors.message"
                fluid
              />
              <Message v-if="emailErrors.message" severity="error" :closable="false" class="field-error">
                {{ emailErrors.message }}
              </Message>
            </div>

            <div class="field">
              <label>Attachments</label>
              <FileUpload
                mode="advanced"
                :multiple="true"
                :auto="false"
                :show-upload-button="false"
                choose-label="Choose Files"
                @select="onFileSelect"
              />
            </div>

            <Button
              type="submit"
              label="Send Email"
              icon="pi pi-send"
              :loading="emailSending"
              size="large"
            />
          </form>
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

/* Profile card */
.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.profile-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.pk-display {
  font-size: 0.75rem;
  word-break: break-all;
  padding: 0.5rem;
  border-radius: 6px;
  background: var(--p-surface-100);
  line-height: 1.5;
}

:root.dark .pk-display {
  background: var(--p-surface-800);
}

.verified-email {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
}

.vp-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vp-hint {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.8;
}

/* Compose card */
.card-locked {
  opacity: 0.6;
}

.locked-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.5;
}

.locked-overlay p {
  font-size: 0.9rem;
  line-height: 1.5;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-meta {
  font-size: 0.85rem;
  opacity: 0.7;
  padding-bottom: 0.25rem;
}

/* Shared */
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
</style>
