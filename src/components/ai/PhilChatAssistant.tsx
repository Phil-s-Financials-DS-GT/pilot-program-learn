
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Lightbulb, TrendingUp, DollarSign, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DOMPurify from 'dompurify';

interface PhilResponse {
  answer: string;
  needs_web: boolean;
  study_next: string[];
  sources: string[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'phil';
  timestamp: Date;
  suggestions?: string[];
  studyNext?: string[];
  sources?: string[];
}

// ---------------------------------------------------------------------------
// Mock session context — replace with real data once the backend is available
// ---------------------------------------------------------------------------
const MOCK_SESSION = {
  sessionId: 'mock-session-abc123',
  completedModules: ['Budgeting 101', 'Intro to Credit', 'Emergency Funds'],
};
// ---------------------------------------------------------------------------

const PhilChatAssistant: React.FC = () => {
  const { profile } = useAuth();
  const userLevel = (profile?.app_version as string) || 'intermediate';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm Phil, your friendly finance panda! 🐼 I'm here to help you learn about investing, budgeting, and all things money. What would you like to know?",
      sender: 'phil',
      timestamp: new Date(),
      suggestions: [
        "What's a stock?",
        "How do I start investing?",
        "Explain compound interest",
        "What's a 401k?"
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Build context string from completed modules
      const moduleContext = `User has completed the following modules: ${MOCK_SESSION.completedModules.join(', ')}.`;

      const payload = {
        message: currentInput,
        userLevel,
        sessionId: MOCK_SESSION.sessionId,
        context: moduleContext,
      };

      console.log('--- AI PAYLOAD ---', payload);

      let philResponse: Message;

      try {
        const { data, error } = await supabase.functions.invoke('AskPhil', {
          body: payload,
        });

        if (error) throw new Error(error.message || 'Failed to get response from Phil');
        if (data?.error) throw new Error(data.error);

        const response = data as PhilResponse;

        philResponse = {
          id: (Date.now() + 1).toString(),
          text: response.answer || 'I apologize, but I could not generate a response.',
          sender: 'phil',
          timestamp: new Date(),
          studyNext: response.study_next || [],
          sources: response.sources || [],
          suggestions: response.study_next?.slice(0, 3) || [
            'Tell me more about this',
            'What should I do next?',
            'Give me an example',
          ],
        };
      } catch (invokeError: any) {
        console.warn('Backend unavailable — using mock response:', invokeError?.message);

        const lastModule = MOCK_SESSION.completedModules[MOCK_SESSION.completedModules.length - 1];
        philResponse = {
          id: (Date.now() + 1).toString(),
          text: `Mock Response: I see you have completed ${lastModule}! Based on your ${userLevel} level, here is your answer...`,
          sender: 'phil',
          timestamp: new Date(),
        };
      }

      setMessages(prev => [...prev, philResponse]);
    } catch (error: any) {
      console.error('Unexpected error in handleSendMessage:', error);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble responding right now. Please try again in a moment! 🐼",
          sender: 'phil',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            Ask Phil - Your Finance Buddy
            <Badge variant="secondary" className="ml-auto">AI Assistant</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: message.sender === 'phil' 
                          ? DOMPurify.sanitize(message.text.replace(/\n/g, '<br />'))
                          : DOMPurify.sanitize(message.text)
                      }}
                    />
                  </div>
                  
                  {/* Study Next suggestions */}
                  {message.studyNext && message.studyNext.length > 0 && (
                    <div className="mt-2 p-2 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1">
                        <BookOpen className="h-3 w-3" />
                        Study Next
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.studyNext.map((item, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(item)}
                            className="text-xs"
                          >
                            {item}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Sources: </span>
                      {message.sources.join(', ')}
                    </div>
                  )}

                  {/* Quick suggestions for initial message */}
                  {message.suggestions && !message.studyNext && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className={`flex-shrink-0 ${message.sender === 'user' ? 'order-1 ml-2' : 'order-2 mr-2'}`}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Phil is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex-shrink-0 flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Phil anything about finance..."
              className="flex-1 resize-none border rounded-lg px-3 py-2 min-h-[44px] max-h-32"
              rows={1}
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSuggestionClick("How do I start budgeting?")}>
          <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">Budgeting Basics</p>
        </Card>
        
        <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSuggestionClick("What are the best investment strategies?")}>
          <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">Investment Tips</p>
        </Card>
        
        <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSuggestionClick("Explain financial terms simply")}>
          <Lightbulb className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">Finance Terms</p>
        </Card>
      </div>
    </div>
  );
};

export default PhilChatAssistant;
