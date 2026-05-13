<script setup lang="ts">
import Menubar from 'primevue/menubar'
import ThemeToggle from './ThemeToggle.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const items = [
  {
    label: 'Home',
    icon: 'pi pi-home',
    command: () => router.push('/'),
  },
  {
    label: 'Issuer',
    icon: 'pi pi-id-card',
    command: () => router.push('/issuer'),
  },
  {
    label: 'Email Demo',
    icon: 'pi pi-envelope',
    command: () => router.push('/demo'),
  },
]
</script>

<template>
  <header>
    <Menubar :model="items">
      <template #start>
        <span class="app-logo" @click="router.push('/')" role="button" tabindex="0">
          <i class="pi pi-shield" style="font-size: 1.25rem; margin-right: 0.5rem" />
          <strong>Carmentis</strong>
        </span>
      </template>
      <template #end>
        <ThemeToggle />
      </template>
    </Menubar>
  </header>
</template>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 1.5rem;
  font-size: 1.1rem;
}
</style>
