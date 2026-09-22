export interface User {
  username: string
}

interface StoredUser extends User {
  password: string
}

const USERS_KEY = 'nanxi-smart-travel:users'
const SESSION_KEY = 'nanxi-smart-travel:session'

function readUsers(storage: Storage = localStorage): StoredUser[] {
  const serialized = storage.getItem(USERS_KEY)
  if (!serialized) return []
  try {
    const parsed = JSON.parse(serialized) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[], storage: Storage = localStorage) {
  storage.setItem(USERS_KEY, JSON.stringify(users))
}

/** 注册成功后自动登录，返回当前用户。 */
export function register(username: string, password: string, storage: Storage = localStorage): User {
  const name = username.trim()
  if (!name || !password) throw new Error('用户名和密码不能为空')
  const users = readUsers(storage)
  if (users.some((u) => u.username === name)) throw new Error('用户已存在')
  users.push({ username: name, password })
  writeUsers(users, storage)
  storage.setItem(SESSION_KEY, name)
  return { username: name }
}

export function login(username: string, password: string, storage: Storage = localStorage): User {
  const name = username.trim()
  const user = readUsers(storage).find((u) => u.username === name)
  if (!user || user.password !== password) throw new Error('用户名或密码错误')
  storage.setItem(SESSION_KEY, name)
  return { username: name }
}

export function logout(storage: Storage = localStorage) {
  storage.removeItem(SESSION_KEY)
}

export function getCurrentUser(storage: Storage = localStorage): User | undefined {
  const name = storage.getItem(SESSION_KEY)
  return name ? { username: name } : undefined
}

export function isAuthenticated(storage: Storage = localStorage): boolean {
  return getCurrentUser(storage) !== undefined
}
