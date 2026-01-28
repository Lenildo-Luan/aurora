<script setup lang="ts">
// pages/journal/edit/[id].vue
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()

// Verificar autenticação
watchEffect(() => {
  if (user.value === null) {
    navigateTo('/login')
  }
})

const { 
  getEntryById, 
  fetchEntries,
  entries,
  loading: journalLoading
} = useJournal()

// Get entry ID from route
const entryId = route.params.id as string

// State
const loading = ref(true)
const notFound = ref(false)

// Get entry data
const entry = computed(() => getEntryById(entryId))

// Load entry if not in state
onMounted(async () => {
  // If entry not in local state, fetch it
  if (!entry.value && entries.value.length === 0) {
    try {
      await fetchEntries({ limit: 100 })
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }
  
  // Check if entry exists after loading
  setTimeout(() => {
    loading.value = false
    if (!entry.value) {
      notFound.value = true
    }
  }, 500)
})

// Handle successful submission
const handleSubmit = (payload: any) => {
  // Entry updated successfully, redirect to journal list
  router.push('/journal')
}

// Handle cancel
const handleCancel = () => {
  router.back()
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Set page meta
useHead({
  title: 'Editar Entrada - Diário de Correlações'
})
</script>

<template>
  <div class="edit-entry-page">
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
            <UIcon name="i-heroicons-pencil-square" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Editar Entrada
            </h1>
            <p v-if="entry" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ formatDate(entry.entryDate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading || journalLoading" class="loading-state">
        <UCard>
          <div class="text-center py-12">
            <UIcon 
              name="i-heroicons-arrow-path" 
              class="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4"
            />
            <p class="text-gray-600 dark:text-gray-400">
              Carregando entrada...
            </p>
          </div>
        </UCard>
      </div>

      <!-- Not Found State -->
      <div v-else-if="notFound" class="not-found-state">
        <UCard>
          <div class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <UIcon 
                name="i-heroicons-exclamation-triangle" 
                class="w-8 h-8 text-red-600 dark:text-red-400"
              />
            </div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Entrada não encontrada
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              A entrada que você está tentando editar não existe ou foi removida.
            </p>
            <div class="flex gap-3 justify-center">
              <UButton
                @click="router.push('/journal')"
                variant="outline"
              >
                Voltar para Diário
              </UButton>
              <UButton
                @click="router.push('/journal/new')"
                icon="i-heroicons-plus"
              >
                Criar Nova Entrada
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Entry Form -->
      <div v-else-if="entry">
        <EntryForm
          mode="edit"
          :initial-date="entry.entryDate"
          :initial-events="entry.events"
          :initial-occurrences="entry.occurrences"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />

        <!-- Entry Info Card -->
        <UCard class="mt-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500" />
              <h3 class="font-semibold">Informações da Entrada</h3>
            </div>
          </template>
          
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">ID:</span>
              <p class="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">
                {{ entry.id }}
              </p>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Data da entrada:</span>
              <p class="text-gray-700 dark:text-gray-300 mt-1">
                {{ formatDate(entry.entryDate) }}
              </p>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Criado em:</span>
              <p class="text-gray-700 dark:text-gray-300 mt-1">
                {{ new Date(entry.createdAt).toLocaleString('pt-BR') }}
              </p>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Última atualização:</span>
              <p class="text-gray-700 dark:text-gray-300 mt-1">
                {{ new Date(entry.updatedAt).toLocaleString('pt-BR') }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Warning Card -->
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="info"
          variant="soft"
          title="Atenção"
          class="mt-4"
        >
          <template #description>
            Ao salvar as alterações, a entrada anterior será substituída. Esta ação não pode ser desfeita.
          </template>
        </UAlert>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-entry-page {
  min-height: 100vh;
  background: rgb(249 250 251);
  padding: 2rem 1rem;
}

.dark .edit-entry-page {
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

.header {
  animation: fadeIn 0.3s ease-in;
}

.loading-state,
.not-found-state {
  animation: fadeIn 0.4s ease-in;
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