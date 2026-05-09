// client/src/pages/ProfilePage.jsx
import React from 'react';

export default function ProfilePage({ user }) {
  return <section><h1>{user.displayName || user.username}</h1><p>Profile editing will appear here.</p></section>;
}