// ============================================================
// PTA MANAGER - ENTRY POINT
// ============================================================
// Created by: leander_rsr | All Rights Reserved

import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import App from './App.jsx';
import './styles/global.css';

// Render the application with Error Boundary
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
