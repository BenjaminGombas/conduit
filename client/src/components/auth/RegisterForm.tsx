import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '@/store/auth/authSlice';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export const RegisterForm = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(register({ username, email, password }));
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark p-6">
      <div className="w-full max-w-md bg-navy rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Create Account
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-rose/10 border border-rose/20 rounded-md text-rose text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-navy-light border border-navy-light rounded-md 
                       text-white focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

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
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-text-secondary text-sm text-center mt-4">
            Already have an account?{' '}
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