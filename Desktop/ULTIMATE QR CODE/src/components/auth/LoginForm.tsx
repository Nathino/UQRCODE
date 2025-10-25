import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthErrorHandler } from '@/lib/errorHandler';
import { Lock, Phone, MessageSquare, UserPlus, KeyRound, ArrowLeft, CheckCircle, QrCode, Smartphone, Wifi, Mail, MapPin, Calendar, CreditCard, FileText, Zap } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate email format
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      AuthErrorHandler.logError(err, 'Login');
      const secureError = AuthErrorHandler.handleAuthError(err);
      setError(secureError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate email format
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(`Account created successfully! Welcome ${userCredential.user.email}. You can now login.`);
      setIsRegistering(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      AuthErrorHandler.logError(err, 'Registration');
      const secureError = AuthErrorHandler.handleAuthError(err);
      setError(secureError.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox and spam folder.');
    } catch (err: any) {
      AuthErrorHandler.logError(err, 'Password Reset');
      const secureError = AuthErrorHandler.handleAuthError(err);
      setError(secureError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating QR Code Icons */}
        <div className="absolute top-10 left-10 animate-float">
          <QrCode className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute top-20 right-20 animate-float-delayed">
          <QrCode className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute top-40 left-1/4 animate-float-slow">
          <QrCode className="w-10 h-10 text-white/10" />
        </div>
        <div className="absolute top-60 right-1/4 animate-float">
          <QrCode className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <QrCode className="w-9 h-9 text-white/20" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float-slow">
          <QrCode className="w-5 h-5 text-white/30" />
        </div>
        
        {/* Floating Tech Icons */}
        <div className="absolute top-32 left-1/3 animate-float">
          <Smartphone className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute top-50 right-1/3 animate-float-delayed">
          <Wifi className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute bottom-32 left-1/3 animate-float-slow">
          <Mail className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-50 right-1/3 animate-float">
          <MapPin className="w-5 h-5 text-white/20" />
        </div>
        <div className="absolute top-80 left-1/2 animate-float-delayed">
          <Calendar className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute bottom-80 right-1/2 animate-float-slow">
          <CreditCard className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute top-100 left-10 animate-float">
          <FileText className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-100 right-20 animate-float-delayed">
          <Zap className="w-6 h-6 text-white/30" />
        </div>
        
        {/* Animated Geometric Shapes */}
        <div className="absolute top-16 right-16 w-4 h-4 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-24 left-16 w-3 h-3 bg-white/15 rounded-full animate-ping"></div>
        <div className="absolute bottom-16 left-16 w-5 h-5 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-24 right-16 w-2 h-2 bg-white/20 rounded-full animate-ping"></div>
        
        {/* Additional animated shapes */}
        <div className="absolute top-1/3 left-8 w-6 h-6 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-8 w-4 h-4 bg-white/8 rounded-full animate-ping"></div>
        <div className="absolute top-2/3 left-12 w-3 h-3 bg-white/12 rounded-full animate-pulse"></div>
        <div className="absolute bottom-2/3 right-12 w-5 h-5 bg-white/6 rounded-full animate-ping"></div>
        
        {/* Animated lines connecting QR codes */}
        <div className="absolute top-20 left-1/2 w-px h-20 bg-white/10 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/2 w-px h-16 bg-white/15 animate-ping"></div>
        <div className="absolute top-1/2 left-8 w-16 h-px bg-white/8 animate-pulse"></div>
        <div className="absolute bottom-1/2 right-8 w-12 h-px bg-white/12 animate-ping"></div>
        
        {/* QR Code Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 gap-4 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <QrCode 
                  className="w-4 h-4 text-white animate-spin-slow" 
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${20 + (i % 3) * 5}s`
                  }} 
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional QR Code Elements */}
        <div className="absolute top-1/4 left-1/4 animate-qr-pulse">
          <QrCode className="w-12 h-12 text-white/5" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-qr-bounce">
          <QrCode className="w-8 h-8 text-white/8" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-qr-rotate">
          <QrCode className="w-6 h-6 text-white/6" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-qr-scale">
          <QrCode className="w-10 h-10 text-white/4" />
        </div>
      </div>
      
      {/* QR Code Border Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-4 -left-4 w-8 h-8 animate-qr-rotate">
          <QrCode className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute -top-4 -right-4 w-6 h-6 animate-qr-bounce">
          <QrCode className="w-6 h-6 text-white/25" />
        </div>
        <div className="absolute -bottom-4 -left-4 w-7 h-7 animate-qr-pulse">
          <QrCode className="w-7 h-7 text-white/15" />
        </div>
        <div className="absolute -bottom-4 -right-4 w-5 h-5 animate-qr-scale">
          <QrCode className="w-5 h-5 text-white/30" />
        </div>
      </div>
      
      {/* REDESIGNED FORM CONTAINER ONLY */}
      <div className="w-full max-w-md mx-4 sm:mx-0">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full relative z-10 border border-white/20 p-4 sm:p-6">
        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
            {/* Animated background rings */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-2xl"></div>
            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/20">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
            </div>
            {/* Floating decorative elements */}
            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-1 sm:mb-2">
            {isPasswordReset ? 'Reset Password' : isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            {isPasswordReset 
              ? 'Enter your email to receive reset instructions' 
              : isRegistering 
              ? 'Join us and start creating amazing QR codes' 
              : 'Sign in to your account to continue'
            }
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={isPasswordReset ? handlePasswordReset : isRegistering ? handleRegister : handleLogin} className="space-y-3 sm:space-y-4">
          {/* Email Field */}
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-blue-50 text-gray-900 placeholder-gray-400 text-sm font-medium shadow-sm hover:shadow-md focus:shadow-lg"
                required
              />
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Password Field */}
          {!isPasswordReset && (
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-blue-50 text-gray-900 placeholder-gray-400 text-sm font-medium shadow-sm hover:shadow-md focus:shadow-lg"
                  required
                />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          {isRegistering && (
            <div className="space-y-1 sm:space-y-2">
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-white focus:from-white focus:to-blue-50 text-gray-900 placeholder-gray-400 text-sm font-medium shadow-sm hover:shadow-md focus:shadow-lg"
                  required
                />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="ml-2">
                <p className="text-xs text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
          >
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10 flex items-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPasswordReset ? 'Sending Reset Email...' : isRegistering ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isPasswordReset ? 'Send Reset Email' : isRegistering ? 'Create Account' : 'Sign In'}
                </>
              )}
            </span>
          </button>
        </form>

        {/* Form Actions */}
        <div className="mt-4 space-y-2">
          {/* Toggle between Login/Register */}
          {!isPasswordReset && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                {isRegistering ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    Already have an account? Sign in
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Don't have an account? Sign up
                  </>
                )}
              </button>
            </div>
          )}

          {/* Forgot Password */}
          {!isPasswordReset && !isRegistering && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsPasswordReset(true)}
                className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-500 transition-colors duration-200"
              >
                <KeyRound className="w-3 h-3 mr-1" />
                Forgot your password?
              </button>
            </div>
          )}

          {/* Back to Login */}
          {isPasswordReset && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordReset(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-500 transition-colors duration-200"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-center text-xs text-gray-600 mb-2">Need help? Contact our support team</p>
          <div className="flex justify-center space-x-4">
            <a
              href="tel:+233547214248"
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Phone className="w-3 h-3 mr-1" />
              Call
            </a>
            <a
              href="https://wa.me/233547214248"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              WhatsApp
            </a>
          </div>
        </div>
        </div>
      </div>

      <div className="mt-6 text-center text-white text-sm">
        <p>© {new Date().getFullYear()} ANNEK TECH. All rights reserved.</p>
      </div>
    </div>
  );
}