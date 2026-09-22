import { useState, type FormEvent } from 'react'
import { register } from '../services/auth'

interface RegisterFormProps {
  onSuccess: (username: string) => void
  onSwitch: () => void
}

export function RegisterForm({ onSuccess, onSwitch }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('请填写用户名和密码')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    try {
      const user = register(username, password)
      onSuccess(user.username)
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败，请重试')
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} aria-label="注册表单">
      <label htmlFor="register-username">用户名</label>
      <input
        id="register-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />

      <label htmlFor="register-password">密码</label>
      <input
        id="register-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />

      <label htmlFor="register-confirm">确认密码</label>
      <input
        id="register-confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="primary-action">注册并登录</button>
      <button type="button" className="ghost-action" onClick={onSwitch}>已有账号，去登录</button>
    </form>
  )
}
