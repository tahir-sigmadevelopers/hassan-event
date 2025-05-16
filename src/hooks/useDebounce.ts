import { useState, useEffect } from 'react';

// Hook that delays updating a value until a specified delay has passed
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (or if the component unmounts)
    // This is how we prevent debouncedValue from updating if value is 
    // changed within the delay period
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce; 