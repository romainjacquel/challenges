import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';
import './App.css';

function App() {
  return (
    <DataProvider>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              📦 Item Store
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Browse Items</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2024 Item Store. Built with React & Node.js</p>
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;
