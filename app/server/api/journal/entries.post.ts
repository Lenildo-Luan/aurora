// server/api/journal/entries.post.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types.ts'

interface CreateEntryBody {
  entryDate: string // YYYY-MM-DD format
  events: string[]
  occurrences: string[]
}

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

  // Parse request body
  const body = await readBody<CreateEntryBody>(event)

  // Validate input
  if (!body.entryDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Entry date is required'
    })
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(body.entryDate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date format. Use YYYY-MM-DD'
    })
  }

  try {
    // Check if entry already exists for this date
    const { data: existingEntry } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('entry_date', body.entryDate)
      .single()

    let entryId: string

    if (existingEntry) {
      // Update existing entry
      entryId = existingEntry.id

      // Delete existing events and occurrences
      await supabase
        .from('entry_events')
        .delete()
        .eq('entry_id', entryId)

      await supabase
        .from('entry_occurrences')
        .delete()
        .eq('entry_id', entryId)

    } else {
      // Create new journal entry
      const { data: newEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: body.entryDate
        })
        .select('id')
        .single()

      if (entryError) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create journal entry',
          data: entryError
        })
      }

      entryId = newEntry.id
    }

    // Insert events if provided
    if (body.events && body.events.length > 0) {
      const eventsToInsert = body.events
        .filter(event => event && event.trim().length > 0)
        .map(event => ({
          entry_id: entryId,
          event_name: event.trim().toLowerCase()
        }))

      if (eventsToInsert.length > 0) {
        const { error: eventsError } = await supabase
          .from('entry_events')
          .insert(eventsToInsert)

        if (eventsError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to insert events',
            data: eventsError
          })
        }
      }
    }

    // Insert occurrences if provided
    if (body.occurrences && body.occurrences.length > 0) {
      const occurrencesToInsert = body.occurrences
        .filter(occurrence => occurrence && occurrence.trim().length > 0)
        .map(occurrence => ({
          entry_id: entryId,
          occurrence_name: occurrence.trim().toLowerCase()
        }))

      if (occurrencesToInsert.length > 0) {
        const { error: occurrencesError } = await supabase
          .from('entry_occurrences')
          .insert(occurrencesToInsert)

        if (occurrencesError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to insert occurrences',
            data: occurrencesError
          })
        }
      }
    }

    // Fetch the complete entry with relations
    const { data: completeEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select(`
        id,
        entry_date,
        created_at,
        updated_at,
        events:entry_events(
          id,
          event_name
        ),
        occurrences:entry_occurrences(
          id,
          occurrence_name
        )
      `)
      .eq('id', entryId)
      .single()

    if (fetchError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch created entry',
        data: fetchError
      })
    }

    // Transform to frontend-friendly format
    return {
      success: true,
      message: existingEntry ? 'Entry updated successfully' : 'Entry created successfully',
      data: {
        id: completeEntry.id,
        entryDate: completeEntry.entry_date,
        createdAt: completeEntry.created_at,
        updatedAt: completeEntry.updated_at,
        events: completeEntry.events?.map(e => e.event_name) || [],
        occurrences: completeEntry.occurrences?.map(o => o.occurrence_name) || []
      }
    }

  } catch (error: any) {
    console.error('Error creating journal entry:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data
    })
  }
})