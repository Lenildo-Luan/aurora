<script setup lang="ts">
// pages/auth/reset-password.vue
const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const state = reactive({
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation
const passwordError = computed(() => {
  if (!state.password) return ''
  return state.password.length >= 6 ? '' : 'Senha deve ter no mínimo 6 caracteres'
})

const confirmPasswordError = computed(() => {
  if (!state.confirmPassword) return ''
  return state.password === state.confirmPassword ? '' : 'As senhas não coincidem'
})

const isFormValid = computed(() => {
  return state.password && 
         state.confirmPassword && 
         !passwordError.value && 
         !confirmPasswordError.value
})

// Password strength indicator
const passwordStrength = computed(() => {
  const password = state.password
  if (!password) return { level: 0, label: '', color: '' }
  
  let strength = 0
  
  // Length
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // Contains lowercase and uppercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  
  // Contains numbers
  if (/\d/.test(password)) strength++
  
  // Contains special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  if (strength <= 2) return { level: 1, label: 'Fraca', color: 'red' }
  if (strength <= 3) return { level: 2, label: 'Média', color: 'amber' }
  return { level: 3, label: 'Forte', color: 'green' }
})

// Handle password reset
const handleReset = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: state.password
    })
    
    if (error) throw error
    
    toast.add({
      title: 'Senha alterada com sucesso!',
      description: 'Você já pode fazer login com sua nova senha.',
      color: 'success'
    })
    
    // Clear form
    state.password = ''
    state.confirmPassword = ''
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    
  } catch (error: any) {
    toast.add({
      title: 'Erro ao alterar senha',
      description: error.message || 'Não foi possível alterar a senha. Tente novamente.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const cancelReset = () => {
  router.push('/login')
}
</script>

<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
          <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Redefinir Senha
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Escolha uma nova senha forte para sua conta
        </p>
      </div>

      <!-- Reset Password Card -->
      <UCard class="max-w-md w-full">
        <form @submit.prevent="handleReset" class="space-y-5">
          <!-- New Password -->
          <UFormGroup 
            label="Nova Senha" 
            name="password" 
            required
            :error="passwordError"
          >
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              :disabled="loading"
            >
              <template #trailing>
                <UButton
                  @click="showPassword = !showPassword"
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  :padded="false"
                  tabindex="-1"
                />
              </template>
            </UInput>
          </UFormGroup>

          <!-- Password Strength Indicator -->
          <div v-if="state.password" class="password-strength">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Força da senha:
              </span>
              <span 
                :class="`text-xs font-semibold text-${passwordStrength.color}-600`"
              >
                {{ passwordStrength.label }}
              </span>
            </div>
            <div class="strength-bars">
              <div 
                v-for="i in 3" 
                :key="i"
                :class="[
                  'strength-bar',
                  i <= passwordStrength.level ? `bg-${passwordStrength.color}-500` : 'bg-gray-200 dark:bg-gray-700'
                ]"
              />
            </div>
          </div>

          <!-- Confirm Password -->
          <UFormGroup 
            label="Confirmar Nova Senha" 
            name="confirmPassword" 
            required
            :error="confirmPasswordError"
          >
            <UInput
              v-model="state.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              size="lg"
              :disabled="loading"
            >
              <template #trailing>
                <UButton
                  @click="showConfirmPassword = !showConfirmPassword"
                  :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="link"
                  :padded="false"
                  tabindex="-1"
                />
              </template>
            </UInput>
          </UFormGroup>

          <!-- Password Requirements -->
          <UAlert
            icon="i-heroicons-information-circle"
            color="primary"
            variant="soft"
            title="Requisitos da senha"
          >
            <template #description>
              <ul class="text-xs space-y-1 mt-2">
                <li :class="state.password.length >= 6 ? 'text-green-600' : ''">
                  <UIcon 
                    :name="state.password.length >= 6 ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
                    class="w-3 h-3 inline mr-1"
                  />
                  Mínimo de 6 caracteres
                </li>
                <li :class="/[A-Z]/.test(state.password) && /[a-z]/.test(state.password) ? 'text-green-600' : ''">
                  <UIcon 
                    :name="/[A-Z]/.test(state.password) && /[a-z]/.test(state.password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
                    class="w-3 h-3 inline mr-1"
                  />
                  Letras maiúsculas e minúsculas (recomendado)
                </li>
                <li :class="/\d/.test(state.password) ? 'text-green-600' : ''">
                  <UIcon 
                    :name="/\d/.test(state.password) ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
                    class="w-3 h-3 inline mr-1"
                  />
                  Pelo menos um número (recomendado)
                </li>
              </ul>
            </template>
          </UAlert>

          <!-- Buttons -->
          <div class="flex gap-3">
            <UButton
              @click="cancelReset"
              variant="outline"
              size="lg"
              block
              :disabled="loading"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              :disabled="!isFormValid || loading"
            >
              Alterar Senha
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Footer -->
      <div class="text-center mt-8 text-sm text-gray-500">
        <p>Lembrou sua senha?</p>
        <UButton
          @click="router.push('/login')"
          variant="link"
          :padded="false"
          class="text-primary-600 hover:text-primary-700 font-semibold mt-1"
        >
          Voltar para login
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.dark .reset-password-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.reset-password-container {
  width: 100%;
  max-width: 520px;
  animation: fadeIn 0.5s ease-in;
}

.password-strength {
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
}

.strength-bar {
  height: 4px;
  border-radius: 2px;
  transition: background-color 0.3s ease;
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
</style>