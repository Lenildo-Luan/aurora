// server/api/journal/entries.get.ts
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

  // Get query parameters for filtering and pagination
  const query = getQuery(event)
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    occurrence,
    event: eventName
  } = query

  try {
    // Build the base query with relations
    let dbQuery = supabase
      .from('journal_entries')
      .select(`
        id,
        entry_date,
        created_at,
        updated_at,
        events:entry_events(
          id,
          event_name,
          created_at
        ),
        occurrences:entry_occurrences(
          id,
          occurrence_name,
          created_at
        )
      `)
      .eq('user_id', user.id)

    // Apply date range filter if provided
    if (startDate) {
      dbQuery = dbQuery.gte('entry_date', startDate as string)
    }
    if (endDate) {
      dbQuery = dbQuery.lte('entry_date', endDate as string)
    }

    // Order by most recent first
    dbQuery = dbQuery.order('entry_date', { ascending: false })

    // Apply pagination
    dbQuery = dbQuery.range(
      Number(offset), 
      Number(offset) + Number(limit) - 1
    )

    const { data: entries, error } = await dbQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch journal entries',
        data: error
      })
    }

    // Filter by specific occurrence if provided
    let filteredEntries = entries || []
    
    if (occurrence) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.occurrences?.some(occ => 
          occ.occurrence_name === occurrence
        )
      )
    }

    // Filter by specific event if provided
    if (eventName) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.events?.some(evt => 
          evt.event_name === eventName
        )
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Failed to get count:', countError)
    }

    // Transform data to a more frontend-friendly format
    const transformedEntries = filteredEntries.map(entry => ({
      id: entry.id,
      entryDate: entry.entry_date,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      events: entry.events?.map(e => e.event_name) || [],
      occurrences: entry.occurrences?.map(o => o.occurrence_name) || []
    }))

    return {
      success: true,
      data: transformedEntries,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (Number(offset) + transformedEntries.length) < (count || 0)
      }
    }

  } catch (error: any) {
    console.error('Error fetching journal entries:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data
    })
  }
})