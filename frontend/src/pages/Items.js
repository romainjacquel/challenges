import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import './Items.css';

function Items() {
  const { items, pagination, fetchItems, loading, error } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const listContainerRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items with server-side pagination (memory-leak safe)
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const loadItems = async () => {
      try {
        await fetchItems(debouncedQuery, currentPage, pageSize, abortController.signal);
      } catch (e) {
        if (mounted && e.name !== 'AbortError') {
          console.error('Failed to fetch items:', e);
        }
      }
    };

    loadItems();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [debouncedQuery, currentPage, pageSize, fetchItems]);

  const handlePageChange = useCallback((delta) => {
    setCurrentPage((prev) => {
      const next = prev + delta;
      // Scroll to top of list
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0;
      }
      return next;
    });
  }, []);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(parseInt(e.target.value, 10));
    setCurrentPage(1);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCurrentPage(1);
  }, []);

  const handleJumpToPage = useCallback((e) => {
    const value = Number(e.target.value);
    if (!Number.isNaN(value) && pagination) {
      const validPage = Math.max(1, Math.min(value, pagination.totalPages));
      setCurrentPage(validPage);
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0;
      }
    }
  }, [pagination]);

  // Use server pagination info or fallback
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || items.length;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const hasPrevPage = pagination?.hasPrevPage ?? false;

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="items-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrapper">
              <input
                disabled
                placeholder="Loading..."
                className="search-input disabled"
              />
            </div>
          </div>
        </div>
        <div className="skeleton-loader">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-item">
              <div className="skeleton-line skeleton-name"></div>
              <div className="skeleton-line skeleton-category"></div>
              <div className="skeleton-line skeleton-price"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <div className="items-container">
        <div className="error-message" role="alert">
          <h3>⚠️ Error Loading Items</h3>
          <p>{error}</p>
          <button
            onClick={() => fetchItems(debouncedQuery, currentPage, pageSize)}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!items.length && !loading) {
    return (
      <div className="items-container">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search items"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No items found</h3>
          <p>{searchQuery ? `No results for "${searchQuery}"` : 'No items available'}</p>
          {searchQuery && (
            <button onClick={clearSearch} className="clear-search-button">
              Clear search
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="items-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search items"
              disabled={loading}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-btn"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="page-size-wrapper">
            <label htmlFor="pageSize" className="page-size-label">
              Show:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="page-size-select"
              aria-label="Items per page"
              disabled={loading}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="toolbar-right">
          <span className="results-count" aria-live="polite">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
            {pagination && totalPages > 0 && ` • Page ${currentPage} of ${totalPages}`}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div
        ref={listContainerRef}
        className="items-list-container"
        role="list"
        aria-label="Items list"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="item-row"
            role="listitem"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <Link to={`/items/${item.id}`} className="item-link">
              <div className="item-content">
                <div className="item-main">
                  <span className="item-name">{item.name}</span>
                  <span className="item-category">{item.category}</span>
                </div>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination - Show only if more than 1 page */}
      {pagination && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(-1)}
            disabled={!hasPrevPage || loading}
            className="pagination-button"
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <div className="pagination-center">
            <span className="pagination-info">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="jump-to-page">
              <label htmlFor="jumpPage" className="sr-only">Jump to page</label>
              <input
                id="jumpPage"
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={handleJumpToPage}
                className="jump-input"
                aria-label="Jump to page"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={() => handlePageChange(1)}
            disabled={!hasNextPage || loading}
            className="pagination-button"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Items;
