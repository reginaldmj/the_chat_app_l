import React from 'react';

export default function ConversationModal({
  open,
  modalUsers,
  modalLoading,
  modalSearch,
  setModalSearch,
  modalSelected,
  setModalSelected,
  modalGroupName,
  setModalGroupName,
  onClose,
  onCreate,
}) {
  // Filter in memory because the modal user list is small in this demo.
  const filteredUsers = React.useMemo(() => {
    const query = modalSearch.trim().toLowerCase();
    return modalUsers.filter((user) => {
      if (!query) return true;
      return (user.displayName || '').toLowerCase().includes(query)
        || (user.username || '').toLowerCase().includes(query);
    });
  }, [modalSearch, modalUsers]);

  // Returning null keeps the modal out of the DOM when closed.
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Conversation</h2>
          <button type="button" onClick={onClose}>x</button>
        </div>

        <div className="modal-search">
          <input value={modalSearch} onChange={(event) => setModalSearch(event.target.value)} placeholder="Search by name..." autoFocus />
        </div>

        {modalSelected.length > 1 ? (
          <div className="modal-group-name">
            <input value={modalGroupName} onChange={(event) => setModalGroupName(event.target.value)} placeholder="Group name (optional)" />
          </div>
        ) : null}

        <div className="modal-user-list">
          {modalLoading ? <div><span className="mini-spinner"></span></div> : null}
          {filteredUsers.map((user) => {
            const selected = modalSelected.includes(user.id);
            return (
              <button
                key={user.id}
                className={`modal-user-item${selected ? ' selected' : ''}`}
                type="button"
                onClick={() => setModalSelected((current) => (
                  current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id]
                ))}
              >
                <span>{user.displayName || user.username}</span>
                <span>{selected ? 'selected' : user.role || 'Member'}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" disabled={modalSelected.length === 0} onClick={onCreate}>
            {modalSelected.length > 1 ? `Create Group (${modalSelected.length})` : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}