import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
  currentUser: jest.fn(),
  auth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() =>
    Promise.resolve({
      elements: jest.fn(),
      createPaymentMethod: jest.fn(),
      confirmPayment: jest.fn(),
    })
  ),
}))

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.ADMIN_USER_ID = 'admin-user-id'

// Mock Web APIs for testing
global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body || {}
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  }
}

// Mock Request for Next.js API routes
// Note: NextRequest extends Request, so we need to properly mock it
global.Request = class Request {
  constructor(input, init) {
    const urlValue = typeof input === 'string' ? input : input?.url || ''
    // Use Object.defineProperty to create a read-only url property
    Object.defineProperty(this, 'url', {
      get: () => urlValue,
      enumerable: true,
      configurable: false,
    })
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers)
    this.body = init?.body
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body || {}
  }
}

// Mock Headers
global.Headers = class Headers {
  constructor(init) {
    this._headers = new Map()
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers.set(key, value)
        })
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this._headers.set(key, value)
        })
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key, value)
        })
      }
    }
  }

  get(name) {
    return this._headers.get(name.toLowerCase())
  }

  set(name, value) {
    this._headers.set(name.toLowerCase(), value)
  }

  has(name) {
    return this._headers.has(name.toLowerCase())
  }

  forEach(callback) {
    this._headers.forEach(callback)
  }
}
