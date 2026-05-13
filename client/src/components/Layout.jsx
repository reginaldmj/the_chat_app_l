import React from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationModal from './ConversationModal.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Layout({
  children,
  user,
  searchQuery,
  setSearchQuery,
  menuOpen,
  setMenuOpen,
  members,
  conversations,
  showModal,
  setShowModal,
  modalSearch,
  setModalSearch,
  modalSelected,
  setModalSelected,
  modalGroupName,
  setModalGroupName,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = React.useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleOpenModal = React.useCallback(async () => {
    setShowModal(true);
    setModalSearch('');
    setModalSelected([]);
    setModalGroupName('');
    await conversations.openConversationModal(members?.members || []);
  }, [conversations, members, setModalGroupName, setModalSearch, setModalSelected, setShowModal]);

  const handleCloseModal = React.useCallback(() => {
    setShowModal(false);
    setModalSearch('');
    setModalSelected([]);
    setModalGroupName('');
  }, [setModalGroupName, setModalSearch, setModalSelected, setShowModal]);

  const handleCreateConversation = React.useCallback(async () => {
    if (modalSelected.length === 0) return;
    const isGroup = modalSelected.length > 1;
    await conversations.createConversation({
      participantIds: modalSelected,
      name: isGroup ? (modalGroupName.trim() || 'New Group') : undefined,
      isGroup,
    });
    handleCloseModal();
  }, [conversations, handleCloseModal, modalGroupName, modalSelected]);

  return (
    <div className="app">
      <Sidebar
        user={user}
        conversations={conversations.conversations}
        conversationsLoading={conversations.conversationsLoading}
        activeConvId={conversations.activeConvId}
        onSelectConversation={conversations.selectConversation}
        onOpenModal={handleOpenModal}
      />
      <section className="app-shell">
        <TopBar
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onLogout={handleLogout}
        />
        <main className="app-page">
          {children}
        </main>
      </section>
      <ConversationModal
        open={showModal}
        modalUsers={conversations.modalUsers}
        modalLoading={conversations.modalLoading}
        modalError={conversations.modalError}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        modalSelected={modalSelected}
        setModalSelected={setModalSelected}
        modalGroupName={modalGroupName}
        setModalGroupName={setModalGroupName}
        onClose={handleCloseModal}
        onCreate={handleCreateConversation}
      />
    </div>
  );
}
