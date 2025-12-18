import { GET } from '@/app/api/confirm/route'
import db from '@/utils/db'

// Mock NextRequest
const createMockRequest = (url: string) => {
  return {
    url,
    method: 'GET',
    headers: new Headers(),
  } as any
}
import { redirect } from 'next/navigation'

// Mock Stripe
jest.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  }
  return jest.fn().mockImplementation(() => mockStripe)
})

// Mock database
jest.mock('@/utils/db', () => ({
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}))

// Mock redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('/api/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
  })

  it('should confirm payment and update booking', async () => {
    const mockSession = {
      status: 'complete',
      metadata: {
        bookingId: 'booking-1',
      },
    }

    const mockBooking = {
      id: 'booking-1',
      paymentStatus: false,
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)
    ;(db.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking)
    ;(db.booking.update as jest.Mock).mockResolvedValue({
      ...mockBooking,
      paymentStatus: true,
    })

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(stripeInstance.checkout.sessions.retrieve).toHaveBeenCalledWith('session_123')
    expect(db.booking.findUnique).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      select: { id: true, paymentStatus: true },
    })
    expect(db.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { paymentStatus: true },
    })
    expect(redirect).toHaveBeenCalledWith('/bookings')
  })

  it('should redirect if booking already paid', async () => {
    const mockSession = {
      status: 'complete',
      metadata: {
        bookingId: 'booking-1',
      },
    }

    const mockBooking = {
      id: 'booking-1',
      paymentStatus: true, // already paid
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)
    ;(db.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking)

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(db.booking.update).not.toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/bookings')
  })

  it('should handle missing session_id', async () => {
    const request = createMockRequest('http://localhost:3000/api/confirm')

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })

  it('should handle missing bookingId in metadata', async () => {
    const mockSession = {
      status: 'complete',
      metadata: {}, // no bookingId
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })

  it('should handle incomplete payment status', async () => {
    const mockSession = {
      status: 'open', // not complete
      metadata: {
        bookingId: 'booking-1',
      },
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })

  it('should handle booking not found', async () => {
    const mockSession = {
      status: 'complete',
      metadata: {
        bookingId: 'booking-1',
      },
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)
    ;(db.booking.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })

  it('should handle Stripe errors', async () => {
    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockRejectedValue(
      new Error('Stripe error')
    )

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })

  it('should handle database update errors', async () => {
    const mockSession = {
      status: 'complete',
      metadata: {
        bookingId: 'booking-1',
      },
    }

    const mockBooking = {
      id: 'booking-1',
      paymentStatus: false,
    }

    const Stripe = require('stripe')
    const stripeInstance = new Stripe()
    stripeInstance.checkout.sessions.retrieve.mockResolvedValue(mockSession)
    ;(db.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking)
    ;(db.booking.update as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest(
      'http://localhost:3000/api/confirm?session_id=session_123'
    )

    await GET(request)

    expect(redirect).toHaveBeenCalledWith('/bookings?error=payment_failed')
  })
})

