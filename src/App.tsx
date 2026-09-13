import { useEffect, useState } from 'react'
import { planTrip } from './agent/planner'
import { replanTrip } from './agent/replanner'
import { AppShell } from './components/AppShell'
import { JourneyCockpit } from './components/JourneyCockpit'
import { TripBuilder } from './components/TripBuilder'
import { POIS } from './data/pois'
import { DemoWeatherProvider } from './demo/demo-adapters'
import type { PlanResult, ReplanEvent, TripRequest, WeatherSnapshot } from './domain/types'
import { ApiWeatherProvider, ResilientWeatherProvider, interpretTripRequest, loadSharedTrip } from './services/api'
import { loadSavedPlan, savePlan } from './services/storage'
import './styles/app.css'

export function App() {
  const [view, setView] = useState<'create' | 'cockpit'>('create')
  const [plan, setPlan] = useState<PlanResult>()
  const [isPlanning, setIsPlanning] = useState(false)

  useEffect(() => {
    const sharedId = new URLSearchParams(window.location.search).get('trip')
    if (sharedId) {
      void loadSharedTrip(sharedId).then((shared) => {
        setPlan(shared)
        setView('cockpit')
      }).catch(() => undefined)
      return
    }
    const saved = loadSavedPlan()
    if (saved) setPlan(saved)
  }, [])

  useEffect(() => {
    if (plan) savePlan(plan)
  }, [plan])

  async function createPlan(request: TripRequest) {
    setIsPlanning(true)
    try {
      let interpretedRequest = request
      let interpretation: PlanResult['interpretation'] = {
        source: 'demo',
        summary: request.notes?.trim() || `识别 ${request.preferences.length} 项偏好`,
      }
      try {
        const online = await interpretTripRequest(request)
        interpretedRequest = online.request
        interpretation = { source: 'ai', model: online.model, summary: online.summary }
      } catch {
        // 无在线服务时保持明确标记的本地演示流程。
      }
      const weatherProvider = new ResilientWeatherProvider(new ApiWeatherProvider(), new DemoWeatherProvider())
      const result = await planTrip(interpretedRequest, { pois: POIS, weatherProvider, interpretation })
      setPlan(result)
      setView('cockpit')
    } finally {
      setIsPlanning(false)
    }
  }

  async function handleReplan(event: ReplanEvent) {
    if (!plan) return
    const rainSnapshot: WeatherSnapshot = {
      ...plan.weather,
      precipitationProbability: event.type === 'rain' ? 90 : plan.weather.precipitationProbability,
      summary: event.type === 'rain' ? '午后阵雨' : plan.weather.summary,
      source: 'demo',
      fetchedAt: new Date().toISOString(),
    }
    const result = await replanTrip(plan, event, {
      pois: POIS,
      weatherProvider: { getForecast: async () => rainSnapshot },
    })
    setPlan(result)
  }

  async function generateFromPrompt(prompt: string) {
    if (!plan) return
    await createPlan({
      start: plan.request.start,
      date: plan.request.date,
      days: plan.request.days,
      adults: plan.request.adults,
      children: plan.request.children,
      seniors: plan.request.seniors,
      budget: plan.request.budget,
      preferences: plan.request.preferences,
      walkingLevel: plan.request.walkingLevel,
      dietaryNeeds: plan.request.dietaryNeeds.join('、'),
      notes: prompt,
    })
  }

  return (
    <AppShell active={view} onNavigate={(target) => setView(target === 'cockpit' && !plan ? 'create' : target)}>
      {view === 'create' || !plan
        ? <TripBuilder onSubmit={createPlan} isPlanning={isPlanning} />
        : <JourneyCockpit plan={plan} onReplan={handleReplan} onRestart={() => setView('create')} onGenerateFromPrompt={generateFromPrompt} isPlanning={isPlanning} />}
    </AppShell>
  )
}
