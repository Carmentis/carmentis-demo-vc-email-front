<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <div class="app-layout">
    <AppNavbar />
    <Toast position="top-right" />
    <main class="container main-content">
      <slot />
    </main>
    <footer class="app-footer">
      <div class="container">
        <p>Carmentis Email Demo &mdash; Verifiable Credentials Showcase</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.app-footer {
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.6;
}
</style>
