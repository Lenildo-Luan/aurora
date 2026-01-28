// server/utils/supabase.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types.ts'
import type { H3Event } from 'h3'

/**
 * Get authenticated Supabase client and user
 * Throws 401 error if user is not authenticated
 */
export async function getAuthenticatedClient(event: H3Event) {
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - User not authenticated'
    })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  
  return { supabase, user }
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${fieldName} format`
    })
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string, fieldName: string = 'Date'): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  
  if (!dateRegex.test(date)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${fieldName} format. Use YYYY-MM-DD`
    })
  }
}

/**
 * Handle Supabase errors with proper HTTP status codes
 */
export function handleSupabaseError(error: any, context: string): never {
  console.error(`${context}:`, error)
  
  // Map Supabase error codes to HTTP status codes
  const statusCode = (() => {
    if (error.code === 'PGRST116') return 404 // Not found
    if (error.code === '23505') return 409 // Unique constraint violation
    if (error.code === '23503') return 400 // Foreign key violation
    if (error.code === '42501') return 403 // Insufficient privileges
    return 500
  })()

  throw createError({
    statusCode,
    statusMessage: context,
    data: {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    }
  })
}

/**
 * Verify ownership of a resource
 */
export async function verifyOwnership(
  supabase: any,
  table: string,
  resourceId: string,
  userId: string,
  resourceName: string = 'resource'
): Promise<any> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', resourceId)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resourceName} not found`
    })
  }

  if (data.user_id !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden - You do not own this ${resourceName}`
    })
  }

  return data
}

/**
 * Parse and validate pagination parameters
 */
export function getPaginationParams(query: any) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100)
  const offset = Math.max(Number(query.offset) || 0, 0)
  
  return { limit, offset }
}

/**
 * Build standard API response
 */
export function buildResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
) {
  return {
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta })
  }
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  limit: number,
  offset: number
) {
  return {
    total,
    limit,
    offset,
    hasMore: (offset + limit) < total,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Sanitize and normalize text input
 */
export function sanitizeText(text: string): string {
  return text.trim().toLowerCase()
}

/**
 * Sanitize array of text inputs
 */
export function sanitizeTextArray(arr: string[]): string[] {
  return arr
    .filter(item => item && item.trim().length > 0)
    .map(item => sanitizeText(item))
}

/**
 * Get sort order from query params
 */
export function getSortParams(
  query: any,
  defaultSort: string = 'created_at',
  defaultOrder: 'asc' | 'desc' = 'desc'
) {
  const sortBy = query.sortBy || defaultSort
  const order = (query.order === 'asc' || query.order === 'desc') 
    ? query.order 
    : defaultOrder
  
  return { sortBy, order }
}

/**
 * Fetch resource with ownership verification
 */
export async function fetchOwnedResource(
  supabase: any,
  table: string,
  resourceId: string,
  userId: string,
  select: string = '*',
  resourceName: string = 'resource'
) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', resourceId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resourceName} not found`
    })
  }

  return data
}

/**
 * Count records with filters
 */
export async function countRecords(
  supabase: any,
  table: string,
  filters: Record<string, any> = {}
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { count, error } = await query

  if (error) {
    console.error('Error counting records:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if record exists
 */
export async function recordExists(
  supabase: any,
  table: string,
  filters: Record<string, any>
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { count } = await query
  return (count || 0) > 0
}