import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (searchQuery = '', page = 1, pageSize = 20, signal = null) => {
    setLoading(true);
    setError(null);

    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const url = `http://localhost:3001/api/items?${params.toString()}`;

      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      // Handle both old format (array) and new format (object with data/pagination)
      if (Array.isArray(json)) {
        setItems(json);
        setPagination(null);
      } else {
        setItems(json.data || []);
        setPagination(json.pagination || null);
      }
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
    <DataContext.Provider value={{ items, pagination, loading, error, fetchItems }}>
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
