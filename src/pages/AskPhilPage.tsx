
import React from 'react';
import PhilChatAssistant from '@/components/ai/PhilChatAssistant';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, DollarSign, TrendingUp, CreditCard, PiggyBank, Sparkles } from 'lucide-react';

interface TopicCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  question: string;
}

const TOPIC_CARDS: TopicCard[] = [
  {
    icon: <DollarSign className="h-6 w-6 text-green-500" />,
    title: 'Budgeting',
    description: 'Build a spending plan that works for you',
    question: 'How do I create a budget I can actually stick to?',
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
    title: 'Investing',
    description: 'Grow your wealth over time',
    question: 'What are the best investment strategies for beginners?',
  },
  {
    icon: <CreditCard className="h-6 w-6 text-red-500" />,
    title: 'Credit & Debt',
    description: 'Manage and improve your credit score',
    question: 'How can I pay off debt and improve my credit score?',
  },
  {
    icon: <PiggyBank className="h-6 w-6 text-purple-500" />,
    title: 'Saving',
    description: 'Reach your savings goals faster',
    question: 'What are the best tips to save money effectively?',
  },
];

const AskPhilPage: React.FC = () => {
  const chatRef = React.useRef<{ sendMessage: (text: string) => void } | null>(null);

  const handleTopicClick = (question: string) => {
    chatRef.current?.sendMessage(question);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 min-h-[calc(100vh-10rem)]">
      {/* Hero / Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border mb-8 px-6 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-lg">
            <Bot className="h-9 w-9 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-600">Online</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Ask Phil</h1>
          <p className="text-muted-foreground max-w-md text-base">
            Your personal AI finance panda 🐼 — ask me anything about budgeting, investing, credit, or saving money.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Sparkles className="h-3 w-3" />
            <span>Powered by AI • Educational content only</span>
          </div>
        </div>
      </div>

      {/* Topic Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {TOPIC_CARDS.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-200 group"
            onClick={() => handleTopicClick(card.question)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                {card.icon}
              </div>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-xs text-muted-foreground leading-snug">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat */}
      <PhilChatAssistant ref={chatRef} />

      {/* Disclaimer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        ⚠️ Phil provides AI-generated educational content only. This is not professional financial advice.
        Always consult a qualified financial advisor before making important financial decisions.
      </p>
    </div>
  );
};

export default AskPhilPage;
