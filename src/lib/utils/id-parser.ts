/**
 * ID parsing utility functions for converting between string, number and UUID IDs
 * Used for URL parameters and database ID conversions
 */

/**
 * Parse string or number to appropriate ID format (number for legacy, string for UUID)
 * Supports both integer IDs and UUID strings
 */
export function parseId(id: string | number): string | number {
  if (typeof id === 'number') return id
  if (typeof id === 'string') {
    // Check if it's a UUID (basic pattern check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidPattern.test(id)) {
      return id // Return UUID as string
    }
    
    // Try to parse as integer
    const parsed = parseInt(id, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  
  throw new Error(`Invalid ID: ${id}`)
}

/**
 * Parse string or number to appropriate ID format, return null if invalid
 */
export function parseIdOrNull(id: string | number | null | undefined): string | number | null {
  if (id === null || id === undefined) return null
  
  try {
    return parseId(id)
  } catch {
    return null
  }
}

/**
 * Parse array of string/number IDs to array of numbers
 */
export function parseIdArray(ids: (string | number)[]): number[] {
  return ids.map(id => parseId(id))
}

/**
 * Parse array of string/number IDs to array of numbers, filter out invalid ones
 */
export function parseIdArraySafe(ids: (string | number)[]): number[] {
  return ids
    .map(id => parseIdOrNull(id))
    .filter((id): id is number => id !== null)
}

/**
 * Convert number ID to string for URL usage
 */
export function idToString(id: number): string {
  return id.toString()
}

/**
 * Validate if a value is a valid numeric ID
 */
export function isValidId(id: unknown): id is number {
  return typeof id === 'number' && !isNaN(id) && id > 0 && Number.isInteger(id)
}

/**
 * Validate if a string can be parsed as valid numeric ID
 */
export function isValidIdString(id: string): boolean {
  const parsed = parseInt(id, 10)
  return !isNaN(parsed) && parsed > 0 && parsed.toString() === id
} 