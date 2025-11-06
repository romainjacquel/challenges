import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchItem = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:3001/api/items/${id}`, {
          signal: abortController.signal
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Item not found');
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (isMounted) {
          setItem(data);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message);
          // Redirect to home after 3 seconds if item not found
          if (err.message === 'Item not found') {
            setTimeout(() => navigate('/'), 3000);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="item-detail-container">
        <div className="skeleton-detail">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-text"></div>
          <div className="skeleton-line skeleton-text"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="item-detail-container">
        <div className="error-detail">
          <h2>⚠️ {error}</h2>
          <p>Redirecting to home page...</p>
          <Link to="/" className="back-link">Go back now</Link>
        </div>
      </div>
    );
  }

  // Item detail
  return (
    <div className="item-detail-container">
      <Link to="/" className="back-link">← Back to Items</Link>

      <div className="item-detail-card">
        <h1 className="item-title">{item.name}</h1>

        <div className="item-info">
          <div className="info-row">
            <span className="info-label">Category</span>
            <span className="info-value category">{item.category}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Price</span>
            <span className="info-value price">{item.price.toFixed(2)}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Item ID</span>
            <span className="info-value item-id">#{item.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
