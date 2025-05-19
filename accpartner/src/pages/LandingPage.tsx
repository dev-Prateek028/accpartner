import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Users, CheckCircle, AlertCircle, Calendar, Shield } from 'lucide-react';

function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Accountability Partners",
      description: "Find and pair with like-minded individuals to keep each other accountable for your daily tasks and goals."
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      title: "Daily Deadlines",
      description: "Set your daily deadline and work with your partner to ensure tasks are completed on time."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
      title: "Task Verification",
      description: "Verify each other's completed tasks to maintain accountability and build trust."
    },
    {
      icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
      title: "Missed Task Alerts",
      description: "Get notified when tasks are missed, helping you stay on track with your goals."
    },
    {
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      title: "Daily Planning",
      description: "Plan your tasks for the day and track your progress with your accountability partner."
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-600" />,
      title: "Rating System",
      description: "Build your reputation through a rating system based on task completion and verification."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Set Your Deadline",
      description: "Choose your daily deadline for task completion. You can only change it once per day."
    },
    {
      step: 2,
      title: "Find a Partner",
      description: "Browse available users in your timezone and send pairing requests."
    },
    {
      step: 3,
      title: "Plan Your Tasks",
      description: "Plan your daily tasks before the deadline. Be specific about what you'll accomplish."
    },
    {
      step: 4,
      title: "Complete Tasks",
      description: "Work on your tasks and mark them as completed before your deadline."
    },
    {
      step: 5,
      title: "Verify Tasks",
      description: "Verify your partner's completed tasks and provide feedback."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Stay Accountable, Achieve More
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Find your perfect accountability partner and work together to achieve your goals.
              Set deadlines, complete tasks, and verify progress together.
            </p>
            <div className="mt-10">
              {!user ? (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to stay accountable and achieve your goals
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        {feature.icon}
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-5 text-base text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Simple steps to get started with your accountability journey
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {howItWorks.map((step) => (
                <div key={step.step} className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    {step.step}
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Join today and find your accountability partner.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              {!user ? (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Get started
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 