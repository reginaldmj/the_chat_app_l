import React from 'react';
import Avatar from '../components/Avatar.jsx';

export default function MembersPage({ searchQuery, members }) {
  const filteredMembers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (members.members || []).filter((member) => {
      if (!query) return true;
      return (member.displayName || '').toLowerCase().includes(query)
        || (member.username || '').toLowerCase().includes(query)
        || (member.role || '').toLowerCase().includes(query);
    });
  }, [members.members, searchQuery]);

  if (members.membersLoading) {
    return <div><span className="mini-spinner"></span></div>;
  }

  return (
    <section className="members-page">
      <h1>Members</h1>
      <p>{filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}</p>

      {filteredMembers.length === 0 ? (
        <div className="status-empty">
          <p>{searchQuery.trim() ? 'No members match your search.' : 'No members found.'}</p>
        </div>
      ) : (
        <div className="members-grid">
          {filteredMembers.map((member) => (
            <article key={member.id} className="member-card">
              <div className="member-avatar" style={{ background: member.color || '#444' }}>
                <Avatar avatarUrl={member.avatarUrl} name={member.displayName || member.username} className="avatar-image" />
              </div>
              <div>
                <strong>{member.displayName || member.username || 'Member'}</strong>
                <p>@{member.username || 'unknown'}</p>
                <span>{member.role || 'Member'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}