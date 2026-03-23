"use client";

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const valueToStore = JSON.stringify(storedValue);
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      return newValue;
    });
  };
  
  return [storedValue, setValue];
}
