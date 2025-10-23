import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock Supabase responses
export const handlers = [
  // Mock auth endpoints
  http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      },
    })
  }),

  // Mock products endpoint
  http.get('https://*.supabase.co/rest/v1/products', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Product',
        price: 25.99,
        category: 'flower',
        in_stock: true,
        image_url: '/placeholder.svg',
      },
    ])
  }),

  // Mock orders endpoint
  http.get('https://*.supabase.co/rest/v1/orders', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        status: 'pending',
        total: 25.99,
        created_at: new Date().toISOString(),
      },
    ])
  }),
]

export const server = setupServer(...handlers)
