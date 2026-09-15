import { Component, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  failed: boolean;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="state-card state-card--error route-error" role="alert">
          <strong>Unable to load this screen</strong>
          <span>The screen code could not be loaded. Check the connection and reload the application.</span>
          <button className="button button--ghost" type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
