<script setup lang="ts">
// pages/auth/callback.vue
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  try {
    // Verificar se há código de erro na URL
    const error = route.query.error
    const errorDescription = route.query.error_description

    if (error) {
      throw new Error(errorDescription as string || 'Erro na autenticação')
    }

    // Aguardar o usuário ser carregado
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar se o usuário está autenticado
    if (!user.value) {
      throw new Error('Não foi possível autenticar o usuário')
    }

    status.value = 'success'
    
    toast.add({
      title: 'Login realizado!',
      description: 'Redirecionando...',
      color: 'success'
    })

    // Redirecionar após 1 segundo
    setTimeout(() => {
      router.push('/journal')
    }, 1000)

  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.message || 'Erro desconhecido na autenticação'
    
    toast.add({
      title: 'Erro na autenticação',
      description: errorMessage.value,
      color: 'error'
    })

    // Redirecionar para login após 3 segundos
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})

const redirectToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="callback-page">
    <div class="callback-container">
      <!-- Loading State -->
      <div v-if="status === 'loading'" class="status-card">
        <div class="icon-wrapper loading">
          <UIcon 
            name="i-heroicons-arrow-path" 
            class="w-16 h-16 animate-spin text-primary-500"
          />
        </div>
        <h2 class="title">Autenticando...</h2>
        <p class="description">Aguarde enquanto verificamos suas credenciais</p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="status-card">
        <div class="icon-wrapper success">
          <UIcon 
            name="i-heroicons-check-circle" 
            class="w-16 h-16 text-green-500"
          />
        </div>
        <h2 class="title">Login realizado!</h2>
        <p class="description">Redirecionando para o diário...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="status === 'error'" class="status-card">
        <div class="icon-wrapper error">
          <UIcon 
            name="i-heroicons-x-circle" 
            class="w-16 h-16 text-red-500"
          />
        </div>
        <h2 class="title">Erro na autenticação</h2>
        <p class="description error-text">{{ errorMessage }}</p>
        <UButton
          @click="redirectToLogin"
          class="mt-6"
          size="lg"
        >
          Voltar para Login
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.dark .callback-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.callback-container {
  width: 100%;
  max-width: 480px;
}

.status-card {
  background: white;
  background: rgb(17 24 39);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.5s ease-out;
}

.dark .status-card {
  background: rgb(17 24 39);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.icon-wrapper.loading {
  background: rgba(99, 102, 241, 0.1);
}

.icon-wrapper.success {
  background: rgba(34, 197, 94, 0.1);
}

.icon-wrapper.error {
  background: rgba(239, 68, 68, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin-bottom: 0.5rem;
}

.dark .title {
  color: white;
}

.description {
  color: rgb(107 114 128);
  font-size: 0.875rem;
}

.dark .description {
  color: rgb(156 163 175);
}

.error-text {
  color: rgb(239 68 68);
}

.dark .error-text {
  color: rgb(248 113 113);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>