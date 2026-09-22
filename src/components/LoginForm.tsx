import { useState, type FormEvent } from 'react'
import { login } from '../services/auth'

interface LoginFormProps {
  onSuccess: (username: string) => void
  onSwitch: () => void
}

export function LoginForm({ onSuccess, onSwitch }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const user = login(username, password)
      onSuccess(user.username)
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请重试')
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} aria-label="登录表单">
      <label htmlFor="login-username">用户名</label>
      <input
        id="login-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />

      <label htmlFor="login-password">密码</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="primary-action">登录</button>
      <button type="button" className="ghost-action" onClick={onSwitch}>还没有账号，去注册</button>
    </form>
  )
}
