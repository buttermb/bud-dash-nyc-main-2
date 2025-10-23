/**
 * Advanced Security Utilities
 * Additional security measures for production launch
 */

import { supabase } from '@/integrations/supabase/client'

export interface SecurityEvent {
  id?: string
  user_id?: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at?: Date
}

export interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  suspiciousActivityThreshold: number
  enableGeoBlocking: boolean
  enableDeviceFingerprinting: boolean
  enableRateLimiting: boolean
}

class SecurityManager {
  private config: SecurityConfig
  private failedAttempts: Map<string, number> = new Map()
  private lockedAccounts: Map<string, Date> = new Map()

  constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      suspiciousActivityThreshold: 10,
      enableGeoBlocking: true,
      enableDeviceFingerprinting: true,
      enableRateLimiting: true,
    }
  }

  /**
   * Enhanced login security with brute force protection
   */
  async secureLogin(email: string, password: string, additionalData?: any): Promise<{
    success: boolean
    error?: string
    requiresVerification?: boolean
  }> {
    const clientId = this.generateClientId()
    
    try {
      // Check if account is locked
      if (this.isAccountLocked(email)) {
        await this.logSecurityEvent({
          event_type: 'login_blocked',
          severity: 'high',
          description: `Login attempt blocked - account locked: ${email}`,
          metadata: { email, clientId },
        })
        return { success: false, error: 'Account temporarily locked due to multiple failed attempts' }
      }

      // Check for suspicious activity
      if (await this.detectSuspiciousActivity(email, additionalData)) {
        await this.logSecurityEvent({
          event_type: 'suspicious_login',
          severity: 'critical',
          description: `Suspicious login attempt detected: ${email}`,
          metadata: { email, clientId, ...additionalData },
        })
        return { success: false, error: 'Suspicious activity detected. Please contact support.' }
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        await this.handleFailedLogin(email, clientId)
        return { success: false, error: error.message }
      }

      // Successful login
      await this.handleSuccessfulLogin(email, clientId, data.user)
      return { success: true }

    } catch (error) {
      await this.logSecurityEvent({
        event_type: 'login_error',
        severity: 'medium',
        description: `Login error: ${error}`,
        metadata: { email, clientId },
      })
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Device fingerprinting for enhanced security
   */
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('Device fingerprint', 10, 10)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.maxTouchPoints || 0,
    ].join('|')

    return btoa(fingerprint).substring(0, 32)
  }

  /**
   * Rate limiting for API endpoints
   */
  async checkRateLimit(userId: string, endpoint: string): Promise<boolean> {
    const key = `${userId}:${endpoint}`
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const maxRequests = 100 // Max requests per minute

    try {
      const { data } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gte('created_at', new Date(now - windowMs).toISOString())

      if (data && data.length >= maxRequests) {
        await this.logSecurityEvent({
          event_type: 'rate_limit_exceeded',
          severity: 'medium',
          description: `Rate limit exceeded for ${endpoint}`,
          metadata: { userId, endpoint, requests: data.length },
        })
        return false
      }

      // Log this request
      await supabase.from('rate_limits').insert({
        user_id: userId,
        endpoint,
        created_at: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return true // Allow on error to prevent blocking legitimate users
    }
  }

  /**
   * Content Security Policy headers
   */
  generateCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.mapbox.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://*.mapbox.com wss://*.supabase.co",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    }
  }

  /**
   * Input sanitization and validation
   */
  sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Validate and sanitize user input
   */
  validateUserInput(input: any, type: 'email' | 'phone' | 'name' | 'address'): {
    isValid: boolean
    sanitized?: string
    error?: string
  } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Invalid input type' }
    }

    const sanitized = this.sanitizeInput(input)

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(sanitized) || sanitized.length > 255) {
          return { isValid: false, error: 'Invalid email format' }
        }
        break

      case 'phone':
        const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
        if (!phoneRegex.test(sanitized)) {
          return { isValid: false, error: 'Invalid phone number format' }
        }
        break

      case 'name':
        if (sanitized.length < 2 || sanitized.length > 100) {
          return { isValid: false, error: 'Name must be 2-100 characters' }
        }
        break

      case 'address':
        if (sanitized.length < 10 || sanitized.length > 500) {
          return { isValid: false, error: 'Address must be 10-500 characters' }
        }
        break
    }

    return { isValid: true, sanitized }
  }

  /**
   * Log security events to database
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        user_id: event.user_id,
        event_type: event.event_type,
        severity: event.severity,
        description: event.description,
        metadata: event.metadata,
        ip_address: event.ip_address || await this.getClientIP(),
        user_agent: event.user_agent || navigator.userAgent,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Private helper methods
   */
  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  private isAccountLocked(email: string): boolean {
    const lockTime = this.lockedAccounts.get(email)
    if (!lockTime) return false

    const now = new Date()
    const lockDuration = this.config.lockoutDuration * 60 * 1000 // Convert to milliseconds

    if (now.getTime() - lockTime.getTime() > lockDuration) {
      this.lockedAccounts.delete(email)
      this.failedAttempts.delete(email)
      return false
    }

    return true
  }

  private async handleFailedLogin(email: string, clientId: string): Promise<void> {
    const attempts = (this.failedAttempts.get(email) || 0) + 1
    this.failedAttempts.set(email, attempts)

    await this.logSecurityEvent({
      event_type: 'login_failed',
      severity: attempts >= this.config.maxLoginAttempts ? 'high' : 'medium',
      description: `Failed login attempt ${attempts}/${this.config.maxLoginAttempts}`,
      metadata: { email, clientId, attempts },
    })

    if (attempts >= this.config.maxLoginAttempts) {
      this.lockedAccounts.set(email, new Date())
      await this.logSecurityEvent({
        event_type: 'account_locked',
        severity: 'high',
        description: `Account locked due to multiple failed attempts`,
        metadata: { email, clientId, attempts },
      })
    }
  }

  private async handleSuccessfulLogin(email: string, clientId: string, user: any): Promise<void> {
    // Clear failed attempts on successful login
    this.failedAttempts.delete(email)
    this.lockedAccounts.delete(email)

    await this.logSecurityEvent({
      event_type: 'login_success',
      severity: 'low',
      description: `Successful login`,
      metadata: { email, clientId, userId: user.id },
    })
  }

  private async detectSuspiciousActivity(email: string, additionalData?: any): Promise<boolean> {
    // Check for multiple login attempts from different IPs
    // Check for login attempts from unusual locations
    // Check for automated behavior patterns
    
    // This would typically involve checking recent security events
    // and applying machine learning models for anomaly detection
    
    return false // Simplified for now
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
}

// Export singleton instance
export const securityManager = new SecurityManager()

// Export security utilities
export const useSecurity = () => {
  return {
    secureLogin: securityManager.secureLogin.bind(securityManager),
    checkRateLimit: securityManager.checkRateLimit.bind(securityManager),
    validateInput: securityManager.validateUserInput.bind(securityManager),
    generateFingerprint: securityManager.generateDeviceFingerprint.bind(securityManager),
    logEvent: securityManager.logSecurityEvent.bind(securityManager),
  }
}
