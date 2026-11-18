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
      <main className="px-4 py-14 text-center" role="alert">
        <h1 className="mb-2 text-[27px] leading-tight font-bold">Something went wrong</h1>
        <p className="text-muted">The page could not be shown. Reloading usually fixes it.</p>
        <p className="my-2 text-muted"><code>{error.message || String(error)}</code></p>
        <p className="mt-4 flex flex-wrap justify-center gap-2">
          <button className="btn btn-primary btn-inline" onClick={() => window.location.reload()}>Reload the page</button>
          <button className="btn btn-secondary btn-inline" onClick={this.reset}>Clear saved data and start over</button>
        </p>
      </main>
    );
  }
}
