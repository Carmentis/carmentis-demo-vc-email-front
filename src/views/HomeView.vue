<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>Carmentis Email Demo</h1>
      <p class="subtitle">
        A demonstration of verifiable credentials and email communication, secured by the Carmentis
        Desk wallet.
      </p>
    </section>

    <div class="cards">
      <Card class="app-card">
        <template #title>
          <i class="pi pi-id-card" style="margin-right: 0.5rem" />
          Credential Issuer
        </template>
        <template #content>
          <p>
            Authenticate with your Carmentis Desk wallet, verify your email address, and receive an
            SD-JWT verifiable credential.
          </p>
        </template>
        <template #footer>
          <Button
            label="Open Issuer"
            icon="pi pi-arrow-right"
            icon-pos="right"
            @click="router.push('/issuer')"
          />
        </template>
      </Card>

      <Card class="app-card">
        <template #title>
          <i class="pi pi-envelope" style="margin-right: 0.5rem" />
          Email Demo
        </template>
        <template #content>
          <p>
            Sign in with your wallet, submit a verifiable presentation to prove your email, and send
            emails to anyone.
          </p>
        </template>
        <template #footer>
          <Button
            label="Open Email Demo"
            icon="pi pi-arrow-right"
            icon-pos="right"
            @click="router.push('/demo')"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.hero {
  text-align: center;
  padding: 2rem 0;
}

.hero h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.subtitle {
  font-size: 1.125rem;
  max-width: 560px;
  margin: 0 auto;
  opacity: 0.8;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.app-card {
  height: 100%;
}

.app-card p {
  line-height: 1.6;
}
</style>
