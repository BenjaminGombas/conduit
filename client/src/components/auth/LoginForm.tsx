import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '@/store/auth/authSlice';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export const LoginForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(login({ email, password }));
      if (login.fulfilled.match(resultAction)) {
        navigate('/channels/@me');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark p-6">
      <div className="w-full max-w-md bg-navy rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Welcome Back
        </h2>
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

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Password
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
            <Link 
              to="/forgot-password" 
              className="text-sm text-rose hover:text-rose-light transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-text-secondary text-sm text-center mt-4">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-rose hover:text-rose-light transition-colors"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};