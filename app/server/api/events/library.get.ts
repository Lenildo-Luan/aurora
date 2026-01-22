// server/api/events/library.get.ts
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
    search
  } = query

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

    const { data: events, error } = await dbQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch events library',
        data: error
      })
    }

    // Transform to frontend-friendly format
    const transformedEvents = (events || []).map(evt => ({
      id: evt.id,
      name: evt.name,
      usageCount: evt.usage_count,
      lastUsedAt: evt.last_used_at,
      createdAt: evt.created_at
    }))

    return {
      success: true,
      data: transformedEvents,
      meta: {
        total: transformedEvents.length,
        sortBy,
        limit: Number(limit)
      }
    }

  } catch (error: any) {
    console.error('Error fetching events library:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data
    })
  }
})