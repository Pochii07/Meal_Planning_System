import React from 'react';
import { Link } from 'react-router-dom';

const GuestMealTracker = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
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
    </div>
  );
};

export default GuestMealTracker;