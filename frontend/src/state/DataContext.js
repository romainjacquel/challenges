import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (searchQuery = '', signal = null) => {
    setLoading(true);
    setError(null);

    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const url = `http://localhost:3001/api/items${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      setItems(json);
    } catch (err) {
      // Don't set error for aborted requests
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch items');
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, loading, error, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
