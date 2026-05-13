import React from 'react';

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentCard({ attachment, onRemove }) {
  if (!attachment) return null;

  const isImage = attachment?.type?.startsWith('image/');

  return (
    <div className={`attachment-card${isImage ? ' image' : ''}`}>
      {isImage ? (
        <>
          <img src={attachment.dataUrl} alt="Uploaded image" className="attachment-preview" />
          {onRemove ? (
            <button className="attachment-remove image-remove" type="button" onClick={onRemove} aria-label="Remove image">
              Remove
            </button>
          ) : null}
        </>
      ) : (
        <div className="attachment-copy">
          <div>
            <strong>{attachment.name}</strong>
            <span>{formatFileSize(attachment.size)}</span>
          </div>
          {onRemove ? (
            <button className="attachment-remove" type="button" onClick={onRemove} aria-label={`Remove ${attachment.name}`}>
              Remove
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
