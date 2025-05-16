import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, InputGroup, Badge } from 'react-bootstrap';
import { FaRobot, FaTimes, FaPaperPlane, FaChevronDown, FaCalendarAlt, FaQuestion } from 'react-icons/fa';
import styled from 'styled-components';
import './ChatBot.css';

// Define the message interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Define the props
interface ChatBotProps {
  contextualQuestion: string | null;
  isNewUser: boolean;
  registrationComplete: {
    complete: boolean;
    eventName: string;
  };
}

// Predefined responses for common questions
const botResponses: Record<string, string> = {
  'hi': 'Hello! How can I help you with event management today?',
  'hello': 'Hi there! What information do you need about events?',
  'help': 'I can help you with: \n- Event registration\n- Finding events\n- Creating new events\n- Managing your events\n\nWhat do you need assistance with?',
  'register': 'To register for an event, find the event you want to attend and click on it. If registration is open, you\'ll see a "Register for this Event" button.',
  'create event': 'To create a new event, go to the Calendar page and click on any date. Fill in the event details and save.',
  'delete event': 'You can only delete events you\'ve created. Open your event and look for the Remove button at the bottom of the modal.',
  'edit event': 'To edit an event you\'ve created, find it in the Calendar or Search page, click on it, make your changes, and save.',
  'rating': 'You can rate and review events you\'ve attended. Look for the "Event Rating" tab when viewing an event.',
  'attendees': 'If you\'re an event owner, you can see the list of attendees in the event details.',
  'spots': 'Available spots are shown when viewing an event. Event capacity is set when creating or editing an event.',
  'stats': 'Event owners can view detailed statistics for their events, including registration trends and attendance status.',
  'calendar': 'The Calendar page shows all events in a monthly view. Click on a date to create a new event or click on an existing event to view details.',
  'search': 'The Search Events page allows you to find events by title. You can also filter by active or expired events.',
  'share': 'You can share an event by copying the event URL from the address bar when viewing the event details.',
  'contact': 'You can contact event organizers through the contact information provided in the event details.',
};

// Quick suggestions to offer users
const quickSuggestions = [
  { text: 'How do I register?', value: 'register' },
  { text: 'Create an event', value: 'create event' },
  { text: 'Find events', value: 'search' },
  { text: 'View statistics', value: 'stats' },
];

// Default welcome messages
const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I\'m your Event Assistant. How can I help you today?',
    sender: 'bot',
    timestamp: new Date()
  },
  {
    id: '2',
    text: 'You can ask me about event registration, finding events, or creating new events.',
    sender: 'bot',
    timestamp: new Date()
  }
];

