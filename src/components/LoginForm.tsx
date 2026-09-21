import { useState } from 'react'

interface Props { onSuccess: () => void; onSwitch: () => void }

export function LoginForm({ onSuccess, onSwitch }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // lazy import to avoid cycles
      const auth = await import('../services/auth')
      auth.login(username.trim(), password)
      setError(null)
      onSuccess()
    } catch (err: any) {
      setError(err?.message || '登录失败')
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3>登录</h3>
      <label>用户名
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label>密码
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit">登录</button>
        <button type="button" onClick={onSwitch}>去注册</button>
      </div>
    </form>
  )
}
