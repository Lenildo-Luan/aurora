<script setup lang="ts">
// pages/index.vue
const user = useSupabaseUser()
const router = useRouter()

// Redirect based on authentication status
onMounted(() => {
  if (user.value) {
    // User is logged in, redirect to journal
    router.push('/journal')
  } else {
    // User is not logged in, redirect to login
    router.push('/login')
  }
})

// Also watch for changes in auth state
watch(user, (newUser) => {
  if (newUser) {
    router.push('/journal')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="index-page">
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <!-- Logo/Icon -->
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 mb-6 animate-pulse">
          <UIcon name="i-heroicons-chart-bar" class="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        
        <!-- Loading Message -->
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Diário de Correlações
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Carregando...
        </p>
        
        <!-- Spinner -->
        <UIcon 
          name="i-heroicons-arrow-path" 
          class="w-8 h-8 animate-spin text-primary-500 mx-auto"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.index-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dark .index-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
</style>