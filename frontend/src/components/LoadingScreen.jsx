import React, { useEffect, useState } from 'react';
import { bouncy } from 'ldrs';

bouncy.register();

const phrases = [
  'Loading your next culinary adventure...',
  'Preparing something delicious...',
  'Mixing flavors and creativity...',
  'Cooking up a tasty experience...',
  'Serving you something special...',
];

const LoadingScreen = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center bg-white">
      <l-bouncy size="90" speed="1.75" color="black"></l-bouncy>
      <div className="text-4xl font-bold leading-10 bg-gradient-to-r from-[#008000] via-emerald-500 to-lime-400 bg-clip-text text-transparent">
        {phrases[phraseIndex]}
      </div>
    </div>
  );
};

export default LoadingScreen;