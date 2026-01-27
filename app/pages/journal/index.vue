<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { 
  entries, 
  loading, 
  error,
  totalEntries,
  hasMore,
  dateRange,
  fetchEntries,
  deleteEntry,
  loadMore,
  refresh
} = useJournal()

const router = useRouter()
const toast = useToast()

// Filters
const filters = reactive({
  startDate: '',
  endDate: '',
  occurrence: '',
  event: '',
  limit: 20
})

// UI State
const showFilters = ref(false)
const selectedEntry = ref<any>(null)
const deleteConfirmOpen = ref(false)
const entryToDelete = ref<string | null>(null)

// Load entries on mount
onMounted(async () => {
  if (entries.value.length === 0) {
    await fetchEntries({ limit: filters.limit })
  }
})

// Apply filters
const applyFilters = async () => {
  const params: any = { limit: filters.limit }
  
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  if (filters.occurrence) params.occurrence = filters.occurrence
  if (filters.event) params.event = filters.event
  
  await fetchEntries(params)
  showFilters.value = false
}

// Clear filters
const clearFilters = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.occurrence = ''
  filters.event = ''
  refresh({ limit: filters.limit })
}

// Navigate to new entry
const createNewEntry = () => {
  router.push('/journal/new')
}

// Navigate to edit entry
const editEntry = (entry: any) => {
  router.push(`/journal/edit/${entry.id}`)
}

// Confirm delete
const confirmDelete = (entryId: string) => {
  entryToDelete.value = entryId
  deleteConfirmOpen.value = true
}

// Delete entry
const handleDelete = async () => {
  if (!entryToDelete.value) return

  try {
    await deleteEntry(entryToDelete.value)
    
    toast.add({
      title: 'Entrada deletada',
      description: 'A entrada foi removida com sucesso.',
      color: 'green'
    })
    
    deleteConfirmOpen.value = false
    entryToDelete.value = null
  } catch (err: any) {
    toast.add({
      title: 'Erro ao deletar',
      description: err.message || 'Não foi possível deletar a entrada.',
      color: 'red'
    })
  }
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

// Check if filters are active
const hasActiveFilters = computed(() => 
  filters.startDate || filters.endDate || filters.occurrence || filters.event
)

// Group entries by month
const entriesByMonth = computed(() => {
  const grouped: Record<string, any[]> = {}
  
  entries.value.forEach(entry => {
    const date = new Date(entry.entryDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = new Intl.DateTimeFormat('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    }).format(date)
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    
    grouped[monthKey].push({ ...entry, monthLabel })
  })
  
  return grouped
})

// Get sorted month keys
const sortedMonthKeys = computed(() => 
  Object.keys(entriesByMonth.value).sort((a, b) => b.localeCompare(a))
)
</script>

<template>
  <div class="journal-page">
    <!-- Header -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Diário de Correlações
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ totalEntries }} {{ totalEntries === 1 ? 'entrada' : 'entradas' }} registradas
          </p>
        </div>
        
        <div class="flex gap-3">
          <UButton
            @click="showFilters = !showFilters"
            :color="hasActiveFilters ? 'primary' : 'gray'"
            variant="outline"
            icon="i-heroicons-funnel"
          >
            Filtros
            <UBadge v-if="hasActiveFilters" color="primary" size="xs" class="ml-2">
              ativo
            </UBadge>
          </UButton>
          
          <UButton
            @click="createNewEntry"
            icon="i-heroicons-plus"
            size="lg"
          >
            Nova Entrada
          </UButton>
        </div>
      </div>

      <!-- Filters Panel -->
      <UCard v-if="showFilters" class="mt-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UFormGroup label="Data inicial">
            <UInput v-model="filters.startDate" type="date" />
          </UFormGroup>
          
          <UFormGroup label="Data final">
            <UInput v-model="filters.endDate" type="date" />
          </UFormGroup>
          
          <UFormGroup label="Ocorrência">
            <UInput v-model="filters.occurrence" placeholder="Ex: squirrel" />
          </UFormGroup>
          
          <UFormGroup label="Evento">
            <UInput v-model="filters.event" placeholder="Ex: exercise" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              @click="clearFilters"
              color="gray"
              variant="ghost"
            >
              Limpar
            </UButton>
            <UButton
              @click="applyFilters"
              :loading="loading"
            >
              Aplicar Filtros
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-if="loading && entries.length === 0" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="red"
      variant="soft"
      title="Erro ao carregar entradas"
      :description="error"
      class="mb-6"
    />

    <!-- Empty State -->
    <UCard v-else-if="entries.length === 0 && !loading">
      <div class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhuma entrada encontrada
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ hasActiveFilters ? 'Tente ajustar os filtros ou' : 'Comece criando sua primeira entrada' }}
        </p>
        <UButton
          @click="hasActiveFilters ? clearFilters() : createNewEntry()"
          icon="i-heroicons-plus"
        >
          {{ hasActiveFilters ? 'Limpar Filtros' : 'Criar Primeira Entrada' }}
        </UButton>
      </div>
    </UCard>

    <!-- Entries List -->
    <div v-else class="entries-list space-y-8">
      <!-- Group by month -->
      <div 
        v-for="monthKey in sortedMonthKeys" 
        :key="monthKey"
        class="month-group"
      >
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 capitalize">
          {{ entriesByMonth[monthKey][0].monthLabel }}
        </h2>
        
        <div class="space-y-3">
          <UCard
            v-for="entry in entriesByMonth[monthKey]"
            :key="entry.id"
            class="entry-card hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Date -->
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-400" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ formatDate(entry.entryDate) }}
                  </h3>
                </div>

                <!-- Events -->
                <div v-if="entry.events.length > 0" class="mb-3">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Eventos:
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="event in entry.events"
                      :key="event"
                      color="primary"
                      variant="soft"
                    >
                      {{ event }}
                    </UBadge>
                  </div>
                </div>

                <!-- Occurrences -->
                <div v-if="entry.occurrences.length > 0">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Ocorrências:
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="occurrence in entry.occurrences"
                      :key="occurrence"
                      color="amber"
                      variant="soft"
                    >
                      {{ occurrence }}
                    </UBadge>
                  </div>
                </div>

                <!-- Empty state for entry -->
                <div 
                  v-if="entry.events.length === 0 && entry.occurrences.length === 0"
                  class="text-sm text-gray-500 italic"
                >
                  Nenhum evento ou ocorrência registrado
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 ml-4">
                <UButton
                  @click="editEntry(entry)"
                  icon="i-heroicons-pencil"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  title="Editar"
                />
                <UButton
                  @click="confirmDelete(entry.id)"
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="sm"
                  title="Deletar"
                />
              </div>
            </div>

            <template #footer>
              <div class="text-xs text-gray-500">
                Criado em {{ new Date(entry.createdAt).toLocaleString('pt-BR') }}
              </div>
            </template>
          </UCard>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="flex justify-center pt-6">
        <UButton
          @click="loadMore"
          :loading="loading"
          variant="outline"
          size="lg"
        >
          Carregar Mais
        </UButton>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="deleteConfirmOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Confirmar Exclusão</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-400">
          Tem certeza que deseja deletar esta entrada? Esta ação não pode ser desfeita.
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              @click="deleteConfirmOpen = false"
              color="gray"
              variant="ghost"
            >
              Cancelar
            </UButton>
            <UButton
              @click="handleDelete"
              color="red"
              :loading="loading"
            >
              Deletar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<style scoped>
.journal-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.entry-card {
  transition: all 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
}

.month-group {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>