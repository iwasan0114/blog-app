import '@testing-library/jest-dom'

// Web API polyfills for test environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Web APIs
global.Response = class Response {
  constructor(body, init = {}) {
    this._body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = {
      get: (key) => (init.headers || {})[key],
      ...init.headers
    }
  }

  json() {
    return Promise.resolve(JSON.parse(this._body))
  }

  text() {
    return Promise.resolve(this._body)
  }
}

global.Request = class Request {
  constructor(url, init = {}) {
    Object.defineProperty(this, 'url', { value: url, writable: false })
    Object.defineProperty(this, 'method', { value: init.method || 'GET', writable: false })
    Object.defineProperty(this, 'headers', { 
      value: {
        get: (key) => (init.headers || {})[key],
        has: (key) => key in (init.headers || {}),
        ...init.headers
      }, 
      writable: false 
    })
    this._body = init.body
  }

  json() {
    return Promise.resolve(JSON.parse(this._body))
  }

  text() {
    return Promise.resolve(this._body)
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  }
}))

// Mock console methods to reduce test noise
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})