import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  PaymentError,
  DatabaseError,
  ExternalServiceError,
  handleError,
  handleServerActionError,
  validateRequired,
  validateEmail,
  validateDateRange,
  validatePrice,
  ensureExists,
} from '@/utils/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 400)
      expect(error.statusCode).toBe(400)
    })

    it('should include context', () => {
      const context = { userId: '123', action: 'create' }
      const error = new AppError('Test error', 500, true, context)
      expect(error.context).toEqual(context)
    })
  })

  describe('ValidationError', () => {
    it('should have status code 400', () => {
      const error = new ValidationError('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Invalid input')
    })

    it('should include field name in context', () => {
      const error = new ValidationError('Invalid input', 'email')
      expect(error.context?.field).toBe('email')
    })
  })

  describe('AuthenticationError', () => {
    it('should have status code 401', () => {
      const error = new AuthenticationError()
      expect(error.statusCode).toBe(401)
    })

    it('should accept custom message', () => {
      const error = new AuthenticationError('Please login')
      expect(error.message).toBe('Please login')
    })
  })

  describe('AuthorizationError', () => {
    it('should have status code 403', () => {
      const error = new AuthorizationError()
      expect(error.statusCode).toBe(403)
    })
  })

  describe('NotFoundError', () => {
    it('should have status code 404', () => {
      const error = new NotFoundError('User')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('User not found')
    })
  })

  describe('ConflictError', () => {
    it('should have status code 409', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.statusCode).toBe(409)
    })
  })

  describe('PaymentError', () => {
    it('should have status code 402', () => {
      const error = new PaymentError('Payment failed')
      expect(error.statusCode).toBe(402)
    })
  })

  describe('DatabaseError', () => {
    it('should have status code 500 and isOperational false', () => {
      const error = new DatabaseError('Database error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
    })
  })

  describe('ExternalServiceError', () => {
    it('should have status code 502', () => {
      const error = new ExternalServiceError('Stripe', 'Service unavailable')
      expect(error.statusCode).toBe(502)
      expect(error.context?.service).toBe('Stripe')
    })
  })
})

describe('Error Handling Functions', () => {
  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Invalid input')
      const result = handleError(error)
      expect(result.message).toBe('Invalid input')
      expect(result.statusCode).toBe(400)
    })

    it('should handle regular Error', () => {
      const error = new Error('Something went wrong')
      const result = handleError(error)
      expect(result.message).toBe('Something went wrong')
      expect(result.statusCode).toBe(500)
    })

    it('should handle unknown error type', () => {
      const result = handleError(null, 'Default message')
      expect(result.message).toBe('Default message')
      expect(result.statusCode).toBe(500)
    })

    it('should detect validation errors from message', () => {
      const error = new Error('validation failed')
      const result = handleError(error)
      expect(result.statusCode).toBe(400)
    })

    it('should detect not found errors from message', () => {
      const error = new Error('not found')
      const result = handleError(error)
      expect(result.statusCode).toBe(404)
    })
  })

  describe('handleServerActionError', () => {
    it('should return message only', () => {
      const error = new ValidationError('Invalid input')
      const result = handleServerActionError(error)
      expect(result).toEqual({ message: 'Invalid input' })
    })
  })
})

describe('Validation Functions', () => {
  describe('validateRequired', () => {
    it('should pass for valid string', () => {
      expect(() => validateRequired('test', 'field')).not.toThrow()
    })

    it('should throw for empty string', () => {
      expect(() => validateRequired('', 'field')).toThrow(ValidationError)
    })

    it('should throw for whitespace only', () => {
      expect(() => validateRequired('   ', 'field')).toThrow(ValidationError)
    })

    it('should throw for null', () => {
      expect(() => validateRequired(null, 'field')).toThrow(ValidationError)
    })

    it('should throw for undefined', () => {
      expect(() => validateRequired(undefined, 'field')).toThrow(ValidationError)
    })
  })

  describe('validateEmail', () => {
    it('should pass for valid email', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow()
    })

    it('should throw for invalid email', () => {
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError)
    })

    it('should throw for email without domain', () => {
      expect(() => validateEmail('test@')).toThrow(ValidationError)
    })

    it('should throw for email without @', () => {
      expect(() => validateEmail('testexample.com')).toThrow(ValidationError)
    })
  })

  describe('validateDateRange', () => {
    it('should pass for valid date range', () => {
      // Use future dates to ensure they pass validation
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() + 10) // 10 days from now
      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + 5) // 5 days after check-in
      expect(() => validateDateRange(checkIn, checkOut)).not.toThrow()
    })

    it('should throw when checkOut is before checkIn', () => {
      const checkIn = new Date('2024-01-05')
      const checkOut = new Date('2024-01-01')
      expect(() => validateDateRange(checkIn, checkOut)).toThrow(ValidationError)
    })

    it('should throw when checkOut equals checkIn', () => {
      const date = new Date('2024-01-01')
      expect(() => validateDateRange(date, date)).toThrow(ValidationError)
    })

    it('should throw when checkIn is in the past', () => {
      const checkIn = new Date('2020-01-01')
      const checkOut = new Date('2024-01-05')
      expect(() => validateDateRange(checkIn, checkOut)).toThrow(ValidationError)
    })
  })

  describe('validatePrice', () => {
    it('should pass for valid price', () => {
      expect(() => validatePrice(100)).not.toThrow()
    })

    it('should throw for zero price', () => {
      expect(() => validatePrice(0)).toThrow(ValidationError)
    })

    it('should throw for negative price', () => {
      expect(() => validatePrice(-10)).toThrow(ValidationError)
    })

    it('should throw for price over 10000', () => {
      expect(() => validatePrice(10001)).toThrow(ValidationError)
    })
  })

  describe('ensureExists', () => {
    it('should return resource if it exists', () => {
      const resource = { id: '1', name: 'Test' }
      const result = ensureExists(resource, 'Resource')
      expect(result).toBe(resource)
    })

    it('should throw NotFoundError if resource is null', () => {
      expect(() => ensureExists(null, 'Resource')).toThrow(NotFoundError)
    })

    it('should throw NotFoundError if resource is undefined', () => {
      expect(() => ensureExists(undefined, 'Resource')).toThrow(NotFoundError)
    })

    it('should include resource name in error message', () => {
      try {
        ensureExists(null, 'Property')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect((error as NotFoundError).message).toBe('Property not found')
      }
    })
  })
})

