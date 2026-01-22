// server/api/occurrences/library.get.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types.ts'

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - User not authenticated'
    })
  }

  // Get Supabase client with user context
  const supabase = await serverSupabaseClient<Database>(event)

  // Get query parameters for sorting and filtering
  const query = getQuery(event)
  const {
    sortBy = 'recent', // 'recent', 'frequent', 'alphabetical'
    limit = 100,
    search,
    trackedOnly = false // Filter only tracked occurrences
  } = query

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

    // Apply sorting
    switch (sortBy) {
      case 'frequent':
        dbQuery = dbQuery.order('usage_count', { ascending: false })
        dbQuery = dbQuery.order('last_used_at', { ascending: false })
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
    dbQuery = dbQuery.limit(Number(limit))

    const { data: occurrences, error } = await dbQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch occurrences library',
        data: error
      })
    }

    let transformedOccurrences = (occurrences || []).map(occ => ({
      id: occ.id,
      name: occ.name,
      usageCount: occ.usage_count,
      lastUsedAt: occ.last_used_at,
      createdAt: occ.created_at,
      isTracked: false // Will be updated below if trackedOnly is true
    }))

    // If trackedOnly filter is enabled, fetch tracked occurrences
    if (trackedOnly === 'true' || trackedOnly === true) {
      const { data: tracked, error: trackedError } = await supabase
        .from('tracked_occurrences')
        .select('name')
        .eq('user_id', user.id)

      if (trackedError) {
        console.error('Failed to fetch tracked occurrences:', trackedError)
      } else {
        const trackedNames = new Set(tracked?.map(t => t.name) || [])
        
        // Filter and mark tracked occurrences
        transformedOccurrences = transformedOccurrences
          .filter(occ => trackedNames.has(occ.name))
          .map(occ => ({
            ...occ,
            isTracked: true
          }))
      }
    } else {
      // Otherwise, mark which ones are tracked
      const { data: tracked, error: trackedError } = await supabase
        .from('tracked_occurrences')
        .select('name')
        .eq('user_id', user.id)

      if (!trackedError && tracked) {
        const trackedNames = new Set(tracked.map(t => t.name))
        transformedOccurrences = transformedOccurrences.map(occ => ({
          ...occ,
          isTracked: trackedNames.has(occ.name)
        }))
      }
    }

    return {
      success: true,
      data: transformedOccurrences,
      meta: {
        total: transformedOccurrences.length,
        sortBy,
        limit: Number(limit),
        trackedOnly: trackedOnly === 'true' || trackedOnly === true
      }
    }

  } catch (error: any) {
    console.error('Error fetching occurrences library:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data
    })
  }
})