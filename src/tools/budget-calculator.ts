import type { BudgetBreakdown, ItineraryStop, NormalizedTripRequest } from '../domain/types'

export function calculateBudget(
  request: NormalizedTripRequest,
  stops: ItineraryStop[],
): BudgetBreakdown {
  const travelMinutes = stops.reduce((sum, stop) => sum + stop.travelMinutes, 0)
  const transport = Math.round(160 + travelMinutes * 1.6)
  const tickets = stops.reduce((sum, stop) => sum + (stop.poi.costPerPerson ?? 0) * request.partySize, 0)
  const hasFoodStop = stops.some((stop) => stop.poi.category === 'food')
  const food = hasFoodStop
    ? stops.filter((stop) => stop.poi.category === 'food').reduce((sum, stop) => sum + (stop.poi.costPerPerson ?? 0) * request.partySize, 0)
    : 50 * request.partySize * request.days
  const subtotal = transport + tickets + food
  const contingency = Math.round(subtotal * 0.1)
  return { transport, tickets, food, contingency, total: subtotal + contingency }
}
