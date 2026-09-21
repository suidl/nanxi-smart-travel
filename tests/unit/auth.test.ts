import { beforeEach, describe, expect, it } from 'vitest'
import { register, login, logout, getCurrentUser, isAuthenticated } from '../../src/services/auth'

describe('auth service (client-only)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers then logs in user', () => {
    const u = register('alice', 'pass123')
    expect(u.username).toBe('alice')
    expect(isAuthenticated()).toBe(true)
    expect(() => register('alice', 'pass123')).toThrow('用户已存在')

    logout()
    expect(() => login('alice', 'wrong')).toThrow('用户名或密码错误')

    const logged = login('alice', 'pass123')
    expect(logged.username).toBe('alice')
    expect(getCurrentUser()?.username).toBe('alice')

    register('bob', 'x')
    logout()
    expect(login('bob', 'x').username).toBe('bob')
  })
})
