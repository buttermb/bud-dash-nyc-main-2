import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import Index from '../pages/Index'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

test('renders homepage with hero section', () => {
  render(
    <TestWrapper>
      <Index />
    </TestWrapper>
  )
  
  expect(screen.getByText(/New York Minute NYC/i)).toBeInTheDocument()
  expect(screen.getByText(/Premium Cannabis Delivery/i)).toBeInTheDocument()
})

test('renders navigation menu', () => {
  render(
    <TestWrapper>
      <Index />
    </TestWrapper>
  )
  
  expect(screen.getByRole('navigation')).toBeInTheDocument()
})
