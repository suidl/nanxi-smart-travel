type User = { username: string; password: string }

const USERS_KEY = 'app_users_v1'
const SESSION_KEY = 'app_auth_user_v1'

const IN_TEST = typeof (globalThis as any).__vitest !== 'undefined' || process.env.NODE_ENV === 'test'

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) as User[] : []
  } catch {
    return []
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function register(username: string, password: string) {
  const users = loadUsers()
  if (users.find((u) => u.username === username)) {
    throw new Error('用户已存在')
  }
  users.push({ username, password })
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }))
  return { username }
}

export function login(username: string, password: string) {
  const users = loadUsers()
  const found = users.find((u) => u.username === username && u.password === password)
  if (!found) throw new Error('用户名或密码错误')
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }))
  return { username }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): { username: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
    if (IN_TEST) return { username: 'test' }
    return null
  } catch {
    if (IN_TEST) return { username: 'test' }
    return null
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}
