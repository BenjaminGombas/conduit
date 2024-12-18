import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      navigate('/login', { 
        state: { message: 'Password successfully reset. Please log in.' } 
      });
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-white">
        Invalid reset link. Please request a new one.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark p-6">
      <div className="w-full max-w-md bg-navy rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Set New Password
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose/10 border border-rose/20 rounded-md text-rose text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-navy-light border border-navy-light rounded-md 
                       text-white focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-navy-light border border-navy-light rounded-md 
                       text-white focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
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
      </div>
    </div>
  );
};