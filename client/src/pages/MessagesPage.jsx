import React from 'react';
import Avatar from '../components/Avatar.jsx';
import AttachmentCard from '../components/AttachmentCard.jsx';
import {
  getConversationName,
  getFilteredMessages,
  groupMessages,
} from '../hooks/useConversations.jsx';

export default function MessagesPage({
  user,
  searchQuery,
  conversations,
  messageText,
  setMessageText,
  pendingAttachment,
  setPendingAttachment,
}) {
  const bottomRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const activeConversation = React.useMemo(
    () =>
      conversations.conversations.find(
        (conversation) => conversation.id === conversations.activeConvId,
      ) || null,
    [conversations.activeConvId, conversations.conversations],
  );

  const filteredMessages = React.useMemo(
    () =>
      getFilteredMessages(
        conversations.messagesByConversation[conversations.activeConvId] || [],
        searchQuery,
      ),
    [conversations.activeConvId, conversations.messagesByConversation, searchQuery],
  );

  const groupedMessages = React.useMemo(
    () => groupMessages(filteredMessages),
    [filteredMessages],
  );

  const conversationName = activeConversation
    ? getConversationName(activeConversation, user)
    : '';

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [filteredMessages.length, conversations.sendingMessage]);

  React.useEffect(() => {
    if (conversations.activeConvId) {
      conversations.loadMessages(conversations.activeConvId);
    }
  }, [conversations.activeConvId]);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const attachment = await conversations.prepareAttachment(file);

    if (attachment) {
      setPendingAttachment(attachment);
    }

    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedText = messageText.trim();

    if (!trimmedText && !pendingAttachment) return;

    const success = await conversations.sendMessage(
      conversations.activeConvId,
      trimmedText,
      pendingAttachment,
    );

    if (success) {
      setMessageText('');
      setPendingAttachment(null);
    }
  };

  if (!activeConversation) {
    return (
      <section className="chat-card">
        <div className="chat-header">
          <strong>Messages</strong>
        </div>

        <div
          className="messages"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '18px',
            color: 'var(--text-secondary)',
          }}
        >
          <p>Select a conversation from the sidebar to start chatting.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-card">
      <div className="chat-header">
        <strong>{conversationName}</strong>
      </div>

      <div className="messages">
        {conversations.messagesLoading ? (
          <div>
            <span className="mini-spinner"></span>
          </div>
        ) : null}

        {groupedMessages.length === 0 && !conversations.messagesLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-secondary)',
            }}
          >
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div
              key={`${group.senderId}-${group.messages[0]?.id}`}
              className={`msg-row${group.mine ? ' mine' : ''}`}
            >
              {!group.mine ? (
                <div
                  className="convo-avatar avatar-sm"
                  style={{ background: group.senderColor || '#444' }}
                >
                  <Avatar
                    avatarUrl={group.senderAvatarUrl}
                    name={group.senderName}
                    className="avatar-image"
                  />
                </div>
              ) : null}

              <div className="msg-content">
                {!group.mine && activeConversation.isGroup ? (
                  <div className="msg-sender-name">{group.senderName}</div>
                ) : null}

                {group.messages.map((message, index) => (
                  <div key={message.id}>
                    <div className={`msg-bubble ${group.mine ? 'mine' : 'theirs'}`}>
                      {message.attachment ? (
                        <AttachmentCard attachment={message.attachment} />
                      ) : null}

                      {message.text ? <div>{message.text}</div> : null}
                    </div>

                    {index === group.messages.length - 1 ? (
                      <div className="msg-time">{message.time}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef}></div>
      </div>

      <form className="input-area" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={handleChooseFile}
          aria-label="Upload image"
        >
          Image
        </button>

        <div className="input-column">
          {pendingAttachment ? (
            <AttachmentCard
              attachment={pendingAttachment}
              onRemove={() => setPendingAttachment(null)}
            />
          ) : (
            <button className="message-upload-zone" type="button" onClick={handleChooseFile}>
              Add image
            </button>
          )}

          <input
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder={`Message ${conversationName}...`}
          />
        </div>

        <button
          type="submit"
          disabled={
            (!messageText.trim() && !pendingAttachment) ||
            conversations.sendingMessage
          }
        >
          Send
        </button>
      </form>
    </section>
  );
}
