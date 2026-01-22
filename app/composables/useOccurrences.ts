// composables/useOccurrences.ts
import type { Ref } from 'vue'

export interface Occurrence {
  id: string
  name: string
  usageCount: number
  lastUsedAt: string
  createdAt: string
  isTracked: boolean
}

export interface FetchOccurrencesParams {
  sortBy?: 'recent' | 'frequent' | 'alphabetical'
  limit?: number
  search?: string
  trackedOnly?: boolean
}

export const useOccurrences = () => {
  const occurrences = useState<Occurrence[]>('occurrences-library', () => [])
  const loading = useState<boolean>('occurrences-loading', () => false)
  const error = useState<string | null>('occurrences-error', () => null)

  /**
   * Fetch occurrences library
   */
  const fetchOccurrences = async (params: FetchOccurrencesParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch('/api/occurrences/library', {
        method: 'GET',
        query: params
      })

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch occurrences')
      }

      if (data.value?.success) {
        occurrences.value = data.value.data
      }

      return data.value
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching occurrences:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get occurrence by name from local state
   */
  const getOccurrenceByName = (name: string): Occurrence | undefined => {
    return occurrences.value.find(o => o.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Check if occurrence exists in library
   */
  const hasOccurrence = (name: string): boolean => {
    return occurrences.value.some(o => o.name.toLowerCase() === name.toLowerCase())
  }

  /**
   * Check if occurrence is tracked
   */
  const isTracked = (name: string): boolean => {
    const occurrence = getOccurrenceByName(name)
    return occurrence?.isTracked || false
  }

  /**
   * Get only tracked occurrences
   */
  const getTracked = (): Occurrence[] => {
    return occurrences.value.filter(o => o.isTracked)
  }

  /**
   * Get only untracked occurrences
   */
  const getUntracked = (): Occurrence[] => {
    return occurrences.value.filter(o => !o.isTracked)
  }

  /**
   * Search occurrences locally (without API call)
   */
  const searchLocal = (query: string): Occurrence[] => {
    if (!query.trim()) return occurrences.value

    const lowerQuery = query.toLowerCase()
    return occurrences.value.filter(o => 
      o.name.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get most frequently used occurrences
   */
  const getMostFrequent = (limit: number = 10): Occurrence[] => {
    return [...occurrences.value]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Get most recently used occurrences
   */
  const getMostRecent = (limit: number = 10): Occurrence[] => {
    return [...occurrences.value]
      .sort((a, b) => 
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      )
      .slice(0, limit)
  }

  /**
   * Get occurrences sorted alphabetically
   */
  const getAlphabetical = (): Occurrence[] => {
    return [...occurrences.value].sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }

  /**
   * Get occurrences that match a pattern
   */
  const filterByPattern = (pattern: RegExp): Occurrence[] => {
    return occurrences.value.filter(o => pattern.test(o.name))
  }

  /**
   * Get occurrences by usage count range
   */
  const getByUsageRange = (min: number, max: number = Infinity): Occurrence[] => {
    return occurrences.value.filter(o => 
      o.usageCount >= min && o.usageCount <= max
    )
  }

  /**
   * Get occurrences used after a specific date
   */
  const getUsedAfter = (date: string | Date): Occurrence[] => {
    const targetDate = new Date(date)
    return occurrences.value.filter(o => 
      new Date(o.lastUsedAt) > targetDate
    )
  }

  /**
   * Refresh occurrences library
   */
  const refresh = async (params: FetchOccurrencesParams = {}) => {
    occurrences.value = []
    return await fetchOccurrences(params)
  }

  /**
   * Clear all state
   */
  const clear = () => {
    occurrences.value = []
    loading.value = false
    error.value = null
  }

  /**
   * Get suggestions based on partial input
   */
  const getSuggestions = (partial: string, limit: number = 5): Occurrence[] => {
    if (!partial.trim()) return getMostRecent(limit)

    const lowerPartial = partial.toLowerCase()
    
    // Prioritize occurrences that start with the partial
    const startsWith = occurrences.value.filter(o => 
      o.name.toLowerCase().startsWith(lowerPartial)
    )
    
    // Then occurrences that contain the partial
    const contains = occurrences.value.filter(o => 
      o.name.toLowerCase().includes(lowerPartial) && 
      !o.name.toLowerCase().startsWith(lowerPartial)
    )
    
    return [...startsWith, ...contains]
      .slice(0, limit)
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * Group occurrences by tracked status
   */
  const groupByTracked = (): { tracked: Occurrence[], untracked: Occurrence[] } => {
    return {
      tracked: getTracked(),
      untracked: getUntracked()
    }
  }

  /**
   * Group occurrences by first letter
   */
  const groupByLetter = (): Record<string, Occurrence[]> => {
    const grouped: Record<string, Occurrence[]> = {}
    
    occurrences.value.forEach(occurrence => {
      const letter = occurrence.name[0].toUpperCase()
      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(occurrence)
    })
    
    return grouped
  }

  /**
   * Get occurrence statistics
   */
  const getStats = () => {
    if (occurrences.value.length === 0) {
      return {
        total: 0,
        totalTracked: 0,
        totalUsage: 0,
        averageUsage: 0,
        mostUsed: null,
        leastUsed: null,
        trackingRate: 0
      }
    }

    const totalUsage = occurrences.value.reduce((sum, o) => sum + o.usageCount, 0)
    const sorted = [...occurrences.value].sort((a, b) => b.usageCount - a.usageCount)
    const totalTracked = occurrences.value.filter(o => o.isTracked).length

    return {
      total: occurrences.value.length,
      totalTracked,
      totalUsage,
      averageUsage: totalUsage / occurrences.value.length,
      mostUsed: sorted[0],
      leastUsed: sorted[sorted.length - 1],
      trackingRate: (totalTracked / occurrences.value.length) * 100
    }
  }

  /**
   * Compare two occurrences for correlation analysis
   */
  const compareOccurrences = (name1: string, name2: string) => {
    const occ1 = getOccurrenceByName(name1)
    const occ2 = getOccurrenceByName(name2)

    if (!occ1 || !occ2) return null

    return {
      occurrence1: { name: occ1.name, usageCount: occ1.usageCount },
      occurrence2: { name: occ2.name, usageCount: occ2.usageCount },
      totalCombinedUsage: occ1.usageCount + occ2.usageCount,
      usageDifference: Math.abs(occ1.usageCount - occ2.usageCount)
    }
  }

  /**
   * Get tracked occurrence names only
   */
  const getTrackedNames = computed(() => 
    occurrences.value.filter(o => o.isTracked).map(o => o.name)
  )

  /**
   * Get untracked occurrence names only
   */
  const getUntrackedNames = computed(() => 
    occurrences.value.filter(o => !o.isTracked).map(o => o.name)
  )

  // Computed properties
  const totalOccurrences = computed(() => occurrences.value.length)
  
  const totalTracked = computed(() => 
    occurrences.value.filter(o => o.isTracked).length
  )
  
  const isLoading = computed(() => loading.value)
  
  const currentError = computed(() => error.value)
  
  const occurrenceNames = computed(() => occurrences.value.map(o => o.name))
  
  const isEmpty = computed(() => occurrences.value.length === 0)

  const stats = computed(() => getStats())

  const hasTracked = computed(() => totalTracked.value > 0)

  return {
    // State
    occurrences: computed(() => occurrences.value),
    loading: isLoading,
    error: currentError,
    
    // Computed
    totalOccurrences,
    totalTracked,
    occurrenceNames,
    trackedNames: getTrackedNames,
    untrackedNames: getUntrackedNames,
    isEmpty,
    hasTracked,
    stats,
    
    // Methods - Fetch
    fetchOccurrences,
    refresh,
    clear,
    
    // Methods - Query Local
    getOccurrenceByName,
    hasOccurrence,
    isTracked,
    searchLocal,
    getSuggestions,
    
    // Methods - Filtering
    getTracked,
    getUntracked,
    getMostFrequent,
    getMostRecent,
    getAlphabetical,
    filterByPattern,
    getByUsageRange,
    getUsedAfter,
    
    // Methods - Grouping & Analysis
    groupByTracked,
    groupByLetter,
    compareOccurrences
  }
}