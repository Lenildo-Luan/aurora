<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
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
  events: eventsLibrary, 
  getSuggestions: getEventSuggestions,
  fetchEvents 
} = useEvents()
const { 
  occurrences: occurrencesLibrary,
  trackedOccurrences,
  getSuggestions: getOccurrenceSuggestions,
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

// Event suggestions for autocomplete
const eventSuggestions = computed(() => 
  getEventSuggestions(state.newEvent, 10)
    .filter(e => !state.selectedEvents.includes(e.name))
)

// Occurrence suggestions for autocomplete
const occurrenceSuggestions = computed(() => 
  getOccurrenceSuggestions(state.newOccurrence, 10)
    .filter(o => !state.selectedOccurrences.includes(o.name))
)

// Popular events (not yet selected)
const popularEvents = computed(() => 
  eventsLibrary.value
    .filter(e => !state.selectedEvents.includes(e.name))
    .slice(0, 15)
)

// Popular occurrences (not yet selected)
const popularOccurrences = computed(() => 
  occurrencesLibrary.value
    .filter(o => !state.selectedOccurrences.includes(o.name))
    .slice(0, 10)
)

// Add event
const addEvent = (eventName: string) => {
  const trimmed = eventName.trim().toLowerCase()
  if (trimmed && !state.selectedEvents.includes(trimmed)) {
    state.selectedEvents.push(trimmed)
    state.newEvent = ''
  }
}

// Remove event
const removeEvent = (eventName: string) => {
  const index = state.selectedEvents.indexOf(eventName)
  if (index > -1) {
    state.selectedEvents.splice(index, 1)
  }
}

// Add occurrence
const addOccurrence = (occurrenceName: string) => {
  const trimmed = occurrenceName.trim().toLowerCase()
  if (trimmed && !state.selectedOccurrences.includes(trimmed)) {
    state.selectedOccurrences.push(trimmed)
    state.newOccurrence = ''
  }
}

// Remove occurrence
const removeOccurrence = (occurrenceName: string) => {
  const index = state.selectedOccurrences.indexOf(occurrenceName)
  if (index > -1) {
    state.selectedOccurrences.splice(index, 1)
  }
}

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
      <div class="space-y-3">
        <UFormGroup label="Eventos do Dia" name="events">
          <div class="flex gap-2">
            <UInput 
              v-model="state.newEvent"
              placeholder="Digite um evento..."
              @keyup.enter="addEvent(state.newEvent)"
              size="lg"
              class="flex-1"
            />
            <UButton 
              @click="addEvent(state.newEvent)"
              :disabled="!state.newEvent.trim()"
              icon="i-heroicons-plus"
              size="lg"
            >
              Adicionar
            </UButton>
          </div>
        </UFormGroup>

        <!-- Event suggestions -->
        <div v-if="state.newEvent && eventSuggestions.length > 0" class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Sugestões:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="event in eventSuggestions"
              :key="event.id"
              @click="addEvent(event.name)"
              color="primary"
              variant="soft"
              class="cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900"
            >
              {{ event.name }}
              <span class="ml-1 text-xs opacity-70">{{ event.usageCount }}</span>
            </UBadge>
          </div>
        </div>

        <!-- Selected events -->
        <div v-if="state.selectedEvents.length > 0" class="space-y-2">
          <p class="text-sm font-medium">Selecionados:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="event in state.selectedEvents"
              :key="event"
              color="primary"
              variant="solid"
              size="lg"
            >
              {{ event }}
              <UButton
                @click="removeEvent(event)"
                icon="i-heroicons-x-mark"
                color="white"
                variant="link"
                size="2xs"
                :padded="false"
                class="ml-1"
              />
            </UBadge>
          </div>
        </div>

        <!-- Popular events -->
        <div v-if="!state.newEvent && popularEvents.length > 0" class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Mais usados:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="event in popularEvents"
              :key="event.id"
              @click="addEvent(event.name)"
              color="gray"
              variant="soft"
              class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {{ event.name }}
              <span class="ml-1 text-xs opacity-70">{{ event.usageCount }}</span>
            </UBadge>
          </div>
        </div>
      </div>

      <UDivider />

      <!-- Occurrences Section -->
      <div class="space-y-3">
        <UFormGroup label="Ocorrências" name="occurrences">
          <div class="flex gap-2">
            <UInput 
              v-model="state.newOccurrence"
              placeholder="Digite uma ocorrência..."
              @keyup.enter="addOccurrence(state.newOccurrence)"
              size="lg"
              class="flex-1"
            />
            <UButton 
              @click="addOccurrence(state.newOccurrence)"
              :disabled="!state.newOccurrence.trim()"
              icon="i-heroicons-plus"
              size="lg"
            >
              Adicionar
            </UButton>
          </div>
        </UFormGroup>

        <!-- Occurrence suggestions -->
        <div v-if="state.newOccurrence && occurrenceSuggestions.length > 0" class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Sugestões:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="occ in occurrenceSuggestions"
              :key="occ.id"
              @click="addOccurrence(occ.name)"
              color="amber"
              variant="soft"
              class="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900"
            >
              {{ occ.name }}
              <span class="ml-1 text-xs opacity-70">{{ occ.usageCount }}</span>
            </UBadge>
          </div>
        </div>

        <!-- Selected occurrences -->
        <div v-if="state.selectedOccurrences.length > 0" class="space-y-2">
          <p class="text-sm font-medium">Selecionadas:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="occ in state.selectedOccurrences"
              :key="occ"
              color="amber"
              variant="solid"
              size="lg"
            >
              {{ occ }}
              <UButton
                @click="removeOccurrence(occ)"
                icon="i-heroicons-x-mark"
                color="white"
                variant="link"
                size="2xs"
                :padded="false"
                class="ml-1"
              />
            </UBadge>
          </div>
        </div>

        <!-- Tracked occurrences -->
        <div v-if="!state.newOccurrence && trackedOccurrences.length > 0" class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">Rastreadas:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="occ in trackedOccurrences"
              :key="occ.id"
              @click="addOccurrence(occ.name)"
              color="gray"
              variant="soft"
              class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {{ occ.name }}
              <span class="ml-1 text-xs opacity-70">{{ occ.usageCount }}</span>
            </UBadge>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton 
          @click="onCancel"
          color="gray"
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