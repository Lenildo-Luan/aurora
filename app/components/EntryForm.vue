<script setup lang="ts">
import { useEvents } from '~/composables/useEvents'
import { useJournal } from '~/composables/useJournal'
import { useOccurrences } from '~/composables/useOccurrences'

interface Props {
  initialDate?: string
  initialEvents?: string[]
  initialOccurrences?: string[]
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  initialDate: new Date().toISOString().split('T')[0],
  initialEvents: () => [],
  initialOccurrences: () => [],
  mode: 'create'
})

const emit = defineEmits<{
  submit: [payload: { entryDate: string; events: string[]; occurrences: string[] }]
  cancel: []
}>()

const { createEntry } = useJournal()
const {
  fetchEvents 
} = useEvents()
const { 
  fetchOccurrences 
} = useOccurrences()

// Form state
const state = reactive({
  entryDate: props.initialDate ?? new Date().toISOString().split('T')[0],
  selectedEvents: [...props.initialEvents],
  selectedOccurrences: [...props.initialOccurrences],
  newEvent: '',
  newOccurrence: ''
})

const loading = ref(false)
const toast = useToast()

// Load libraries on mount
onMounted(async () => {
  await Promise.all([
    fetchEvents({ sortBy: 'frequent', limit: 100 }),
    fetchOccurrences({ limit: 100 })
  ])
})

// Handle form submit
const onSubmit = async () => {
  loading.value = true

  try {
    const payload = {
      entryDate: state.entryDate,
      events: state.selectedEvents,
      occurrences: state.selectedOccurrences
    }

    await createEntry(payload)

    toast.add({
      title: props.mode === 'create' ? 'Entrada criada!' : 'Entrada atualizada!',
      description: `Registro do dia ${state.entryDate} salvo com sucesso.`,
      color: 'success'
    })

    emit('submit', payload)

    // Reset form if creating
    if (props.mode === 'create') {
      state.selectedEvents = []
      state.selectedOccurrences = []
      state.entryDate = new Date().toISOString().split('T')[0]!
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro ao salvar',
      description: error.message || 'Não foi possível salvar a entrada.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle cancel
const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-bold">
        {{ mode === 'create' ? 'Nova Entrada' : 'Editar Entrada' }}
      </h2>
    </template>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Date Input -->
      <UFormGroup label="Data" name="date" required>
        <UInput 
          v-model="state.entryDate" 
          type="date"
          :max="new Date().toISOString().split('T')[0]"
          size="lg"
        />
      </UFormGroup>

      <!-- Events Section -->
      <EventBadges
        v-model="state.selectedEvents"
        label="Eventos do Dia"
        placeholder="Digite um evento..."
        sort-by="frequent"
        :max-suggestions="10"
        :max-popular="15"
        size="lg"
      />

      <UDivider />

      <!-- Occurrences Section -->
      <OccurrenceBadges
        v-model="state.selectedOccurrences"
        label="Ocorrências"
        placeholder="Digite uma ocorrência..."
        sort-by="frequent"
        :max-suggestions="10"
        :max-tracked="10"
        :prioritize-tracked="true"
        size="lg"
      />
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton 
          @click="onCancel"
          variant="ghost"
          size="lg"
        >
          Cancelar
        </UButton>
        <UButton 
          @click="onSubmit"
          :loading="loading"
          :disabled="!state.entryDate"
          size="lg"
        >
          {{ mode === 'create' ? 'Criar Entrada' : 'Salvar Alterações' }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>