import { 
    getAuthenticatedClient,
    handleSupabaseError,
    buildResponse
 } from '../../../server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { supabase, user } = await getAuthenticatedClient(event)

  // Get query parameters
  const query = getQuery(event)
  const { 
    sortBy = 'recent', 
    limit = 100,
    search 
  } = query

  // Parse and validate pagination (max 100)
  const validLimit = Math.min(Number(limit), 100)

  try {
    // Build the base query
    let dbQuery = supabase
      .from('user_events')
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

    const { data: events, error } = await dbQuery

    if (error) {
      handleSupabaseError(error, 'Failed to fetch events library')
    }

    // Transform to frontend-friendly format
    const transformedEvents = (events || []).map(evt => ({
      id: evt.id,
      name: evt.name,
      usageCount: evt.usage_count,
      lastUsedAt: evt.last_used_at,
      createdAt: evt.created_at
    }))

    // Utility: Build standard response
    return buildResponse(
      transformedEvents,
      undefined,
      {
        total: transformedEvents.length,
        sortBy,
        limit: validLimit
      }
    )

  } catch (error: any) {
    // Errors already handled by utilities
    throw error
  }
})