<script setup lang="ts">
// pages/journal/new.vue
const user = useSupabaseUser()
const router = useRouter()

// Verificar autenticação
watchEffect(() => {
  if (user.value === null) {
    navigateTo('/login')
  }
})

// Handle successful submission
const handleSubmit = (payload: any) => {
  // Entry created successfully, redirect to journal list
  router.push('/journal')
}

// Handle cancel
const handleCancel = () => {
  router.back()
}

// Set page meta
useHead({
  title: 'Nova Entrada - Diário de Correlações'
})
</script>

<template>
  <div class="new-entry-page">
    <div class="container">
      <!-- Header -->
      <div class="header mb-6">
        <UButton
          @click="handleCancel"
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          class="mb-4"
        >
          Voltar
        </UButton>
        
        <div class="flex items-center gap-3">
          <div class="icon-wrapper">
            <UIcon name="i-heroicons-document-plus" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Nova Entrada
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Registre os eventos e ocorrências do dia
            </p>
          </div>
        </div>
      </div>

      <!-- Entry Form -->
      <EntryForm
        mode="create"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

      <!-- Help Card -->
      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-amber-500" />
            <h3 class="font-semibold">Dicas</h3>
          </div>
        </template>
        
        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Eventos:</strong> Atividades, alimentos, exercícios ou qualquer coisa que você fez no dia.
            </div>
          </div>
          
          <div class="flex gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Ocorrências:</strong> Sintomas, sentimentos ou situações que você quer rastrear e correlacionar com eventos.
            </div>
          </div>
          
          <div class="flex gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Autocomplete:</strong> Ao digitar, sugestões baseadas no seu histórico aparecerão automaticamente.
            </div>
          </div>
          
          <div class="flex gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Atalhos:</strong> Pressione <kbd class="kbd">Enter</kbd> para adicionar um item ou <kbd class="kbd">Backspace</kbd> para remover o último.
            </div>
          </div>
        </div>
      </UCard>

      <!-- Examples Card -->
      <UCard class="mt-4">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-purple-500" />
            <h3 class="font-semibold">Exemplos</h3>
          </div>
        </template>
        
        <div class="grid md:grid-cols-2 gap-4 text-sm">
          <!-- Example 1 -->
          <div class="example-card">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              Rastreamento de Saúde
            </h4>
            <div class="space-y-2">
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Eventos:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge color="primary" variant="soft" size="xs">café</UBadge>
                  <UBadge color="primary" variant="soft" size="xs">pizza</UBadge>
                  <UBadge color="primary" variant="soft" size="xs">exercício</UBadge>
                </div>
              </div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Ocorrências:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge color="info" variant="soft" size="xs">dor de cabeça</UBadge>
                  <UBadge color="info" variant="soft" size="xs">energia alta</UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Example 2 -->
          <div class="example-card">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              Humor e Atividades
            </h4>
            <div class="space-y-2">
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Eventos:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge color="primary" variant="soft" size="xs">reunião</UBadge>
                  <UBadge color="primary" variant="soft" size="xs">meditação</UBadge>
                  <UBadge color="primary" variant="soft" size="xs">sono 8h</UBadge>
                </div>
              </div>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Ocorrências:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <UBadge color="info" variant="soft" size="xs">ansiedade</UBadge>
                  <UBadge color="info" variant="soft" size="xs">foco alto</UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.new-entry-page {
  min-height: 100vh;
  background: rgb(249 250 251);
  padding: 2rem 1rem;
}

.dark .new-entry-page {
  background: rgb(17 24 39);
}

.container {
  max-width: 1024px;
  margin: 0 auto;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
}

.dark .icon-wrapper {
  background: rgba(99, 102, 241, 0.2);
}

.example-card {
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
}

.dark .example-card {
  background: rgb(31 41 55);
  border-color: rgb(55 65 81);
}

.kbd {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  color: rgb(55 65 81);
  background-color: rgb(243 244 246);
  border: 1px solid rgb(209 213 219);
  border-radius: 0.25rem;
  font-family: monospace;
}

.dark .kbd {
  color: rgb(209 213 219);
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.header {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>