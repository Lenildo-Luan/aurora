// server/api/journal/[id].delete.ts
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

  // Get entry ID from route params
  const entryId = getRouterParam(event, 'id')

  if (!entryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Entry ID is required'
    })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(entryId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid entry ID format'
    })
  }

  try {
    // First, verify the entry exists and belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id, user_id, entry_date')
      .eq('id', entryId)
      .single()

    if (fetchError || !existingEntry) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Journal entry not found'
      })
    }

    // Verify ownership (RLS should handle this, but double-check)
    if (existingEntry.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - You do not own this entry'
      })
    }

    // Delete the entry (cascading will delete related events and occurrences)
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete journal entry',
        data: deleteError
      })
    }

    return {
      success: true,
      message: 'Journal entry deleted successfully',
      data: {
        id: entryId,
        entryDate: existingEntry.entry_date
      }
    }

  } catch (error: any) {
    console.error('Error deleting journal entry:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal server error',
      data: error.data
    })
  }
})