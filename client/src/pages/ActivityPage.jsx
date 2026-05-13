import React from 'react';
import AttachmentCard from '../components/AttachmentCard.jsx';
import Avatar from '../components/Avatar.jsx';
import { formatStatusTime } from '../components/format.js';
import { getFilteredStatusUpdates } from '../hooks/useStatusUpdates.jsx';

export default function ActivityPage({
  user,
  searchQuery,
  statuses,
  statusText,
  setStatusText,
  statusAttachment,
  setStatusAttachment,
}) {
  const statusFileInputRef = React.useRef(null);
  // Derive filtered data from state instead of storing a second filtered copy.
  const filteredUpdates = React.useMemo(
    () => getFilteredStatusUpdates(statuses.statusUpdates, searchQuery),
    [searchQuery, statuses.statusUpdates],
  );

  const handleChooseStatusImage = () => {
    statusFileInputRef.current?.click();
  };

  const handleStatusImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const attachment = await statuses.prepareStatusAttachment(file);

    if (attachment) {
      setStatusAttachment(attachment);
    }

    event.target.value = '';
  };

  const handlePostStatus = () => {
    if (statuses.addStatus(statusText, statusAttachment)) {
      setStatusText('');
      setStatusAttachment(null);
    }
  };

  return (
    <section className="home-page">
      <header className="page-heading">
        <h1>Home</h1>
        <span>Home</span>
        <p>Post a status update and keep up with your personal home feed.</p>
      </header>

      <section className="status-card">
        <div className="status-card-head">
          <div className="status-avatar" style={{ background: user.color || '#444' }}>
            <Avatar avatarUrl={user.avatarUrl} name={user.displayName || user.username} className="avatar-image" />
          </div>
          <div>
            <div className="status-title">{user.displayName || user.username}</div>
            <div className="status-subtitle">Share a quick update with your team.</div>
          </div>
        </div>

        <textarea
          className="status-input"
          value={statusText}
          onChange={(event) => setStatusText(event.target.value)}
          placeholder="What would you like to share?"
        />

        <div className="status-upload-area">
          <input
            ref={statusFileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleStatusImageChange}
          />

          {statusAttachment ? (
            <AttachmentCard
              attachment={statusAttachment}
              onRemove={() => setStatusAttachment(null)}
            />
          ) : (
            <button className="image-upload-zone" type="button" onClick={handleChooseStatusImage}>
              Upload image
            </button>
          )}
        </div>

        <div className="status-actions">
          <span>{filteredUpdates.length} post{filteredUpdates.length === 1 ? '' : 's'}</span>
          <button
            className="profile-save-btn"
            type="button"
            disabled={!statusText.trim() && !statusAttachment}
            onClick={handlePostStatus}
          >
            Post
          </button>
        </div>
      </section>

      <header className="feed-heading">
        <h2>Latest updates</h2>
        <p>Recent status posts from your team.</p>
      </header>

      <section className="status-feed">
        {filteredUpdates.length === 0 ? (
          <div className="status-empty">
            <p>{searchQuery.trim() ? 'No status updates match your search.' : 'No status updates yet.'}</p>
          </div>
        ) : filteredUpdates.map((update) => (
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
    </section>
  );
}
