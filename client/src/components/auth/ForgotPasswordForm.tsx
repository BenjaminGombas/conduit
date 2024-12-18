import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark p-6">
      <div className="w-full max-w-md bg-navy rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Reset Password
        </h2>

        {success ? (
          <div className="text-center">
            <p className="text-text-secondary mb-4">
              If an account exists with that email, you'll receive instructions to reset your password.
            </p>
            <Link 
              to="/login" 
              className="text-rose hover:text-rose-light transition-colors"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-rose/10 border border-rose/20 rounded-md text-rose text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-navy-light border border-navy-light rounded-md 
                           text-white focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <p className="text-text-secondary text-sm text-center mt-4">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="text-rose hover:text-rose-light transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};