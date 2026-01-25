<script setup lang="ts">
import { useEvents } from '~/composables/useEvents'

interface Props {
  modelValue: string[]
  placeholder?: string
  label?: string
  showSuggestions?: boolean
  showPopular?: boolean
  maxSuggestions?: number
  maxPopular?: number
  sortBy?: 'recent' | 'frequent' | 'alphabetical'
  allowCustom?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Digite um evento...',
  label: 'Eventos',
  showSuggestions: true,
  showPopular: true,
  maxSuggestions: 10,
  maxPopular: 15,
  sortBy: 'frequent',
  allowCustom: true,
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { 
  events: eventsLibrary, 
  getSuggestions,
  getMostFrequent,
  getMostRecent,
  getAlphabetical,
  fetchEvents,
  loading: eventsLoading
} = useEvents()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Load events on mount
onMounted(async () => {
  if (eventsLibrary.value.length === 0) {
    await fetchEvents({ sortBy: props.sortBy, limit: 100 })
  }
})

// Selected events (v-model)
const selectedEvents = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Event suggestions based on input
const suggestions = computed(() => {
  if (!props.showSuggestions || !inputValue.value.trim()) {
    return []
  }

  return getSuggestions(inputValue.value, props.maxSuggestions)
    .filter(e => !selectedEvents.value.includes(e.name))
})

// Popular events (not yet selected)
const popularEvents = computed(() => {
  if (!props.showPopular || inputValue.value.trim()) {
    return []
  }

  let events = []
  
  switch (props.sortBy) {
    case 'frequent':
      events = getMostFrequent(100)
      break
    case 'recent':
      events = getMostRecent(100)
      break
    case 'alphabetical':
      events = getAlphabetical()
      break
    default:
      events = getMostFrequent(100)
  }

  return events
    .filter(e => !selectedEvents.value.includes(e.name))
    .slice(0, props.maxPopular)
})

// Add event to selection
const addEvent = (eventName: string) => {
  const trimmed = eventName.trim().toLowerCase()
  
  if (!trimmed) return
  
  if (selectedEvents.value.includes(trimmed)) {
    // Already selected, just clear input
    inputValue.value = ''
    return
  }

  selectedEvents.value = [...selectedEvents.value, trimmed]
  inputValue.value = ''
  
  // Focus back on input
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Remove event from selection
const removeEvent = (eventName: string) => {
  selectedEvents.value = selectedEvents.value.filter(e => e !== eventName)
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  // Backspace on empty input removes last event
  if (event.key === 'Backspace' && !inputValue.value && selectedEvents.value.length > 0) {
    const last = selectedEvents.value[selectedEvents.value.length - 1]
    if (last) {
      removeEvent(last)
    }
  }
  
  // Enter adds the event
  if (event.key === 'Enter') {
    event.preventDefault()
    if (inputValue.value.trim()) {
      if (props.allowCustom || suggestions.value.length > 0) {
        addEvent(inputValue.value)
      }
    }
  }
}

// Clear all selected events
const clearAll = () => {
  selectedEvents.value = []
  inputValue.value = ''
}

// Badge sizes based on component size
const badgeSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'sm'
    case 'lg': return 'lg'
    default: return 'md'
  }
})

// Input size based on component size
const inputSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'sm'
    case 'lg': return 'lg'
    default: return 'md'
  }
})

// Check if has selections
const hasSelection = computed(() => selectedEvents.value.length > 0)

// Check if showing any badges
const showingBadges = computed(() => 
  suggestions.value.length > 0 || popularEvents.value.length > 0
)
</script>

<template>
  <div class="event-badges-container">
    <UFormGroup v-if="label" :label="label">
      <!-- Input area -->
      <div class="input-wrapper">
        <UInput 
          ref="inputRef"
          v-model="inputValue"
          :placeholder="placeholder"
          :size="inputSize"
          @keydown="handleKeydown"
          icon="i-heroicons-magnifying-glass"
        >
          <template #trailing>
            <UButton
              v-if="hasSelection"
              @click="clearAll"
              icon="i-heroicons-x-mark"
              color="gray"
              variant="link"
              size="xs"
              :padded="false"
              title="Limpar tudo"
            />
          </template>
        </UInput>
      </div>

      <!-- Selected events -->
      <div v-if="hasSelection" class="selected-section mt-3">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selecionados ({{ selectedEvents.length }})
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="event in selectedEvents"
            :key="event"
            color="primary"
            variant="solid"
            :size="badgeSize"
            class="cursor-pointer transition-transform hover:scale-105"
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
              title="Remover"
            />
          </UBadge>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="eventsLoading" class="mt-3">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
          <span>Carregando eventos...</span>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions.length > 0" class="suggestions-section mt-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Sugestões:
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="event in suggestions"
            :key="event.id"
            @click="addEvent(event.name)"
            color="primary"
            variant="soft"
            :size="badgeSize"
            class="cursor-pointer transition-all hover:bg-primary-100 dark:hover:bg-primary-900 hover:scale-105"
          >
            {{ event.name }}
            <span class="ml-1 text-xs opacity-70">{{ event.usageCount }}</span>
          </UBadge>
        </div>
      </div>

      <!-- Popular events -->
      <div v-else-if="popularEvents.length > 0" class="popular-section mt-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ sortBy === 'frequent' ? 'Mais usados:' : sortBy === 'recent' ? 'Recentes:' : 'Eventos:' }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="event in popularEvents"
            :key="event.id"
            @click="addEvent(event.name)"
            color="gray"
            variant="soft"
            :size="badgeSize"
            class="cursor-pointer transition-all hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105"
          >
            {{ event.name }}
            <span class="ml-1 text-xs opacity-70">{{ event.usageCount }}</span>
          </UBadge>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!eventsLoading && eventsLibrary.length === 0" class="mt-3">
        <div class="text-center py-6 text-gray-500">
          <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">Nenhum evento registrado ainda</p>
          <p v-if="allowCustom" class="text-xs mt-1">Digite para adicionar o primeiro evento</p>
        </div>
      </div>

      <!-- Custom event hint -->
      <div v-if="allowCustom && inputValue && suggestions.length === 0 && !eventsLoading" class="mt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Pressione Enter para adicionar "{{ inputValue }}" como novo evento
        </p>
      </div>
    </UFormGroup>
  </div>
</template>

<style scoped>
.event-badges-container {
  width: 100%;
}

.input-wrapper {
  position: relative;
}

.selected-section,
.suggestions-section,
.popular-section {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>