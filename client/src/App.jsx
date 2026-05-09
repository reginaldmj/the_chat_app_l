import React from 'react';

export default function App() {
  // This state starts visible so the page is never blank while fetch runs.
  const [health, setHealth] = React.useState('checking...');

  React.useEffect(() => {
    // Fetch through Vite's /api proxy instead of calling localhost:3001 directly.
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth('offline'));
  }, []);

  return (
    <main className="checkpoint-screen">
      <section className="checkpoint-card">
        <h1>chat</h1>
        <p>API status: {health}</p>
      </section>
    </main>
  );
}
