import { 
    getAuthenticatedClient, 
    validateDateFormat,
    recordExists,
    fetchOwnedResource,
    handleSupabaseError,
    sanitizeTextArray,
    buildResponse
 } from '../../../server/utils/supabase'

interface CreateEntryBody {
  entryDate: string
  events: string[]
  occurrences: string[]
}

export default defineEventHandler(async (event) => {
  // Get authenticated client in one line
  const { supabase, user } = await getAuthenticatedClient(event)

  // Parse request body
  const body = await readBody<CreateEntryBody>(event)

  // Validate date format
  if (!body.entryDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Entry date is required'
    })
  }
  validateDateFormat(body.entryDate, 'Entry date')

  try {
    // Check if entry already exists for this date
    const existingEntry = await recordExists(supabase, 'journal_entries', {
      user_id: user.id,
      entry_date: body.entryDate
    })

    let entryId: string

    if (existingEntry) {
      // Get existing entry
      const entry = await fetchOwnedResource(
        supabase,
        'journal_entries',
        body.entryDate,
        user.id,
        'id',
        'journal entry'
      )
      entryId = entry.id

      // Delete existing events and occurrences
      await supabase.from('entry_events').delete().eq('entry_id', entryId)
      await supabase.from('entry_occurrences').delete().eq('entry_id', entryId)
    } else {
      // Create new entry
      const { data: newEntry, error } = await supabase
        .from('journal_entries')
        .insert({ user_id: user.id, entry_date: body.entryDate })
        .select('id')
        .single()

      if (error) handleSupabaseError(error, 'Failed to create journal entry')
      entryId = newEntry.id
    }

    // ✨ Utility: Sanitize text arrays
    const sanitizedEvents = sanitizeTextArray(body.events || [])
    const sanitizedOccurrences = sanitizeTextArray(body.occurrences || [])

    // Insert events
    if (sanitizedEvents.length > 0) {
      const { error } = await supabase
        .from('entry_events')
        .insert(sanitizedEvents.map(name => ({
          entry_id: entryId,
          event_name: name
        })))

      if (error) handleSupabaseError(error, 'Failed to insert events')
    }

    // Insert occurrences
    if (sanitizedOccurrences.length > 0) {
      const { error } = await supabase
        .from('entry_occurrences')
        .insert(sanitizedOccurrences.map(name => ({
          entry_id: entryId,
          occurrence_name: name
        })))

      if (error) handleSupabaseError(error, 'Failed to insert occurrences')
    }

    // Fetch complete entry
    const { data: completeEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select(`
        id, entry_date, created_at, updated_at,
        events:entry_events(id, event_name),
        occurrences:entry_occurrences(id, occurrence_name)
      `)
      .eq('id', entryId)
      .single()

    if (fetchError) handleSupabaseError(fetchError, 'Failed to fetch created entry')

    // Build standard response
    return buildResponse(
      {
        id: completeEntry.id,
        entryDate: completeEntry.entry_date,
        createdAt: completeEntry.created_at,
        updatedAt: completeEntry.updated_at,
        events: completeEntry.events?.map(e => e.event_name) || [],
        occurrences: completeEntry.occurrences?.map(o => o.occurrence_name) || []
      },
      existingEntry ? 'Entry updated successfully' : 'Entry created successfully'
    )

  } catch (error: any) {
    // Already handled by utils
    throw error
  }
})