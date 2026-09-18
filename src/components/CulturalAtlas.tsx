import { useMemo, useState } from 'react'
import { BookOpen, ExternalLink, MapPin, Clock, Footprints, Users } from 'lucide-react'
import { POIS } from '../data/pois'
import type { Poi } from '../domain/types'

const CATEGORIES: { key: Poi['category'] | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'culture', label: '文化' },
  { key: 'village', label: '古村' },
  { key: 'scenery', label: '山水' },
  { key: 'food', label: '美食' },
  { key: 'transport', label: '交通' },
]

const CATEGORY_LABEL: Record<Poi['category'], string> = {
  culture: '文化', village: '古村', scenery: '山水', food: '美食', transport: '交通',
}

const WALKING_LABEL: Record<string, string> = { low: '轻松', medium: '适中', high: '较强' }

export function CulturalAtlas() {
  const [active, setActive] = useState<Poi['category'] | 'all'>('all')

  const list = useMemo(() => {
    return active === 'all' ? POIS : POIS.filter((p) => p.category === active)
  }, [active])

  return (
    <div className="atlas-page">
      <div className="atlas-heading">
        <div>
          <span className="eyebrow"><BookOpen size={14} /> 永嘉文旅图鉴</span>
          <h1>文化图鉴</h1>
          <p>内置 {POIS.length} 条永嘉点位数据，均带来源链接与资料日期，公开可追溯。</p>
        </div>
        <div className="atlas-filter">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={active === c.key ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setActive(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="poi-grid">
        {list.map((poi) => (
          <article key={poi.id} className="poi-card">
            <header className="poi-card-head">
              <h3>{poi.name}</h3>
              <span className={`poi-cat cat-${poi.category}`}>{CATEGORY_LABEL[poi.category]}</span>
            </header>

            <p className="poi-desc">{poi.description}</p>

            <div className="poi-facts">
              <span className="poi-fact"><MapPin size={13} /> {poi.latitude.toFixed(3)}, {poi.longitude.toFixed(3)}</span>
              {poi.openingHours && (
                <span className="poi-fact"><Clock size={13} /> {poi.openingHours}</span>
              )}
              <span className="poi-fact"><Footprints size={13} /> 步行 {WALKING_LABEL[poi.walkingLevel]}</span>
              <span className="poi-fact">
                <Users size={13} />
                {poi.seniorFriendly ? '老人友好' : ''}{poi.seniorFriendly && poi.childFriendly ? ' · ' : ''}{poi.childFriendly ? '亲子友好' : ''}
              </span>
              {poi.costPerPerson != null && (
                <span className="poi-fact"><Wallet size={13} /> ¥{poi.costPerPerson}/人</span>
              )}
            </div>

            <div className="poi-tags">
              {poi.tags.map((t) => (
                <span key={t} className="poi-tag">{t}</span>
              ))}
            </div>

            <footer className="poi-card-foot">
              <a href={poi.sourceUrl} target="_blank" rel="noreferrer noopener" className="poi-source">
                <ExternalLink size={12} /> 来源 · {poi.sourceUpdatedAt}
              </a>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}

function Wallet({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  )
}
