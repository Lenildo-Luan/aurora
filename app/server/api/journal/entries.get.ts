import { 
    getAuthenticatedClient,
    handleSupabaseError,
    buildResponse,
    getPaginationParams,
    buildPaginationMeta,
    countRecords
 } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Get authenticated client in one line
  const { supabase, user } = await getAuthenticatedClient(event)

  // Parse pagination parameters
  const query = getQuery(event)
  const { limit, offset } = getPaginationParams(query)
  
  // Extract filter parameters
  const { startDate, endDate, occurrence, event: eventName } = query

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

    // Apply date range filters
    if (startDate) {
      dbQuery = dbQuery.gte('entry_date', startDate as string)
    }
    if (endDate) {
      dbQuery = dbQuery.lte('entry_date', endDate as string)
    }

    // Order by most recent first and apply pagination
    dbQuery = dbQuery
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: entries, error } = await dbQuery

    if (error) {
      handleSupabaseError(error, 'Failed to fetch journal entries')
    }

    // Filter by specific occurrence or event if provided
    let filteredEntries = entries || []
    
    if (occurrence) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.occurrences?.some(occ => occ.occurrence_name === occurrence)
      )
    }

    if (eventName) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.events?.some(evt => evt.event_name === eventName)
      )
    }

    // Get total count
    const total = await countRecords(supabase, 'journal_entries', {
      user_id: user.id
    })

    // Transform data to frontend-friendly format
    const transformedEntries = filteredEntries.map(entry => ({
      id: entry.id,
      entryDate: entry.entry_date,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      events: entry.events?.map(e => e.event_name) || [],
      occurrences: entry.occurrences?.map(o => o.occurrence_name) || []
    }))

    // Build response with pagination metadata
    return buildResponse(
      transformedEntries,
      undefined,
      {
        pagination: buildPaginationMeta(total, limit, offset)
      }
    )

  } catch (error: any) {
    // Errors already handled by utilities
    throw error
  }
})