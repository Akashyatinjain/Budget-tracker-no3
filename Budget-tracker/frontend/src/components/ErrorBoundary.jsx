import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)] text-[var(--card-fg)]">
          <div className="text-center p-8 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-2xl">
            <h2 className="text-2xl text-purple-400 mb-4">Something went wrong</h2>
            <p className="text-[var(--card-fg)]/70 mb-6">An unexpected error occurred. Please try again.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;