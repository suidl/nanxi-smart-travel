import { BookOpen, Compass, Map, PlusCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { POIS } from '../data/pois'

interface AppShellProps {
  children: ReactNode
  active: 'create' | 'cockpit'
  onNavigate: (target: 'create' | 'cockpit') => void
}

export function AppShell({ children, active, onNavigate }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">溪</span><span>楠溪智游</span></div>
        <div className="topbar-meta"><span className="live-dot" /> 永嘉公开数据 · 在线体验版</div>
      </header>
      <div className="app-frame">
        <nav className="sidebar" aria-label="主导航">
          <button className={active === 'create' ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate('create')}>
            <PlusCircle size={18} /> <span>创建行程</span>
          </button>
          <button className={active === 'cockpit' ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate('cockpit')}>
            <Compass size={18} /> <span>行程驾驶舱</span>
          </button>
          <button className="nav-item" disabled><Map size={18} /> <span>我的行程</span></button>
          <button className="nav-item" disabled><BookOpen size={18} /> <span>文化图鉴</span></button>
          <div className="sidebar-foot">
            <span className="data-count">{POIS.length}</span>
            <span>条本地数据<br />均带来源</span>
          </div>
        </nav>
        <div className="workspace">{children}</div>
      </div>
    </div>
  )
}
