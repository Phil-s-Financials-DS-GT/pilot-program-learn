import React from 'react';
import EmpireCanvas from '@/components/empire/EmpireCanvas';

const EmpirePage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-b from-emerald-900/20 to-emerald-950/40">
      <EmpireCanvas />
    </div>
  );
};

export default EmpirePage;
