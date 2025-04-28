import { useState } from 'react';

// Hook to force component re-render
export default function useForceUpdate() {
  const [value, setValue] = useState(0);
  return () => setValue(value => value + 1);
}