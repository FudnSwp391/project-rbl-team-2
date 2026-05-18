import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/layout/Header';
import AppRoutes from './routes/AppRoutes';
import './index.css';

function App() {
  return (
    <Router>
      <Header />
      <main style={{ flex: 1 }}>
        <AppRoutes />
      </main>
      <footer style={{ 
        padding: 'var(--spacing-md) 0', 
        textAlign: 'center', 
        borderTop: '1px solid var(--glass-border)',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}>
        <div className="container">
          © 2026 AI Mock Interview - Hệ thống Đánh giá Năng lực Tự động. All rights reserved.
        </div>
      </footer>
    </Router>
  );
}

export default App;
