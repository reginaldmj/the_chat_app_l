import React from 'react';
import { resizeImageFile } from '../utils/images';

const STORAGE_KEY = 'chat_status_updates';

function loadStoredStatusUpdates() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function getFilteredStatusUpdates(statusUpdates, query) {
  const value = query.trim().toLowerCase();
  if (!value) return statusUpdates;

  return statusUpdates.filter((update) => (
    (update.text || '').toLowerCase().includes(value)
    || (update.attachment?.name || '').toLowerCase().includes(value)
    || (update.user?.displayName || '').toLowerCase().includes(value)
    || (update.user?.username || '').toLowerCase().includes(value)
  ));
}

export default function useStatusUpdates(user) {
  // Statuses are browser-local; they are not part of the server-backed conversation data.
  const [statusUpdates, setStatusUpdates] = React.useState(() => loadStoredStatusUpdates());

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statusUpdates));
  }, [statusUpdates]);

  const addStatus = React.useCallback((text, attachment = null) => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || !user) return false;

    setStatusUpdates((current) => [
      {
        id: `${Date.now()}`,
        text: trimmed,
        attachment,
        createdAt: new Date().toISOString(),
        user: {
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl || '',
          color: user.color || '#444',
        },
      },
      ...current,
    ]);

    return true;
  }, [user]);

  const prepareStatusAttachment = React.useCallback(async (file) => {
    if (!file || !file.type?.startsWith('image/')) return null;
    const resized = await resizeImageFile(file, {
      maxEdge: 760,
      maxBytes: 280 * 1024,
      quality: 0.68,
    });
    return {
      name: file.name,
      type: resized.type,
      size: resized.size,
      dataUrl: resized.dataUrl,
    };
  }, []);

  return { statusUpdates, addStatus, prepareStatusAttachment };
}
