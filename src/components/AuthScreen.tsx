import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {mode === 'login' ? (
          <LoginForm onSuccess={onAuth} onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSuccess={onAuth} onSwitch={() => setMode('login')} />
        )}
      </div>
      <div style={{marginTop:12,fontSize:12,color:'#666'}}>提示：此为客户端演示认证，数据存储在 localStorage，非生产级安全方案。</div>
    </div>
  )
}
