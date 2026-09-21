import { useState } from 'react'

interface Props { onSuccess: () => void; onSwitch: () => void }

export function RegisterForm({ onSuccess, onSwitch }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    try {
      const auth = await import('../services/auth')
      auth.register(username.trim(), password)
      setError(null)
      onSuccess()
    } catch (err: any) {
      setError(err?.message || '注册失败')
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>用户名
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label>密码
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <label>确认密码
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </label>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit">注册并登录</button>
        <button type="button" onClick={onSwitch}>去登录</button>
      </div>
    </form>
  )
}
