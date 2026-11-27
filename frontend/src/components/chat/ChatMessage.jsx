import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const senderId = message?.sender?._id || message?.sender?.id || message?.sender;
  const isOwnMessage = Boolean(
    currentUserId && senderId && senderId.toString() === currentUserId.toString()
  );
  const senderName = message?.sender?.name || (isOwnMessage ? user?.name : 'Unknown') || 'Unknown';
  const createdAtDate = message?.createdAt ? new Date(message.createdAt) : null;
  const formattedTime =
    createdAtDate && !Number.isNaN(createdAtDate.getTime())
      ? formatDistanceToNow(createdAtDate, { addSuffix: true })
      : '';

  const renderMessageContent = () => {
    if (message.messageType === 'image') {
      return (
        <div>
          <img 
            src={message.fileUrl} 
            alt="Shared content" 
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.content && (
            <p className="mt-2 text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file') {
      return (
        <div className="flex items-center gap-2 p-2 bg-surface rounded-lg">
          <span className="text-lg">📎</span>
          <div>
            <p className="text-sm font-medium">File attached</p>
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary-900 hover:underline"
            >
              View file
            </a>
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary-600 text-white'
              : 'bg-hairline-soft text-ink'
          }`}
        >
          {renderMessageContent()}
        </div>
        <div className={`flex items-center gap-2 mt-1 text-xs text-secondary-500 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          <span>{senderName}</span>
          {formattedTime && (
            <>
              <span>•</span>
              <span>{formattedTime}</span>
            </>
          )}
          {isOwnMessage && (
            <>
              <span>•</span>
              <span>{message.isRead ? '✓✓' : '✓'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
