import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {any} - The debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callbacks
 * @param {Function} callback - The callback function to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {Function} - The debounced callback function
 */
export function useDebouncedCallback(callback, delay) {
  const debounceRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for search functionality with debouncing
 * @param {string} initialValue - Initial search value
 * @param {Function} onSearch - Callback function when search term changes
 * @param {number} delay - Debounce delay in milliseconds (default: 300)
 * @returns {Object} - Object containing searchTerm, setSearchTerm, and debouncedSearchTerm
 */
export function useSearchDebounce(initialValue = "", onSearch, delay = 300) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (onSearch && typeof onSearch === "function") {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
  };
}
