import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Pulse crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", background: "#0D0F17", color: "#fff", minHeight: "100vh" }}>
          <h2>⚠️ Pulse encontró un error</h2>
          <p style={{ color: "#FF3B6B", fontWeight: "bold" }}>{String(this.state.error.message || this.state.error)}</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7, marginTop: 16 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
