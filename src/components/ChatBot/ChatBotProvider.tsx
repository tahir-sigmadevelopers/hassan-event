import React, { createContext, useState, useContext, ReactNode } from 'react';
import ChatBot from './ChatBot';

interface ChatBotContextType {
  addContextualQuestion: (question: string) => void;
  notifyNewUser: () => void;
  notifyRegistrationComplete: (eventName: string) => void;
}

const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

interface ChatBotProviderProps {
  children: ReactNode;
}

export const ChatBotProvider: React.FC<ChatBotProviderProps> = ({ children }) => {
  const [triggerContextQuestion, setTriggerContextQuestion] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<boolean>(false);
  const [registrationComplete, setRegistrationComplete] = useState<{complete: boolean, eventName: string}>({
    complete: false,
    eventName: ''
  });

  const addContextualQuestion = (question: string) => {
    setTriggerContextQuestion(question);
    // Reset after a delay to prevent multiple triggers
    setTimeout(() => {
      setTriggerContextQuestion(null);
    }, 500);
  };

  const notifyNewUser = () => {
    setNewUser(true);
    // Reset after a delay
    setTimeout(() => {
      setNewUser(false);
    }, 500);
  };

  const notifyRegistrationComplete = (eventName: string) => {
    setRegistrationComplete({
      complete: true,
      eventName
    });
    // Reset after a delay
    setTimeout(() => {
      setRegistrationComplete({
        complete: false,
        eventName: ''
      });
    }, 500);
  };

  return (
    <ChatBotContext.Provider 
      value={{ 
        addContextualQuestion, 
        notifyNewUser, 
        notifyRegistrationComplete 
      }}
    >
      {children}
      <ChatBot 
        contextualQuestion={triggerContextQuestion} 
        isNewUser={newUser}
        registrationComplete={registrationComplete}
      />
    </ChatBotContext.Provider>
  );
};

// Custom hook to use the ChatBot context
export const useChatBot = (): ChatBotContextType => {
  const context = useContext(ChatBotContext);
  if (context === undefined) {
    throw new Error('useChatBot must be used within a ChatBotProvider');
  }
  return context;
};

export default ChatBotProvider; 