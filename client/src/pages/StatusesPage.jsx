import React from 'react';
import AttachmentCard from '../components/AttachmentCard.jsx';
import Avatar from '../components/Avatar.jsx';
import { formatStatusTime } from '../components/format.js';
import { getFilteredStatusUpdates } from '../hooks/useStatusUpdates.jsx';

export default function StatusesPage({ searchQuery, statuses }) {
  // The Statuses page reuses the same local feed as Home, but without the composer.
  const filteredUpdates = React.useMemo(
    () => getFilteredStatusUpdates(statuses.statusUpdates, searchQuery),
    [searchQuery, statuses.statusUpdates],
  );

  return (
    <section className="home-page">
      <h1>All statuses</h1>
      <p>{filteredUpdates.length} post{filteredUpdates.length === 1 ? '' : 's'} in your team.</p>

      {filteredUpdates.length === 0 ? (
        <div className="status-empty">
          <p>{searchQuery.trim() ? 'No status updates match your search.' : 'No status updates yet.'}</p>
        </div>
      ) : (
        <section className="status-feed">
          {filteredUpdates.map((update) => (
            <article key={update.id} className="status-post">
              <div className="status-post-head">
                <div className="status-avatar" style={{ background: update.user?.color || '#444' }}>
                  <Avatar avatarUrl={update.user?.avatarUrl} name={update.user?.displayName || update.user?.username} className="avatar-image" />
                </div>
                <div>
                  <strong>{update.user?.displayName || 'Unknown'}</strong>
                  <p>@{update.user?.username || 'unknown'} | {formatStatusTime(update.createdAt)}</p>
                </div>
              </div>
              {update.attachment ? <AttachmentCard attachment={update.attachment} /> : null}
              {update.text ? <p className="status-post-copy">{update.text}</p> : null}
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
