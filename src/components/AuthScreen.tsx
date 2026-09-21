import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="auth-screen">
      <div className="auth-layout">
        <div className="auth-copy">
          <div className="auth-branding">
            <div className="brand-mark auth-brand-mark">楠溪</div>
            <div className="auth-badge">AI + OPC</div>
          </div>
          <h1 className="auth-main-title">
            <span className="auth-main-cn">楠溪智游· AI 旅行规划</span>
            <span className="auth-main-en">AI Travel Planner</span>
          </h1> 
          <div className="auth-title">2026首届永嘉农商杯AI＋OPC创新创业大赛</div>
          <div className="auth-card">
            {mode === 'login' ? (
              <LoginForm onSuccess={onAuth} onSwitch={() => setMode('register')} />
            ) : (
              <RegisterForm onSuccess={onAuth} onSwitch={() => setMode('login')} />
            )}
          </div>
          {/* <div className="auth-note">基于永嘉特色资源与 AI 智能规划能力，构建沉浸式旅行推荐、路线优化与文化导览体验。</div> */}
          <div className="auth-note">仅限演示使用，用户关闭浏览器后，数据将被清除。</div>
        </div>

        <div className="auth-illustration" aria-hidden="true">
          <div className="scene-card">
            <div className="scene-sun" />
            <div className="scene-cloud cloud-a" />
            <div className="scene-cloud cloud-b" />
            <div className="scene-hill hill-back" />
            <div className="scene-hill hill-front" />
            <div className="scene-river" />
            <div className="scene-tree tree-a" />
            <div className="scene-tree tree-b" />
            <div className="scene-label">永嘉 · 智游</div>
          </div>
        </div>
      </div>
    </div>
  )
}
