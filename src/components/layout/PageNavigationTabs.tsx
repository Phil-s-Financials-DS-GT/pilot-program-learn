import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, MessageCircle } from 'lucide-react';

const PageNavigationTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getCurrentTab = () => {
    if (location.pathname === '/learn') return 'learn';
    if (location.pathname === '/empire') return 'empire';
    if (location.pathname === '/ask-phil') return 'ask-phil';
    return 'home';
  };
  
  const currentTab = getCurrentTab();
  
  const handleTabChange = (value: string) => {
    if (value === 'home') {
      navigate('/');
    } else if (value === 'empire') {
      navigate('/empire');
    } else if (value === 'learn') {
      navigate('/learn');
    } else if (value === 'ask-phil') {
      navigate('/ask-phil');
    }
  };
  
  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-4">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="h-12 w-full md:w-auto bg-transparent border-0">
            <TabsTrigger 
              value="home" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="empire" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              <Crown className="h-4 w-4 mr-2" />
              Empire
            </TabsTrigger>
            <TabsTrigger 
              value="learn" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              Learn
            </TabsTrigger>
            <TabsTrigger 
              value="ask-phil" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Phil
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default PageNavigationTabs;
