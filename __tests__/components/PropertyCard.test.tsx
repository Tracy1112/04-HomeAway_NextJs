import { render, screen } from '@testing-library/react'
import PropertyCard from '@/components/card/PropertyCard'
import { PropertyCardProps } from '@/utils/types'

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    // Remove Next.js Image specific props to avoid React warnings
    const { fill, priority, sizes, ...restProps } = props
    return <img src={src} alt={alt} {...restProps} />
  }
})

// Mock child components with simple implementations
jest.mock('@/components/card/CountryFlagAndName', () => {
  return function MockCountryFlagAndName({
    countryCode,
  }: {
    countryCode: string
  }) {
    return <div data-testid="country-flag">{countryCode}</div>
  }
})

jest.mock('@/components/card/PropertyRating', () => {
  return function MockPropertyRating({ propertyId }: { propertyId: string }) {
    return <div data-testid="property-rating">{propertyId}</div>
  }
})

jest.mock('@/components/card/FavoriteToggleButton', () => {
  return function MockFavoriteToggleButton({
    propertyId,
  }: {
    propertyId: string
  }) {
    return <button data-testid="favorite-toggle">{propertyId}</button>
  }
})

describe('PropertyCard', () => {
  const mockProperty: PropertyCardProps = {
    id: 'property-1',
    name: 'Beautiful Beach House',
    tagline: 'Amazing ocean view with private beach access',
    image: '/images/beach-house.jpg',
    country: 'US',
    price: 150,
  }

  it('should render property information correctly', () => {
    render(<PropertyCard property={mockProperty} />)

    expect(screen.getByText('Beautiful Beach House')).toBeInTheDocument()
    expect(
      screen.getByText('Amazing ocean view with private beach ac')
    ).toBeInTheDocument()
    expect(screen.getByText('$150')).toBeInTheDocument()
    expect(screen.getByText('night')).toBeInTheDocument()
  })

  it('should render property image with correct attributes', () => {
    render(<PropertyCard property={mockProperty} />)

    const image = screen.getByAltText('Beautiful Beach House')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/images/beach-house.jpg')
  })

  it('should render child components with correct props', () => {
    render(<PropertyCard property={mockProperty} />)

    expect(screen.getByTestId('country-flag')).toHaveTextContent('US')
    expect(screen.getByTestId('property-rating')).toHaveTextContent(
      'property-1'
    )
    expect(screen.getByTestId('favorite-toggle')).toHaveTextContent(
      'property-1'
    )
  })

  it('should create correct link to property details', () => {
    render(<PropertyCard property={mockProperty} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/properties/property-1')
  })

  it('should handle different price formats', () => {
    const expensiveProperty = {
      ...mockProperty,
      price: 1000,
    }

    render(<PropertyCard property={expensiveProperty} />)

    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })
})
