import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for development
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Log to visible UI for debugging in Telegram
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
      const timestamp = new Date().toISOString();
      const errorEntry = document.createElement('div');
      errorEntry.style.cssText =
        'color: #ff4444; margin: 8px 0; padding: 8px; background: rgba(255,0,0,0.1); border-radius: 4px;';
      errorEntry.innerHTML = `<strong>[${timestamp}] Error:</strong> ${error.message}<br/><strong>Stack:</strong><br/>${error.stack || 'No stack trace'}`;
      debugLog.appendChild(errorEntry);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page to retry
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
            color: 'var(--tg-theme-text-color, #000000)',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                marginBottom: '16px',
                color: 'var(--tg-theme-text-color, #000000)',
              }}
            >
              Something went wrong
            </h1>

            <div
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: 'var(--tg-theme-text-color, #000000)',
                }}
              >
                Error:
              </p>
              <p
                style={{
                  marginBottom: '16px',
                  color: 'var(--tg-theme-hint-color, #999999)',
                  fontSize: '14px',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error?.message || 'Unknown error occurred'}
              </p>

              {this.state.errorInfo && (
                <>
                  <p
                    style={{
                      marginBottom: '8px',
                      fontWeight: 'bold',
                      color: 'var(--tg-theme-text-color, #000000)',
                    }}
                  >
                    Component Stack:
                  </p>
                  <pre
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      color: 'var(--tg-theme-hint-color, #999999)',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}

              {this.state.error?.stack && (
                <>
                  <p
                    style={{
                      marginBottom: '8px',
                      marginTop: '16px',
                      fontWeight: 'bold',
                      color: 'var(--tg-theme-text-color, #000000)',
                    }}
                  >
                    Stack Trace:
                  </p>
                  <pre
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      color: 'var(--tg-theme-hint-color, #999999)',
                    }}
                  >
                    {this.state.error.stack}
                  </pre>
                </>
              )}
            </div>

            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                color: 'var(--tg-theme-button-text-color, #ffffff)',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
