export function formatStatusTime(iso) {
  const date = new Date(iso);

  // Keep status timestamps short enough to scan in the feed.
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}