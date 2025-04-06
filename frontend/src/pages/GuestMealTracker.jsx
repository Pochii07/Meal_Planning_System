import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const GuestMealTracker = () => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify the access code against your backend
      const response = await fetch('/api/patient_routes/verify-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // If successful, navigate to the meal tracker page with the patient ID
        navigate(`/guest-meal-tracker/${accessCode}`);
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-35 bg-gray-50 min-h-screen">
      <div className="text-center p-4 max-w-1xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Track Your Progress
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sign up now to access your personalized meal tracking dashboard
        </p>
        <Link
          to="/SignUp"
          className="inline-block bg-green-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-green-700 transition duration-300"
        >
          Sign Up Now
        </Link>
      </div>
      <div className="text-center p-4 max-w-1xl py-24">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Have an Access Code?
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Enter access code to access your meal tracker.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-green-400"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 mt-4 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default GuestMealTracker;
