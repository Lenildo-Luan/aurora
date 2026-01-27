// composables/useJournal.ts
import type { Ref } from 'vue'

export interface JournalEntry {
  id: string
  entryDate: string
  createdAt: string
  updatedAt: string
  events: string[]
  occurrences: string[]
}

export interface CreateEntryPayload {
  entryDate: string
  events: string[]
  occurrences: string[]
}

export interface FetchEntriesParams {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  occurrence?: string
  event?: string
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  currentPage: number
  totalPages: number
}

export const useJournal = () => {
  const entries = useState<JournalEntry[]>('journal-entries', () => [])
  const pagination = useState<PaginationMeta | null>('journal-pagination', () => null)
  const loading = useState<boolean>('journal-loading', () => false)
  const error = useState<string | null>('journal-error', () => null)

  /**
   * Fetch journal entries with optional filters
   */
  const fetchEntries = async (params: FetchEntriesParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch<{ success: boolean; data: JournalEntry[], meta: any }>('/api/journal/entries', {
        method: 'GET',
        query: params
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch entries')
      }

      if (data.value?.success) {
        entries.value = data.value.data
        pagination.value = data.value.meta?.pagination || null
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching journal entries:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create or update a journal entry
   */
  const createEntry = async (payload: CreateEntryPayload) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await useFetch<{ success: boolean; data: JournalEntry, meta: any }>('/api/journal/entries', {
        method: 'POST',
        body: payload
      })

      if (createError.value) {
        throw new Error(createError.value.message || 'Failed to create entry')
      }

      if (data.value?.success) {
        // Add or update entry in local state
        const newEntry = data.value.data
        const existingIndex = entries.value.findIndex(e => e.id === newEntry.id)
        
        if (existingIndex >= 0) {
          entries.value[existingIndex] = newEntry
        } else {
          entries.value.unshift(newEntry)
        }
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating journal entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a journal entry
   */
  const deleteEntry = async (entryId: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: deleteError } = await useFetch<{ success: boolean; data: Event[] }>(`/api/journal/${entryId}`, {
        method: 'DELETE'
      })

      if (deleteError.value) {
        throw new Error(deleteError.value.message || 'Failed to delete entry')
      }

      if (data.value?.success) {
        // Remove entry from local state
        entries.value = entries.value.filter(e => e.id !== entryId)
        
        // Update pagination total
        if (pagination.value) {
          pagination.value.total = Math.max(0, pagination.value.total - 1)
        }
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting journal entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get entry by ID from local state
   */
  const getEntryById = (entryId: string): JournalEntry | undefined => {
    return entries.value.find(e => e.id === entryId)
  }

  /**
   * Get entry by date from local state
   */
  const getEntryByDate = (date: string): JournalEntry | undefined => {
    return entries.value.find(e => e.entryDate === date)
  }

  /**
   * Check if entry exists for a specific date
   */
  const hasEntryForDate = (date: string): boolean => {
    return entries.value.some(e => e.entryDate === date)
  }

  /**
   * Load more entries (pagination)
   */
  const loadMore = async () => {
    if (!pagination.value?.hasMore) {
      return
    }

    const nextOffset = pagination.value.offset + pagination.value.limit

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch<{ success: boolean; data: JournalEntry[], meta: any }>('/api/journal/entries', {
        method: 'GET',
        query: {
          limit: pagination.value.limit,
          offset: nextOffset
        }
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to load more entries')
      }

      if (data.value?.success) {
        // Append new entries to existing ones
        entries.value = [...entries.value, ...data.value.data]
        pagination.value = data.value.meta?.pagination || null
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading more entries:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh entries (reset and fetch from beginning)
   */
  const refresh = async (params: FetchEntriesParams = {}) => {
    entries.value = []
    pagination.value = null
    return await fetchEntries(params)
  }

  /**
   * Clear all state
   */
  const clear = () => {
    entries.value = []
    pagination.value = null
    loading.value = false
    error.value = null
  }

  /**
   * Get entries filtered by occurrence
   */
  const getEntriesWithOccurrence = (occurrence: string): JournalEntry[] => {
    return entries.value.filter(entry => 
      entry.occurrences.includes(occurrence)
    )
  }

  /**
   * Get entries filtered by event
   */
  const getEntriesWithEvent = (eventName: string): JournalEntry[] => {
    return entries.value.filter(entry => 
      entry.events.includes(eventName)
    )
  }

  /**
   * Get date range of loaded entries
   */
  const getDateRange = computed(() => {
    if (entries.value.length === 0) {
      return { start: null, end: null }
    }

    const dates = entries.value.map(e => new Date(e.entryDate))
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    }
  })

  /**
   * Get total count of entries
   */
  const totalEntries = computed(() => pagination.value?.total || entries.value.length)

  /**
   * Check if there are more entries to load
   */
  const hasMore = computed(() => pagination.value?.hasMore || false)

  /**
   * Check if currently loading
   */
  const isLoading = computed(() => loading.value)

  /**
   * Get current error
   */
  const currentError = computed(() => error.value)

  return {
    // State
    entries: computed(() => entries.value),
    pagination: computed(() => pagination.value),
    loading: isLoading,
    error: currentError,
    
    // Computed
    totalEntries,
    hasMore,
    dateRange: getDateRange,
    
    // Methods
    fetchEntries,
    createEntry,
    deleteEntry,
    getEntryById,
    getEntryByDate,
    hasEntryForDate,
    loadMore,
    refresh,
    clear,
    getEntriesWithOccurrence,
    getEntriesWithEvent
  }
}