import React from 'react';

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentCard({ attachment, onRemove }) {
  const isImage = attachment?.type?.startsWith('image/');

  return (
    <div className={`attachment-card${isImage ? ' image' : ''}`}>
      {isImage ? <img src={attachment.dataUrl} alt={attachment.name} className="attachment-preview" /> : null}
      <div className="attachment-copy">
        <div>
          <strong>{attachment.name}</strong>
          <span>{formatFileSize(attachment.size)}</span>
          <a href={attachment.dataUrl} download={attachment.name}>Download</a>
        </div>
        {onRemove ? (
          <button className="attachment-remove" type="button" onClick={onRemove} aria-label={`Remove ${attachment.name}`}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
