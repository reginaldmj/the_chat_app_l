import React from 'react';

export function initials(name = '') {
  const safeName = typeof name === 'string' ? name.trim() : '';
  return safeName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ avatarUrl, name, className = '', style }) {
  // Prefer real uploaded images, but fall back to initials for every user.
  if (avatarUrl) {
    return <img className={className || 'avatar-image'} src={avatarUrl} alt={name || 'Avatar'} style={style} />;
  }

  return <>{initials(name)}</>;
}