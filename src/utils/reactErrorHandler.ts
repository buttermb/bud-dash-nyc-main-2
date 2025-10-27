/**
 * React Error Handler Utilities
 * Provides centralized error handling for React components
 */

import { toast } from 'sonner';

export const handleComponentError = (error: Error, errorInfo?: React.ErrorInfo) => {
  // Log error in development
  if (import.meta.env.DEV) {
    console.error('Component Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Log specific details for replace errors
    if (error.message?.includes('replace')) {
      console.error('Replace Error Details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack
      });
    }
  }

  // Show user-friendly message
  toast.error('Something went wrong', {
    description: 'Please refresh the page or try again later.',
  });
};

export const handleQueryError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  
  if (import.meta.env.DEV) {
    console.error('Query Error:', error);
  }

  // Don't show toast for network errors during development
  if (!message.includes('Failed to fetch') || !import.meta.env.DEV) {
    toast.error('Failed to load data', {
      description: 'Please check your connection and try again.',
    });
  }
};

export const handleMutationError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  
  if (import.meta.env.DEV) {
    console.error('Mutation Error:', error);
  }

  toast.error('Action failed', {
    description: message || 'Please try again.',
  });
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();

    const reason = event.reason instanceof Error
      ? event.reason.message
      : String(event.reason || 'Unknown error');

    if (import.meta.env.DEV) {
      console.error('Unhandled Promise Rejection:', event.reason);
    }

    // Only show toast if it's a real error, not just null/undefined
    if (reason && reason !== 'undefined' && reason !== 'null') {
      toast.error('An unexpected error occurred', {
        description: 'Please try refreshing the page.',
      });
    }
  });

  window.addEventListener('error', (event) => {
    // Don't prevent default for null errors
    if (event.error === null || event.error === undefined) {
      return;
    }

    event.preventDefault();

    const message = event.error instanceof Error
      ? event.error.message
      : String(event.error);

    if (import.meta.env.DEV && message) {
      console.error('Global Error:', {
        message: message,
        error: event.error,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  });
};
