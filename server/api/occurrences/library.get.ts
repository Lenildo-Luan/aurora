// server/api/occurrences/library.get.ts
import { 
    getAuthenticatedClient,
    handleSupabaseError,
    buildResponse
 } from '../../../server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Get authenticated client in one line
  const { supabase, user } = await getAuthenticatedClient(event)

  // Get query parameters
  const query = getQuery(event)
  const { 
    sortBy = 'recent', 
    limit = 100,
    search,
    trackedOnly = false
  } = query

  // Parse and validate pagination (max 100)
  const validLimit = Math.min(Number(limit), 100)
  const isTrackedOnly = trackedOnly === 'true' || trackedOnly === true

  try {
    // Build the base query
    let dbQuery = supabase
      .from('user_occurrences')
      .select('id, name, usage_count, last_used_at, created_at')
      .eq('user_id', user.id)

    // Apply search filter if provided
    if (search && typeof search === 'string') {
      dbQuery = dbQuery.ilike('name', `%${search}%`)
    }

    // Apply sorting based on sortBy parameter
    switch (sortBy) {
      case 'frequent':
        dbQuery = dbQuery
          .order('usage_count', { ascending: false })
          .order('last_used_at', { ascending: false })
        break
      case 'alphabetical':
        dbQuery = dbQuery.order('name', { ascending: true })
        break
      case 'recent':
      default:
        dbQuery = dbQuery.order('last_used_at', { ascending: false })
        break
    }

    // Apply limit
    dbQuery = dbQuery.limit(validLimit)

    const { data: occurrences, error } = await dbQuery

    if (error) {
      handleSupabaseError(error, 'Failed to fetch occurrences library')
    }

    // Fetch tracked occurrences to mark which ones are being tracked
    const { data: tracked, error: trackedError } = await supabase
      .from('tracked_occurrences')
      .select('name')
      .eq('user_id', user.id)

    if (trackedError) {
      console.error('Failed to fetch tracked occurrences:', trackedError)
    }

    const trackedNames = new Set(tracked?.map(t => t.name) || [])

    // Transform and filter occurrences
    let transformedOccurrences = (occurrences || []).map(occ => ({
      id: occ.id,
      name: occ.name,
      usageCount: occ.usage_count,
      lastUsedAt: occ.last_used_at,
      createdAt: occ.created_at,
      isTracked: trackedNames.has(occ.name)
    }))

    // Filter by tracked only if requested
    if (isTrackedOnly) {
      transformedOccurrences = transformedOccurrences.filter(occ => occ.isTracked)
    }

    // Build standard response
    return buildResponse(
      transformedOccurrences,
      undefined,
      {
        total: transformedOccurrences.length,
        sortBy,
        limit: validLimit,
        trackedOnly: isTrackedOnly
      }
    )

  } catch (error: any) {
    // Errors already handled by utilities
    throw error
  }
})