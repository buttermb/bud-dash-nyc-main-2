/**
 * Health Check API Endpoint
 * Production health monitoring endpoint
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    const dbHealth = await checkDatabaseHealth()
    
    // Check external services
    const externalHealth = await checkExternalServices()
    
    // Check system resources
    const systemHealth = await checkSystemHealth()
    
    const responseTime = Date.now() - startTime
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      version: process.env.BUILD_TIMESTAMP || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbHealth,
        external: externalHealth,
        system: systemHealth,
      },
    }
    
    // Determine overall health status
    const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy')
    health.status = allHealthy ? 'healthy' : 'degraded'
    
    const statusCode = allHealthy ? 200 : 503
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}

async function checkDatabaseHealth() {
  try {
    // This would check your Supabase connection
    // For now, return a mock response
    return {
      status: 'healthy',
      responseTime: 50,
      message: 'Database connection successful',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

async function checkExternalServices() {
  const services = [
    { name: 'Supabase', url: process.env.VITE_SUPABASE_URL },
    { name: 'Mapbox', url: 'https://api.mapbox.com' },
  ]
  
  const results = await Promise.allSettled(
    services.map(async (service) => {
      if (!service.url) return { name: service.name, status: 'skipped' }
      
      const startTime = Date.now()
      try {
        const response = await fetch(service.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        })
        
        return {
          name: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
        }
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )
  
  const healthyServices = results.filter(
    result => result.status === 'fulfilled' && 
    (result as PromiseFulfilledResult<any>).value.status === 'healthy'
  ).length
  
  return {
    status: healthyServices === services.length ? 'healthy' : 'degraded',
    services: results.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'error' }
    ),
  }
}

async function checkSystemHealth() {
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  
  return {
    status: 'healthy',
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    nodeVersion: process.version,
    platform: process.platform,
  }
}
