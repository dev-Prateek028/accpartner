import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rateLimiter, isIPAllowed } from '../utils/rateLimiter';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface RateLimitMiddlewareProps {
  children: React.ReactNode;
}

export const RateLimitMiddleware: React.FC<RateLimitMiddlewareProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkRateLimit = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // Get client IP (you might need to adjust this based on your setup)
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const clientIP = data.ip;

        // Check IP restrictions
        const ipAllowed = await isIPAllowed(clientIP);
        if (!ipAllowed) {
          toast.error('Access denied. Please try again later.');
          navigate('/login');
          return;
        }

        // Check rate limit
        const rateLimitResult = await rateLimiter.checkRateLimit(user.uid, clientIP);
        if (!rateLimitResult.allowed) {
          toast.error(`Too many requests. Please try again after ${new Date(rateLimitResult.resetTime).toLocaleTimeString()}`);
          navigate('/login');
          return;
        }

        // Cleanup old records periodically
        if (Math.random() < 0.1) { // 10% chance to run cleanup
          await rateLimiter.cleanupOldRecords();
        }
      } catch (error) {
        console.error('Rate limit check failed:', error);
        // In case of error, allow the request but log it
      } finally {
        setIsChecking(false);
      }
    };

    checkRateLimit();
  }, [user, navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}; 