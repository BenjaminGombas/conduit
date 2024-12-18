import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';

export const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');

            if (!token || !email) {
                setStatus('error');
                setError('Invalid verification link');
                return;
            }

            try {
                await authService.verifyEmail(token, email);
                setStatus('success');
            } catch (err) {
                setStatus('error');
                setError('Failed to verify email. The link may be expired or invalid.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark p-6">
            <div className="w-full max-w-md bg-navy rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-6">
                    Email Verification
                </h2>

                {status === 'verifying' && (
                    <p className="text-text-secondary text-center">
                        Verifying your email...
                    </p>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <p className="text-text-secondary mb-4">
                            Your email has been successfully verified!
                        </p>
                        <Button onClick={() => navigate('/login')}>
                            Go to Login
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <p className="text-rose mb-4">{error}</p>
                        <Button onClick={() => navigate('/login')}>
                            Go to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};