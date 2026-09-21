import { useEffect, useState } from 'react'
import { planTrip } from './agent/planner'
import { replanTrip } from './agent/replanner'
import { AppShell } from './components/AppShell'
import { AuthScreen } from './components/AuthScreen'
import { getCurrentUser, logout as authLogout } from './services/auth'
import { JourneyCockpit } from './components/JourneyCockpit'
import { TripBuilder } from './components/TripBuilder'
import { MyTrips } from './components/MyTrips'
import { CulturalAtlas } from './components/CulturalAtlas'
import { POIS } from './data/pois'
import { DemoWeatherProvider } from './demo/demo-adapters'
import type { PlanResult, ReplanEvent, TripRequest, WeatherSnapshot } from './domain/types'
import { deriveRequestFromPrompt } from './domain/prompt-constraints'
import { ApiWeatherProvider, ResilientWeatherProvider, interpretTripRequest, loadSharedTrip } from './services/api'
import { loadSavedPlan, savePlan } from './services/storage'
import './styles/app.css'

type View = 'create' | 'cockpit' | 'trips' | 'atlas'

export function App() {
  const [user, setUser] = useState(() => getCurrentUser())
  const [view, setView] = useState<View>('create')
  const [plan, setPlan] = useState<PlanResult>()
  const [isPlanning, setIsPlanning] = useState(false)
  const [lastRequest, setLastRequest] = useState<TripRequest>()

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

  async function createPlan(request: TripRequest, previousPlan?: PlanResult) {
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
      if (previousPlan) {
        const oldIds = new Set(previousPlan.stops.map((stop) => stop.poi.id))
        const newIds = new Set(result.stops.map((stop) => stop.poi.id))
        const replacedPoiIds = [...oldIds].filter((id) => !newIds.has(id))
        const addedPoiIds = [...newIds].filter((id) => !oldIds.has(id))
        result.changeSummary = {
          kind: 'ai',
          reason: request.notes?.trim() || '根据新需求调整',
          budgetDelta: result.budget.total - previousPlan.budget.total,
          replacedPoiIds,
          addedPoiIds,
          previousDays: previousPlan.request.days,
        }
      }
      setPlan(result)
      setLastRequest(request)
      setView('cockpit')
    } finally {
      setIsPlanning(false)
    }
  }

  async function handleReplan(event: ReplanEvent) {
    if (!plan) return
    const rainSnapshot: WeatherSnapshot = {
      ...(plan.dailyWeather?.[event.dayIndex ? event.dayIndex - 1 : 0] ?? plan.weather),
      precipitationProbability: event.type === 'rain' ? 90 : (plan.dailyWeather?.[event.dayIndex ? event.dayIndex - 1 : 0] ?? plan.weather).precipitationProbability,
      summary: event.type === 'rain' ? '午后阵雨' : (plan.dailyWeather?.[event.dayIndex ? event.dayIndex - 1 : 0] ?? plan.weather).summary,
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
    await createPlan(deriveRequestFromPrompt({
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
    }, prompt), plan)
  }

  if (!user) {
    return <AuthScreen onAuth={() => setUser(getCurrentUser())} />
  }

  return (
    <AppShell
      active={view}
      onNavigate={(target) => {
        if (target === 'cockpit' && !plan) { setView('create'); return }
        setView(target)
      }}
    >
      <div className="user-toolbar">
        <div className="user-badge">已登录：{user.username}</div>
        <button className="user-logout" onClick={() => { authLogout(); setUser(null) }}>登出</button>
      </div>
      {view === 'trips' && (
        <MyTrips onOpen={(p) => { setPlan(p); setView('cockpit') }} onRestart={() => setView('create')} />
      )}
      {view === 'atlas' && <CulturalAtlas />}
      {(view === 'create' || view === 'cockpit') && (
        view === 'create' || !plan
          ? <TripBuilder onSubmit={(request) => createPlan(request)} isPlanning={isPlanning} initialRequest={lastRequest} />
          : <JourneyCockpit plan={plan} onReplan={handleReplan} onRestart={() => setView('create')} onGenerateFromPrompt={generateFromPrompt} isPlanning={isPlanning} />
      )}
    </AppShell>
  )
}
