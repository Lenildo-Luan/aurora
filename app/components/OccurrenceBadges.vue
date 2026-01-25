<script setup lang="ts">
import { useOccurrences } from '~/composables/useOccurrences'

interface Props {
  modelValue: string[]
  placeholder?: string
  label?: string
  showSuggestions?: boolean
  showTracked?: boolean
  showPopular?: boolean
  maxSuggestions?: number
  maxTracked?: number
  maxPopular?: number
  sortBy?: 'recent' | 'frequent' | 'alphabetical'
  allowCustom?: boolean
  size?: 'sm' | 'md' | 'lg'
  prioritizeTracked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Digite uma ocorrência...',
  label: 'Ocorrências',
  showSuggestions: true,
  showTracked: true,
  showPopular: true,
  maxSuggestions: 10,
  maxTracked: 10,
  maxPopular: 15,
  sortBy: 'frequent',
  allowCustom: true,
  size: 'md',
  prioritizeTracked: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { 
  occurrences: occurrencesLibrary, 
  getSuggestions,
  getTracked,
  getMostFrequent,
  getMostRecent,
  getAlphabetical,
  fetchOccurrences,
  loading: occurrencesLoading
} = useOccurrences()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Load occurrences on mount
onMounted(async () => {
  if (occurrencesLibrary.value.length === 0) {
    await fetchOccurrences({ sortBy: props.sortBy, limit: 100 })
  }
})

// Selected occurrences (v-model)
const selectedOccurrences = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Occurrence suggestions based on input
const suggestions = computed(() => {
  if (!props.showSuggestions || !inputValue.value.trim()) {
    return []
  }

  return getSuggestions(inputValue.value, props.maxSuggestions)
    .filter(o => !selectedOccurrences.value.includes(o.name))
})

// Tracked occurrences (not yet selected)
const trackedOccurrences = computed(() => {
  if (!props.showTracked || inputValue.value.trim()) {
    return []
  }

  return getTracked()
    .filter(o => !selectedOccurrences.value.includes(o.name))
    .slice(0, props.maxTracked)
})

// Popular occurrences (not yet selected)
const popularOccurrences = computed(() => {
  if (!props.showPopular || inputValue.value.trim()) {
    return []
  }

  // If prioritizing tracked, don't show popular (tracked will be shown)
  if (props.prioritizeTracked && trackedOccurrences.value.length > 0) {
    return []
  }

  let occurrences = []
  
  switch (props.sortBy) {
    case 'frequent':
      occurrences = getMostFrequent(100)
      break
    case 'recent':
      occurrences = getMostRecent(100)
      break
    case 'alphabetical':
      occurrences = getAlphabetical()
      break
    default:
      occurrences = getMostFrequent(100)
  }

  return occurrences
    .filter(o => !selectedOccurrences.value.includes(o.name))
    .slice(0, props.maxPopular)
})

// Add occurrence to selection
const addOccurrence = (occurrenceName: string) => {
  const trimmed = occurrenceName.trim().toLowerCase()
  
  if (!trimmed) return
  
  if (selectedOccurrences.value.includes(trimmed)) {
    // Already selected, just clear input
    inputValue.value = ''
    return
  }

  selectedOccurrences.value = [...selectedOccurrences.value, trimmed]
  inputValue.value = ''
  
  // Focus back on input
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Remove occurrence from selection
const removeOccurrence = (occurrenceName: string) => {
  selectedOccurrences.value = selectedOccurrences.value.filter(o => o !== occurrenceName)
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  // Backspace on empty input removes last occurrence
  if (event.key === 'Backspace' && !inputValue.value && selectedOccurrences.value.length > 0) {
    const last = selectedOccurrences.value[selectedOccurrences.value.length - 1]
    if (last !== undefined) {
      removeOccurrence(last)
    }
  }
  
  // Enter adds the occurrence
  if (event.key === 'Enter') {
    event.preventDefault()
    if (inputValue.value.trim()) {
      if (props.allowCustom || suggestions.value.length > 0) {
        addOccurrence(inputValue.value)
      }
    }
  }
}

// Clear all selected occurrences
const clearAll = () => {
  selectedOccurrences.value = []
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
const hasSelection = computed(() => selectedOccurrences.value.length > 0)

// Check if showing any badges
const showingBadges = computed(() => 
  suggestions.value.length > 0 || 
  trackedOccurrences.value.length > 0 || 
  popularOccurrences.value.length > 0
)
</script>

<template>
  <div class="occurrence-badges-container">
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

      <!-- Selected occurrences -->
      <div v-if="hasSelection" class="selected-section mt-3">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selecionadas ({{ selectedOccurrences.length }})
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="occurrence in selectedOccurrences"
            :key="occurrence"
            color="amber"
            variant="solid"
            :size="badgeSize"
            class="cursor-pointer transition-transform hover:scale-105"
          >
            {{ occurrence }}
            <UButton
              @click="removeOccurrence(occurrence)"
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
      <div v-if="occurrencesLoading" class="mt-3">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
          <span>Carregando ocorrências...</span>
        </div>
      </div>

      <!-- Suggestions -->
      <div v-else-if="suggestions.length > 0" class="suggestions-section mt-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Sugestões:
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="occurrence in suggestions"
            :key="occurrence.id"
            @click="addOccurrence(occurrence.name)"
            color="amber"
            variant="soft"
            :size="badgeSize"
            class="cursor-pointer transition-all hover:bg-amber-100 dark:hover:bg-amber-900 hover:scale-105"
          >
            {{ occurrence.name }}
            <span class="ml-1 text-xs opacity-70">{{ occurrence.usageCount }}</span>
          </UBadge>
        </div>
      </div>

      <!-- Tracked occurrences -->
      <div v-else-if="trackedOccurrences.length > 0" class="tracked-section mt-3">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-amber-500" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Rastreadas:
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="occurrence in trackedOccurrences"
            :key="occurrence.id"
            @click="addOccurrence(occurrence.name)"
            color="amber"
            variant="outline"
            :size="badgeSize"
            class="cursor-pointer transition-all hover:bg-amber-50 dark:hover:bg-amber-950 hover:scale-105 border-amber-400 dark:border-amber-600"
          >
            {{ occurrence.name }}
            <span class="ml-1 text-xs opacity-70">{{ occurrence.usageCount }}</span>
          </UBadge>
        </div>
      </div>

      <!-- Popular occurrences -->
      <div v-else-if="popularOccurrences.length > 0" class="popular-section mt-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ sortBy === 'frequent' ? 'Mais usadas:' : sortBy === 'recent' ? 'Recentes:' : 'Ocorrências:' }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="occurrence in popularOccurrences"
            :key="occurrence.id"
            @click="addOccurrence(occurrence.name)"
            color="gray"
            variant="soft"
            :size="badgeSize"
            class="cursor-pointer transition-all hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105"
          >
            {{ occurrence.name }}
            <span class="ml-1 text-xs opacity-70">{{ occurrence.usageCount }}</span>
          </UBadge>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!occurrencesLoading && occurrencesLibrary.length === 0" class="mt-3">
        <div class="text-center py-6 text-gray-500">
          <UIcon name="i-heroicons-inbox" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">Nenhuma ocorrência registrada ainda</p>
          <p v-if="allowCustom" class="text-xs mt-1">Digite para adicionar a primeira ocorrência</p>
        </div>
      </div>

      <!-- Custom occurrence hint -->
      <div v-if="allowCustom && inputValue && suggestions.length === 0 && !occurrencesLoading" class="mt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Pressione Enter para adicionar "{{ inputValue }}" como nova ocorrência
        </p>
      </div>
    </UFormGroup>
  </div>
</template>

<style scoped>
.occurrence-badges-container {
  width: 100%;
}

.input-wrapper {
  position: relative;
}

.selected-section,
.suggestions-section,
.tracked-section,
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