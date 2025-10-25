/**
 * Secure error handling utility for Firebase Auth
 * Prevents exposure of sensitive system information
 */

export interface SecureError {
  message: string;
  code?: string;
}

export class AuthErrorHandler {
  /**
   * Convert Firebase Auth errors to user-friendly messages
   * without exposing system details
   */
  static handleAuthError(error: any): SecureError {
    const errorCode = error?.code || '';
    
    // Map Firebase error codes to user-friendly messages
    switch (errorCode) {
      // Authentication errors
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return {
          message: 'Invalid email or password. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS'
        };
      
      // Account creation errors
      case 'auth/email-already-in-use':
        return {
          message: 'An account with this email already exists. Please try logging in instead.',
          code: 'EMAIL_EXISTS'
        };
      
      case 'auth/weak-password':
        return {
          message: 'Password is too weak. Please choose a stronger password.',
          code: 'WEAK_PASSWORD'
        };
      
      // Network and system errors
      case 'auth/network-request-failed':
        return {
          message: 'Network error. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR'
        };
      
      case 'auth/too-many-requests':
        return {
          message: 'Too many failed attempts. Please wait a moment and try again.',
          code: 'RATE_LIMITED'
        };
      
      // Password reset errors
      case 'auth/user-disabled':
        return {
          message: 'This account has been disabled. Please contact support.',
          code: 'ACCOUNT_DISABLED'
        };
      
      case 'auth/invalid-action-code':
        return {
          message: 'Invalid reset link. Please request a new password reset.',
          code: 'INVALID_RESET_LINK'
        };
      
      // Generic fallback for unknown errors
      default:
        return {
          message: 'An unexpected error occurred. Please try again later.',
          code: 'UNKNOWN_ERROR'
        };
    }
  }

  /**
   * Log error details for debugging (server-side only)
   * Never expose to client
   */
  static logError(error: any, context: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Auth Error - ${context}]:`, {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        fullError: error // Add this to see the complete error object
      });
    }
  }

  /**
   * Check if error is a known Firebase Auth error
   */
  static isAuthError(error: any): boolean {
    return error?.code?.startsWith('auth/');
  }

  /**
   * Get generic error message for unknown errors
   */
  static getGenericError(): SecureError {
    return {
      message: 'Something went wrong. Please try again later.',
      code: 'GENERIC_ERROR'
    };
  }
}
