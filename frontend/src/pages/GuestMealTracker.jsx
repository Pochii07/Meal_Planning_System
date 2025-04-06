import React from 'react';
import { Link } from 'react-router-dom';

const GuestMealTracker = () => {
  return (
    <div className="flex flex-col items-center justify-center py-35 bg-gray-50">
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
          Have a Access code?
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Enter access code to access your meal tracker.
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter access code"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            className="bg-green-600 text-white font-semibold px-6 py-1 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestMealTracker;
