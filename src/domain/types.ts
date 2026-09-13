export type WalkingLevel = 'low' | 'medium' | 'high'
export type WeatherSuitability = 'outdoor' | 'indoor' | 'all-weather'

export interface TripRequest {
  start: string
  date: string
  days: 1 | 2
  adults: number
  children: number
  seniors: number
  budget: number
  preferences: string[]
  walkingLevel: WalkingLevel
  dietaryNeeds: string
  notes?: string
}

export interface NormalizedTripRequest extends Omit<TripRequest, 'dietaryNeeds'> {
  partySize: number
  dietaryNeeds: string[]
}

export interface Poi {
  id: string
  name: string
  category: 'scenery' | 'culture' | 'village' | 'food' | 'transport'
  latitude: number
  longitude: number
  durationMinutes: number
  costPerPerson: number | null
  openingHours: string | null
  walkingLevel: WalkingLevel
  weatherSuitability: WeatherSuitability
  seniorFriendly: boolean
  childFriendly: boolean
  tags: string[]
  description: string
  sourceUrl: string
  sourceUpdatedAt: string
}

export interface WeatherSnapshot {
  date: string
  temperatureMin: number
  temperatureMax: number
  precipitationProbability: number
  summary: string
  source: 'live' | 'cache' | 'demo'
  fetchedAt: string
}

export type ToolTraceKind =
  | 'constraints'
  | 'weather'
  | 'poi_search'
  | 'route'
  | 'budget'
  | 'validation'

export interface ToolTrace {
  kind: ToolTraceKind
  label: string
  inputSummary: string
  resultSummary: string
  status: 'pending' | 'running' | 'success' | 'error'
  durationMs: number
}

export interface ItineraryStop {
  id: string
  poi: Poi
  startTime: string
  endTime: string
  travelMinutes: number
  estimatedCost: number
  completed: boolean
  note: string
}

export interface BudgetBreakdown {
  transport: number
  tickets: number
  food: number
  contingency: number
  total: number
}

export interface RouteEstimate {
  orderedPoiIds: string[]
  totalDistanceKm: number
  totalTravelMinutes: number
  isEstimate: true
}

export interface ValidationIssue {
  code: 'OVER_BUDGET' | 'OPENING_HOURS_CONFLICT' | 'WALKING_LEVEL' | 'WEATHER_RISK'
  message: string
  poiId?: string
}

export interface PlanResult {
  id: string
  request: NormalizedTripRequest
  weather: WeatherSnapshot
  stops: ItineraryStop[]
  route: RouteEstimate
  budget: BudgetBreakdown
  traces: ToolTrace[]
  validationIssues: ValidationIssue[]
  generatedAt: string
  interpretation?: {
    source: 'ai' | 'demo'
    model?: string
    summary: string
  }
  changeSummary?: {
    reason: string
    budgetDelta: number
    replacedPoiIds: string[]
  }
}

export interface ReplanEvent {
  type: 'rain' | 'closure' | 'traffic' | 'fatigue' | 'budget'
  label: string
  currentTime: string
  affectedPoiId?: string
  newBudget?: number
  demo: boolean
}
