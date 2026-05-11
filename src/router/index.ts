import { createRouter, createWebHistory } from 'vue-router'
import { useIssuerAuthStore } from '@/stores/issuer-auth'
import { useDemoAuthStore } from '@/stores/demo-auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/issuer',
      component: () => import('@/views/issuer/IssuerLayout.vue'),
      children: [
        { path: '', redirect: '/issuer/auth' },
        {
          path: 'auth',
          component: () => import('@/views/issuer/IssuerAuthView.vue'),
        },
        {
          path: 'space',
          component: () => import('@/views/issuer/IssuerSpaceView.vue'),
          meta: { requiresIssuerAuth: true },
        },
      ],
    },
    {
      path: '/demo',
      component: () => import('@/views/demo/DemoLayout.vue'),
      children: [
        { path: '', redirect: '/demo/auth' },
        {
          path: 'auth',
          component: () => import('@/views/demo/DemoAuthView.vue'),
        },
        {
          path: 'space',
          component: () => import('@/views/demo/DemoSpaceView.vue'),
          meta: { requiresDemoAuth: true },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresIssuerAuth) {
    const issuer = useIssuerAuthStore()
    if (!issuer.isAuthenticated) return '/issuer/auth'
  }
  if (to.meta.requiresDemoAuth) {
    const demo = useDemoAuthStore()
    if (!demo.isAuthenticated) return '/demo/auth'
  }
})

export default router
