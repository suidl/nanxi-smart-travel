import type { BudgetBreakdown, ItineraryStop, NormalizedTripRequest } from '../domain/types'

export function calculateBudget(
  request: NormalizedTripRequest,
  stops: ItineraryStop[],
): BudgetBreakdown {
  const travelMinutes = stops.reduce((sum, stop) => sum + stop.travelMinutes, 0)
  const transport = Math.round(160 + travelMinutes * 1.6)
  const tickets = stops.reduce((sum, stop) => sum + (stop.poi.costPerPerson ?? 0) * request.partySize, 0)
  const food = Array.from({ length: request.days }, (_, index) => index + 1).reduce((sum, dayIndex) => {
    const meals = stops.filter((stop) => (stop.dayIndex ?? 1) === dayIndex && stop.poi.category === 'food')
    const plannedFood = meals.reduce((mealTotal, stop) => mealTotal + (stop.poi.costPerPerson ?? 0) * request.partySize, 0)
    return sum + Math.max(plannedFood, 50 * request.partySize)
  }, 0)
  const subtotal = transport + tickets + food
  const contingency = Math.round(subtotal * 0.1)
  return { transport, tickets, food, contingency, total: subtotal + contingency }
}