const ChatBot: React.FC<ChatBotProps> = ({ 
  contextualQuestion, 
  isNewUser, 
  registrationComplete 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [firstLoad, setFirstLoad] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // If chat is not open and we get a new bot message, increment unread count
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !firstLoad) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen, firstLoad]);

  // Handle contextual questions from external components
  useEffect(() => {
    if (contextualQuestion) {
      handleContextualQuestion(contextualQuestion);
    }
  }, [contextualQuestion]);

  // Handle registration completion notification
  useEffect(() => {
    if (registrationComplete.complete) {
      const message = `Congratulations! You've successfully registered for "${registrationComplete.eventName}". You'll receive a confirmation email shortly.`;
      addBotMessage(message);
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  }, [registrationComplete]);

  // Handle new user notification
  useEffect(() => {
    if (isNewUser) {
      const welcomeMessage = "Welcome to the Event Management System! Would you like a quick tour of the features?";
      addBotMessage(welcomeMessage);
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  }, [isNewUser]);

  useEffect(() => {
    // Clear first load flag after initial render
    if (firstLoad) {
      setFirstLoad(false);
    }
  }, []);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const toggleChatBot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  };

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = (text: string) => {
    // Show typing indicator
    setIsTyping(true);
    
    // Add message after a delay to simulate typing
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'bot');
    }, 1000);
  };

  const getBotResponse = (message: string) => {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for exact matches first
    if (botResponses[normalizedMessage]) {
      return botResponses[normalizedMessage];
    }
    
    // Check for partial matches
    for (const key of Object.keys(botResponses)) {
      if (normalizedMessage.includes(key)) {
        return botResponses[key];
      }
    }
    
    // Default response if no match found
    return "I'm not sure how to help with that. You can ask about event registration, finding events, or creating new events.";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    // Add user message
    addMessage(currentMessage, 'user');
    
    // Get bot response
    const botResponse = getBotResponse(currentMessage);
    addBotMessage(botResponse);
    
    setCurrentMessage('');
  };

  const handleContextualQuestion = (question: string) => {
    // Only process if chat is open or if it's a high-priority message
    const botResponse = getBotResponse(question);
    addBotMessage(botResponse);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Add user message with the suggestion
    addMessage(suggestion, 'user');
    
    // Get bot response
    const botResponse = getBotResponse(suggestion);
    addBotMessage(botResponse);
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <ChatWindow isMinimized={isMinimized}>
          <ChatHeader>
            <div className="d-flex align-items-center">
              <FaRobot className="me-2" />
              <span>Event Assistant</span>
            </div>
            <div>
              <Button variant="link" onClick={toggleMinimize} className="p-0 text-white">
                <FaChevronDown />
              </Button>
              <Button variant="link" onClick={toggleChatBot} className="p-0 ms-2 text-white">
                <FaTimes />
              </Button>
            </div>
          </ChatHeader>
          
          {!isMinimized && (
            <>
              <ChatBody className="chatbot-body">
                {messages.map(message => (
                  <MessageContainer key={message.id} className={`message ${message.sender}`}>
                    <div className="message-content">{message.text}</div>
                    <div className="message-timestamp">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </MessageContainer>
                ))}
                
                {isTyping && (
                  <MessageContainer className="message bot">
                    <div className="message-content typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </MessageContainer>
                )}
                
                <div ref={messagesEndRef} />
              </ChatBody>
              
              <SuggestionContainer>
                {quickSuggestions.map((suggestion, index) => (
                  <Button 
                    key={index}
                    variant="outline-primary" 
                    size="sm"
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion.value)}
                  >
                    {suggestion.text}
                  </Button>
                ))}
              </SuggestionContainer>
              
              <ChatFooter>
                <Form onSubmit={handleSendMessage}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type your message..."
                      value={currentMessage}
                      onChange={handleInputChange}
                    />
                    <Button variant="primary" type="submit">
                      <FaPaperPlane />
                    </Button>
                  </InputGroup>
                </Form>
              </ChatFooter>
            </>
          )}
        </ChatWindow>
      )}
      
      <div className="chat-button-container">
        <Button 
          onClick={toggleChatBot}
          className={unreadCount > 0 ? 'chat-button pulse' : 'chat-button'}
        >
          <FaRobot />
        </Button>
        
        {unreadCount > 0 && (
          <Badge 
            pill 
            bg="danger" 
            className="notification-badge"
          >
            {unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
};

// Styled components with explicit types
const ChatWindow = styled(Card)<{ isMinimized: boolean }>`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 350px;
  height: ${props => props.isMinimized ? 'auto' : '500px'};
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  overflow: hidden;
  transition: height 0.3s ease;
`;

const ChatHeader = styled(Card.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
`;

const ChatBody = styled(Card.Body)`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
`;

const ChatFooter = styled.div`
  padding: 10px;
  border-top: 1px solid #dee2e6;
  background-color: white;
`;

const SuggestionContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  margin-bottom: 10px;
  
  &.user {
    align-self: flex-end;
    
    .message-content {
      background-color: #007bff;
      color: white;
      border-radius: 15px 15px 0 15px;
    }
  }
  
  &.bot {
    align-self: flex-start;
    
    .message-content {
      background-color: #e9ecef;
      color: #212529;
      border-radius: 15px 15px 15px 0;
    }
  }
  
  .message-content {
    padding: 10px 15px;
    white-space: pre-line;
  }
  
  .message-timestamp {
    font-size: 0.75rem;
    color: #6c757d;
    align-self: flex-end;
    margin-top: 2px;
  }
`;

export default ChatBot; 