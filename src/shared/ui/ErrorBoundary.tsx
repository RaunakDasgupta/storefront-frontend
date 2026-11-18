import { Component, type ErrorInfo, type ReactNode } from "react";

/** Last line of defence: without it, any error while drawing a screen leaves a blank white page. This shows what went wrong instead. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  /** Forgets everything this app saved in the browser, then reloads: the cure for saved data that no longer fits. */
  private reset = () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* storage is refused: nothing to clear */ }
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="load-state" role="alert">
        <h1>Something went wrong</h1>
        <p className="muted">The page could not be shown. Reloading usually fixes it.</p>
        <p className="muted"><code>{error.message || String(error)}</code></p>
        <p>
          <button className="btn primary inline" onClick={() => window.location.reload()}>Reload the page</button>{" "}
          <button className="btn secondary inline" onClick={this.reset}>Clear saved data and start over</button>
        </p>
      </main>
    );
  }
}
