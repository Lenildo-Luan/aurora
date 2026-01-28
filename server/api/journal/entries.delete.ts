import { 
    getAuthenticatedClient,
    handleSupabaseError,
    buildResponse,
    validateUUID,
    fetchOwnedResource
 } from '../../../server/utils/supabase'


export default defineEventHandler(async (event) => {
  // Get authenticated client in one line
  const { supabase, user } = await getAuthenticatedClient(event)

  // Get entry ID from route params
  const entryId = getRouterParam(event, 'id')

  if (!entryId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Entry ID is required'
    })
  }

  // Validate UUID format
  validateUUID(entryId, 'Entry ID')

  try {
    // Fetch resource with ownership verification in one call
    const entry = await fetchOwnedResource(
      supabase,
      'journal_entries',
      entryId,
      user.id,
      'id, entry_date',
      'Journal entry'
    )

    // Delete the entry (cascading will delete related events and occurrences)
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      handleSupabaseError(error, 'Failed to delete journal entry')
    }

    // Build standard response
    return buildResponse(
      {
        id: entryId,
        entryDate: entry.entry_date
      },
      'Journal entry deleted successfully'
    )

  } catch (error: any) {
    // Errors already handled by utilities
    throw error
  }
})
