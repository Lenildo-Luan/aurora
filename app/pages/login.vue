<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const toast = useToast()

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    router.push('/journal')
  }
})

// Form state
const mode = ref<'login' | 'signup' | 'reset'>('login')
const loading = ref(false)
const state = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// Validation
const emailError = computed(() => {
  if (!state.email) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(state.email) ? '' : 'Email inválido'
})

const passwordError = computed(() => {
  if (!state.password) return ''
  if (mode.value === 'reset') return ''
  return state.password.length >= 6 ? '' : 'Senha deve ter no mínimo 6 caracteres'
})

const confirmPasswordError = computed(() => {
  if (mode.value !== 'signup') return ''
  if (!state.confirmPassword) return ''
  return state.password === state.confirmPassword ? '' : 'As senhas não coincidem'
})

const isFormValid = computed(() => {
  if (mode.value === 'reset') {
    return state.email && !emailError.value
  }
  
  const baseValid = state.email && !emailError.value && state.password && !passwordError.value
  
  if (mode.value === 'signup') {
    return baseValid && state.confirmPassword && !confirmPasswordError.value
  }
  
  return baseValid
})

// Handle login
const handleLogin = async () => {
  loading.value = true

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password
    })

    if (error) throw error

    toast.add({
      title: 'Login realizado!',
      description: 'Bem-vindo de volta.',
      color: 'success'
    })

    router.push('/journal')
  } catch (error: any) {
    toast.add({
      title: 'Erro ao fazer login',
      description: error.message || 'Email ou senha incorretos.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle signup
const handleSignup = async () => {
  loading.value = true

  try {
    const { error } = await supabase.auth.signUp({
      email: state.email,
      password: state.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    toast.add({
      title: 'Conta criada!',
      description: 'Verifique seu email para confirmar a conta.',
      color: 'success',
    })

    // Clear form
    state.email = ''
    state.password = ''
    state.confirmPassword = ''
    mode.value = 'login'
  } catch (error: any) {
    toast.add({
      title: 'Erro ao criar conta',
      description: error.message || 'Não foi possível criar a conta.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle password reset
const handleReset = async () => {
  loading.value = true

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(state.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error

    toast.add({
      title: 'Email enviado!',
      description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      color: 'success'
    })

    // Clear form and return to login
    state.email = ''
    mode.value = 'login'
  } catch (error: any) {
    toast.add({
      title: 'Erro ao enviar email',
      description: error.message || 'Não foi possível enviar o email de recuperação.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle form submit
const handleSubmit = async () => {
  if (!isFormValid.value) return

  switch (mode.value) {
    case 'login':
      await handleLogin()
      break
    case 'signup':
      await handleSignup()
      break
    case 'reset':
      await handleReset()
      break
  }
}

// Switch mode
const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
  mode.value = newMode
  state.password = ''
  state.confirmPassword = ''
}

// Social login
const handleSocialLogin = async (provider: 'google' | 'github') => {
  loading.value = true

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  } catch (error: any) {
    toast.add({
      title: 'Erro ao fazer login',
      description: error.message || 'Não foi possível fazer login.',
      color: 'error'
    })
    loading.value = false
  }
}

// Page title
const pageTitle = computed(() => {
  switch (mode.value) {
    case 'signup': return 'Criar Conta'
    case 'reset': return 'Recuperar Senha'
    default: return 'Entrar'
  }
})

const submitButtonText = computed(() => {
  switch (mode.value) {
    case 'signup': return 'Criar Conta'
    case 'reset': return 'Enviar Email'
    default: return 'Entrar'
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
          <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Diário de Correlações
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Registre eventos e descubra padrões
        </p>
      </div>

      <!-- Login Card -->
      <UCard class="max-w-md w-full">
        <template #header>
          <h2 class="text-2xl font-bold text-center">
            {{ pageTitle }}
          </h2>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Email -->
          <UFormGroup 
            label="Email" 
            name="email" 
            required
            :error="emailError"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="seu@email.com"
              icon="i-heroicons-envelope"
              size="lg"
              :disabled="loading"
            />
          </UFormGroup>

          <!-- Password (not shown in reset mode) -->
          <UFormGroup 
            v-if="mode !== 'reset'"
            label="Senha" 
            name="password" 
            required
            :error="passwordError"
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              :disabled="loading"
            />
          </UFormGroup>

          <!-- Confirm Password (only in signup mode) -->
          <UFormGroup 
            v-if="mode === 'signup'"
            label="Confirmar Senha" 
            name="confirmPassword" 
            required
            :error="confirmPasswordError"
          >
            <UInput
              v-model="state.confirmPassword"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              :disabled="loading"
            />
          </UFormGroup>

          <!-- Forgot Password Link -->
          <div v-if="mode === 'login'" class="text-right">
            <UButton
              @click="switchMode('reset')"
              variant="link"
              size="sm"
              :padded="false"
              class="text-primary-600 hover:text-primary-700"
            >
              Esqueceu a senha?
            </UButton>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="!isFormValid || loading"
          >
            {{ submitButtonText }}
          </UButton>

          <!-- Divider (only in login/signup modes) -->
          <div v-if="mode !== 'reset'" class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">
                Ou continue com
              </span>
            </div>
          </div>

          <!-- Social Login (only in login/signup modes) -->
          <div v-if="mode !== 'reset'" class="grid grid-cols-2 gap-3">
            <UButton
              @click="handleSocialLogin('google')"
              color="neutral"
              variant="outline"
              block
              :disabled="loading"
            >
              <template #leading>
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </template>
              Google
            </UButton>

            <UButton
              @click="handleSocialLogin('github')"
              color="neutral"
              variant="outline"
              block
              :disabled="loading"
            >
              <template #leading>
                <UIcon name="i-simple-icons-github" class="w-5 h-5" />
              </template>
              GitHub
            </UButton>
          </div>
        </form>

        <template #footer>
          <!-- Mode Switch -->
          <div class="text-center text-sm text-gray-600 dark:text-gray-400">
            <template v-if="mode === 'login'">
              Não tem uma conta?
              <UButton
                @click="switchMode('signup')"
                variant="link"
                :padded="false"
                class="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Criar conta
              </UButton>
            </template>
            
            <template v-else>
              Já tem uma conta?
              <UButton
                @click="switchMode('login')"
                variant="link"
                :padded="false"
                class="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Fazer login
              </UButton>
            </template>
          </div>
        </template>
      </UCard>

      <!-- Footer -->
      <div class="text-center mt-8 text-sm text-gray-500">
        <p>&copy; 2026 Diário de Correlações. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 480px;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode gradient */
.dark .login-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
</style>