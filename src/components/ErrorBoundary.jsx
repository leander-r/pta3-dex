// ============================================================
// ERROR BOUNDARY COMPONENT
// ============================================================

import React from 'react';

/**
 * Error Boundary - Catches React errors and displays fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error('PTA Manager Error:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    background: '#fff3f3', 
                    borderRadius: '15px',
                    margin: '20px',
                    border: '2px solid #ff6b6b'
                }}>
                    <h2 style={{ color: '#e53935', marginBottom: '15px' }}>⚠️ Something went wrong</h2>
                    <p style={{ marginBottom: '15px', color: '#666' }}>
                        The application encountered an error. Your data should be safe in storage.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            background: '#f5a623',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Reload Application
                    </button>
                    <details style={{ marginTop: '20px', textAlign: 'left' }}>
                        <summary style={{ cursor: 'pointer', color: '#888' }}>Technical Details</summary>
                        <pre style={{ 
                            padding: '10px', 
                            background: '#f5f5f5', 
                            borderRadius: '5px',
                            fontSize: '11px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            marginTop: '10px'
                        }}>
                            {this.state.error && this.state.error.toString()}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
