import {
  generateBlockedPeriods,
  generateDateRange,
  generateDisabledDates,
  calculateDaysBetween,
  defaultSelected,
} from '@/utils/calendar'

describe('Calendar Utilities', () => {
  describe('generateBlockedPeriods', () => {
    it('should generate blocked periods from bookings', () => {
      const today = new Date('2024-01-15')
      const bookings = [
        {
          checkIn: new Date('2024-01-20'),
          checkOut: new Date('2024-01-25'),
        },
        {
          checkIn: new Date('2024-02-01'),
          checkOut: new Date('2024-02-05'),
        },
      ]

      const blocked = generateBlockedPeriods({ bookings, today })

      expect(blocked).toHaveLength(3) // 2 bookings + 1 past dates range
      expect(blocked[0].from).toEqual(bookings[0].checkIn)
      expect(blocked[0].to).toEqual(bookings[0].checkOut)
    })

    it('should include past dates as blocked', () => {
      const today = new Date('2024-01-15')
      const blocked = generateBlockedPeriods({ bookings: [], today })

      expect(blocked).toHaveLength(1)
      expect(blocked[0].from).toBeInstanceOf(Date)
      expect(blocked[0].to).toBeInstanceOf(Date)
    })
  })

  describe('generateDateRange', () => {
    it('should generate date range array', () => {
      const range = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-05'),
      }

      const dates = generateDateRange(range)

      expect(dates).toHaveLength(5)
      expect(dates[0]).toBe('2024-01-01')
      expect(dates[4]).toBe('2024-01-05')
    })

    it('should return empty array for undefined range', () => {
      expect(generateDateRange(undefined)).toEqual([])
    })

    it('should return empty array for incomplete range', () => {
      expect(generateDateRange({ from: undefined, to: undefined })).toEqual([])
      expect(generateDateRange({ from: new Date('2024-01-01'), to: undefined })).toEqual([])
    })

    it('should handle single day range', () => {
      const range = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-01'),
      }

      const dates = generateDateRange(range)
      expect(dates).toHaveLength(1)
      expect(dates[0]).toBe('2024-01-01')
    })
  })

  describe('generateDisabledDates', () => {
    it('should generate disabled dates object', () => {
      // Use future dates to ensure they're not filtered out
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10) // 10 days from now
      const futureDateEnd = new Date(futureDate)
      futureDateEnd.setDate(futureDateEnd.getDate() + 2) // 2 days after

      const disabledDays = [
        {
          from: futureDate,
          to: futureDateEnd,
        },
      ]

      const disabled = generateDisabledDates(disabledDays)

      const dateString1 = futureDate.toISOString().split('T')[0]
      const dateString2 = new Date(futureDate.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const dateString3 = futureDateEnd.toISOString().split('T')[0]

      expect(disabled[dateString1]).toBe(true)
      expect(disabled[dateString2]).toBe(true)
      expect(disabled[dateString3]).toBe(true)
    })

    it('should not include past dates', () => {
      const today = new Date('2024-01-15')
      today.setHours(0, 0, 0, 0)

      const disabledDays = [
        {
          from: new Date('2024-01-10'), // past
          to: new Date('2024-01-12'), // past
        },
      ]

      const disabled = generateDisabledDates(disabledDays)
      expect(Object.keys(disabled).length).toBe(0)
    })

    it('should return empty object for empty array', () => {
      expect(generateDisabledDates([])).toEqual({})
    })
  })

  describe('calculateDaysBetween', () => {
    it('should calculate days between two dates', () => {
      const checkIn = new Date('2024-01-01')
      const checkOut = new Date('2024-01-05')

      const days = calculateDaysBetween({ checkIn, checkOut })

      expect(days).toBe(4)
    })

    it('should handle same day', () => {
      const date = new Date('2024-01-01')
      const days = calculateDaysBetween({ checkIn: date, checkOut: date })

      expect(days).toBe(0)
    })

    it('should handle reversed dates', () => {
      const checkIn = new Date('2024-01-05')
      const checkOut = new Date('2024-01-01')

      const days = calculateDaysBetween({ checkIn, checkOut })

      expect(days).toBe(4) // Should use absolute value
    })
  })

  describe('defaultSelected', () => {
    it('should have undefined from and to', () => {
      expect(defaultSelected.from).toBeUndefined()
      expect(defaultSelected.to).toBeUndefined()
    })
  })
})
