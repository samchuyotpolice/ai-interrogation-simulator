import React from 'react';
import { ChatMessage, Theme, ChatMessageSubType } from '@/types'; // Changed to alias
import InterventionIcon from './icons/InterventionIcon';
import HintIconBubble from './icons/HintIconBubble';

interface ChatBubbleProps {
  message: ChatMessage;
  theme: Theme;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // Base styles
  let bubbleClasses = "max-w-xl lg:max-w-2xl px-4 py-3 rounded-xl break-words shadow-lg";
  let containerClasses = "flex mb-4"; // Increased from mb-3 to mb-4
  let timeClasses = "text-xs mt-1.5";
  let SystemIconComponent: React.FC | null = null;

  if (isUser) {
    bubbleClasses += " bg-primary-500 text-white"; // Works for both themes
    containerClasses += " justify-end";
    timeClasses += " text-primary-100 text-left opacity-80";
  } else if (isSystem) {
    containerClasses += " justify-center my-4";
    // Default system message style
    let systemDefaultBg = theme === 'light' ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-secondary-700 text-yellow-300 border-secondary-600";
    let systemDefaultTime = theme === 'light' ? "text-yellow-700" : "text-yellow-400";

    if (message.subType === 'intervention_notification') {
      bubbleClasses += theme === 'light' ? " bg-blue-100 text-blue-800 border-blue-300" : " bg-blue-700 text-blue-100 border-blue-600";
      timeClasses += theme === 'light' ? " text-blue-700 text-center" : " text-blue-300 text-center";
      SystemIconComponent = InterventionIcon;
    } else if (message.subType === 'hint_response') {
      bubbleClasses += theme === 'light' ? " bg-green-100 text-green-800 border-green-300" : " bg-green-700 text-green-100 border-green-600";
      timeClasses += theme === 'light' ? " text-green-700 text-center" : " text-green-300 text-center";
      SystemIconComponent = HintIconBubble;
    } else { // Generic system message
      bubbleClasses += ` ${systemDefaultBg}`;
      timeClasses += ` ${systemDefaultTime} text-center`;
    }
     bubbleClasses += " flex items-start"; // Ensure icon and text align nicely for system messages
  } else { // AI sender
    if (theme === 'light') {
      bubbleClasses += " bg-secondary-200 text-secondary-800 border border-secondary-300";
      timeClasses += " text-secondary-500 text-right opacity-80";
    } else { // dark theme
      bubbleClasses += " bg-secondary-700 text-secondary-100 border border-secondary-600";
      timeClasses += " text-secondary-400 text-right opacity-80";
    }
    containerClasses += " justify-start";
  }

  const messageTextContent = (
    <div className="flex-grow">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p> {/* Added leading-relaxed for line-height */}
      {!isSystem && (
          <p className={timeClasses}>
          {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </p>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      <div
        className={bubbleClasses}
        role={isSystem ? "status" : undefined}
        aria-live={isSystem ? "polite" : undefined}
      >
        {isSystem && SystemIconComponent && <SystemIconComponent />}
        {messageTextContent}
      </div>
    </div>
  );
};

export default ChatBubble;
