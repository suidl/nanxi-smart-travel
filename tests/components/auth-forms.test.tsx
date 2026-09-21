import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, vi, beforeEach, expect } from 'vitest'

import { RegisterForm } from '../../src/components/RegisterForm'
import { LoginForm } from '../../src/components/LoginForm'

beforeEach(() => {
  localStorage.clear()
})

describe('auth forms', () => {
  it('RegisterForm calls onSuccess when registering', async () => {
    const onSuccess = vi.fn()
    const onSwitch = vi.fn()
    render(<RegisterForm onSuccess={onSuccess} onSwitch={onSwitch} />)
    await userEvent.type(screen.getByLabelText(/用户名/i), 'carol')
    await userEvent.type(screen.getByLabelText(/^密码/i), 'pwd')
    await userEvent.type(screen.getByLabelText(/确认密码/i), 'pwd')
    await userEvent.click(screen.getByRole('button', { name: /注册并登录/i }))
    expect(onSuccess).toHaveBeenCalled()
  })

  it('LoginForm calls onSuccess with correct credentials', async () => {
    // prepare existing user
    const auth = await import('../../src/services/auth')
    auth.register('dave', 'dpass')

    const onSuccess = vi.fn()
    const onSwitch = vi.fn()
    render(<LoginForm onSuccess={onSuccess} onSwitch={onSwitch} />)
    await userEvent.type(screen.getByLabelText(/用户名/i), 'dave')
    await userEvent.type(screen.getByLabelText(/^密码/i), 'dpass')
    await userEvent.click(screen.getByRole('button', { name: /登录/i }))
    expect(onSuccess).toHaveBeenCalled()
  })
})
