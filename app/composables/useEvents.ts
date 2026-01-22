// composables/useEvents.ts
import type { Ref } from 'vue'

export interface Event {
  id: string
  name: string
  usageCount: number
  lastUsedAt: string
  createdAt: string
}

export interface FetchEventsParams {
  sortBy?: 'recent' | 'frequent' | 'alphabetical'
  limit?: number
  search?: string
}

export const useEvents = () => {
  const events = useState<Event[]>('events-library', () => [])
  const loading = useState<boolean>('events-loading', () => false)
  const error = useState<string | null>('events-error', () => null)

  /**
   * Fetch events library
   */
  const fetchEvents = async (params: FetchEventsParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch('/api/events/library', {
        method: 'GET',
        query: params
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch events')
      }

      if (data.value?.success) {
        events.value = data.value.data
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching events:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get event by name from local state
   */
  const getEventByName = (name: string): Event | undefined => {
    return events.value.find(e => e.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Check if event exists in library
   */
  const hasEvent = (name: string): boolean => {
    return events.value.some(e => e.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Search events locally (without API call)
   */
  const searchLocal = (query: string): Event[] => {
    if (!query.trim()) return events.value

    const lowerQuery = query.toLowerCase()
    return events.value.filter(e => 
      e.name.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get most frequently used events
   */
  const getMostFrequent = (limit: number = 10): Event[] => {
    return [...events.value]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Get most recently used events
   */
  const getMostRecent = (limit: number = 10): Event[] => {
    return [...events.value]
      .sort((a, b) => 
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      )
      .slice(0, limit)
  }

  /**
   * Get events sorted alphabetically
   */
  const getAlphabetical = (): Event[] => {
    return [...events.value].sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }

  /**
   * Get events that match a pattern
   */
  const filterByPattern = (pattern: RegExp): Event[] => {
    return events.value.filter(e => pattern.test(e.name))
  }

  /**
   * Get events by usage count range
   */
  const getByUsageRange = (min: number, max: number = Infinity): Event[] => {
    return events.value.filter(e => 
      e.usageCount >= min && e.usageCount <= max
    )
  }

  /**
   * Get events used after a specific date
   */
  const getUsedAfter = (date: string | Date): Event[] => {
    const targetDate = new Date(date)
    return events.value.filter(e => 
      new Date(e.lastUsedAt) > targetDate
    )
  }

  /**
   * Refresh events library
   */
  const refresh = async (params: FetchEventsParams = {}) => {
    events.value = []
    return await fetchEvents(params)
  }

  /**
   * Clear all state
   */
  const clear = () => {
    events.value = []
    loading.value = false
    error.value = null
  }

  /**
   * Get suggestions based on partial input
   */
  const getSuggestions = (partial: string, limit: number = 5): Event[] => {
    if (!partial.trim()) return getMostRecent(limit)

    const lowerPartial = partial.toLowerCase()
    
    // Prioritize events that start with the partial
    const startsWith = events.value.filter(e => 
      e.name.toLowerCase().startsWith(lowerPartial)
    )
    
    // Then events that contain the partial
    const contains = events.value.filter(e => 
      e.name.toLowerCase().includes(lowerPartial) && 
      !e.name.toLowerCase().startsWith(lowerPartial)
    )
    
    return [...startsWith, ...contains]
      .slice(0, limit)
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * Group events by first letter
   */
  const groupByLetter = (): Record<string, Event[]> => {
    const grouped: Record<string, Event[]> = {}
    
    events.value.forEach(event => {
      const letter = event.name[0].toUpperCase()
      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(event)
    })
    
    return grouped
  }

  /**
   * Get event statistics
   */
  const getStats = () => {
    if (events.value.length === 0) {
      return {
        total: 0,
        totalUsage: 0,
        averageUsage: 0,
        mostUsed: null,
        leastUsed: null
      }
    }

    const totalUsage = events.value.reduce((sum, e) => sum + e.usageCount, 0)
    const sorted = [...events.value].sort((a, b) => b.usageCount - a.usageCount)

    return {
      total: events.value.length,
      totalUsage,
      averageUsage: totalUsage / events.value.length,
      mostUsed: sorted[0],
      leastUsed: sorted[sorted.length - 1]
    }
  }

  // Computed properties
  const totalEvents = computed(() => events.value.length)
  
  const isLoading = computed(() => loading.value)
  
  const currentError = computed(() => error.value)
  
  const eventNames = computed(() => events.value.map(e => e.name))
  
  const isEmpty = computed(() => events.value.length === 0)

  const stats = computed(() => getStats())

  return {
    // State
    events: computed(() => events.value),
    loading: isLoading,
    error: currentError,
    
    // Computed
    totalEvents,
    eventNames,
    isEmpty,
    stats,
    
    // Methods - Fetch
    fetchEvents,
    refresh,
    clear,
    
    // Methods - Query Local
    getEventByName,
    hasEvent,
    searchLocal,
    getSuggestions,
    
    // Methods - Sorting & Filtering
    getMostFrequent,
    getMostRecent,
    getAlphabetical,
    filterByPattern,
    getByUsageRange,
    getUsedAfter,
    groupByLetter
  }
}