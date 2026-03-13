import React from 'react';
import { BuildingType, BuildingStatus, BUILDING_DEFINITIONS } from './BuildingTypes';
import { gridToScreen } from '../lib/grid';
import { isBuildingCollectionReady } from '../systems/economy';

interface BuildingSpriteProps {
  type: BuildingType;
  level: number;
  status: BuildingStatus;
  gridX: number;
  gridY: number;
  constructionProgress?: number;
  pendingCollection?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const BuildingSprite: React.FC<BuildingSpriteProps> = ({
  type,
  level,
  status,
  gridX,
  gridY,
  constructionProgress = 100,
  pendingCollection = 0,
  isSelected = false,
  onClick,
}) => {
  const def = BUILDING_DEFINITIONS[type];
  if (!def) return null;
  const { screenX: finalX, screenY: finalY } = gridToScreen(gridX, gridY);
  
  const renderBuilding = () => {
    switch (type) {
      case 'bamboo_farm': return <BambooFarmSprite level={level} />;
      case 'storage': return <StorageSprite level={level} />;
      case 'bank': return <BankSprite level={level} />;
      case 'market_stall': return <MarketStallSprite level={level} />;
      case 'insurance_hut': return <InsuranceHutSprite level={level} />;
      case 'training_dojo': return <TrainingDojoSprite level={level} />;
      case 'trading_post': return <TradingPostSprite level={level} />;
      case 'panda_house': return <PandaHouseSprite level={level} />;
      default: return null;
    }
  };
  
  return (
    <g
      transform={`translate(${finalX}, ${finalY})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <ellipse
        cx={0}
        cy={0}
        rx={def.size.width * 20}
        ry={def.size.height * 8}
        fill="rgba(0,0,0,0.2)"
      />
      
      {status === 'constructing' && (
        <g>
          {renderBuilding()}
          <rect
            x={-30}
            y={-60}
            width={60}
            height={80}
            fill="rgba(139, 92, 46, 0.3)"
            stroke="#8B5C2E"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
          <rect x={-25} y={-70} width={50} height={8} fill="#374151" rx={4} />
          <rect
            x={-25}
            y={-70}
            width={50 * (constructionProgress / 100)}
            height={8}
            fill="#22c55e"
            rx={4}
          />
          <PandaWorker x={25} y={0} />
        </g>
      )}
      
      {status === 'active' && (
        <g>
          {renderBuilding()}
          
          {isBuildingCollectionReady(type, pendingCollection) && (
            <g>
              <circle cx={20} cy={-50} r={15} fill="#fbbf24" />
              <text x={20} y={-46} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#78350f">
                {Math.round(pendingCollection) > 99 ? '99+' : Math.round(pendingCollection)}
              </text>
            </g>
          )}
          
          <g transform="translate(-25, -55)">
            <circle r={10} fill="#6366f1" />
            <text textAnchor="middle" dy={4} fontSize={10} fontWeight="bold" fill="white">
              {level}
            </text>
          </g>
        </g>
      )}
      
      {isSelected && (
        <ellipse
          cx={0}
          cy={0}
          rx={def.size.width * 25}
          ry={def.size.height * 12}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={3}
          opacity={0.8}
        />
      )}
    </g>
  );
};

const BambooFarmSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-44,0 0,-18 44,0 0,22" fill="#8b5a24" stroke="#6f4317" strokeWidth={1.5} />
    <polygon points="-36,-4 0,-18 36,-4 0,12" fill="#a8692e" opacity={0.35} />
    <rect x={-34} y={-22} width={5} height={22} fill="#8b5a24" />
    <rect x={29} y={-22} width={5} height={22} fill="#8b5a24" />
    <line x1={-31} y1={-11} x2={31} y2={-11} stroke="#c58d36" strokeWidth={3} />
    <line x1={-31} y1={-1} x2={31} y2={-1} stroke="#c58d36" strokeWidth={3} />
    {[...Array(Math.min(level + 2, 6))].map((_, i) => (
      <g key={i} transform={`translate(${-24 + i * 10}, ${-4})`}>
        <line x1={0} y1={0} x2={0} y2={-26 - level * 3} stroke="#0f766e" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={-3} cy={-27 - level * 3} rx={5} ry={3} fill="#10b981" />
        <ellipse cx={4} cy={-23 - level * 3} rx={4.5} ry={2.75} fill="#34d399" />
      </g>
    ))}
    <g transform="translate(0, -16)">
      <rect x={-14} y={-2} width={28} height={20} fill="#8b5a24" stroke="#6f4317" strokeWidth={1} />
      <polygon points="-18,-4 0,-14 18,-4 0,6" fill="#059669" stroke="#047857" strokeWidth={1} />
      <rect x={-5} y={6} width={10} height={10} fill="#6f4317" />
      <rect x={-10} y={2} width={6} height={5} fill="#fef3c7" opacity={0.9} />
      <rect x={4} y={2} width={6} height={5} fill="#fef3c7" opacity={0.9} />
    </g>
  </g>
);

const StorageSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-25,8 0,-5 25,8 0,20" fill="#78350f" stroke="#451a03" strokeWidth={1} />
    <rect x={-20} y={-35} width={40} height={40} fill="#a16207" stroke="#78350f" strokeWidth={2} />
    <polygon points="-25,-35 0,-50 25,-35" fill="#059669" stroke="#047857" strokeWidth={1} />
    <rect x={-8} y={-15} width={16} height={20} fill="#78350f" />
    <circle cx={5} cy={-5} r={2} fill="#fbbf24" />
    <rect x={-18} y={-30} width={8} height={8} fill="#fef3c7" />
    <rect x={10} y={-30} width={8} height={8} fill="#fef3c7" />
    {level >= 2 && (
      <g>
        <circle cx={-14} cy={-26} r={3} fill="#fbbf24" />
        <circle cx={14} cy={-26} r={3} fill="#fbbf24" />
      </g>
    )}
  </g>
);

const BankSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-45,15 0,-10 45,15 0,40" fill="#78350f" stroke="#451a03" strokeWidth={1} />
    <rect x={-35} y={-50} width={70} height={60} fill="#fef3c7" stroke="#a16207" strokeWidth={2} />
    <polygon points="-45,-50 0,-65 45,-50" fill="#059669" stroke="#047857" strokeWidth={1} />
    <polygon points="-35,-65 0,-78 35,-65" fill="#10b981" stroke="#059669" strokeWidth={1} />
    {level >= 3 && <polygon points="-25,-78 0,-88 25,-78" fill="#34d399" stroke="#10b981" strokeWidth={1} />}
    <rect x={-30} y={-45} width={6} height={50} fill="#dc2626" />
    <rect x={24} y={-45} width={6} height={50} fill="#dc2626" />
    <rect x={-12} y={-25} width={24} height={30} fill="#78350f" />
    <polygon points="-15,-25 0,-35 15,-25" fill="#059669" />
    <circle cx={0} cy={-72} r={5} fill="#fbbf24" />
    {level >= 2 && (
      <>
        <circle cx={-20} cy={-55} r={3} fill="#fbbf24" />
        <circle cx={20} cy={-55} r={3} fill="#fbbf24" />
      </>
    )}
    <ellipse cx={0} cy={0} rx={40} ry={20} fill="url(#goldGlow)" opacity={0.3} />
  </g>
);

const MarketStallSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-25,8 0,-5 25,8 0,20" fill="#78350f" stroke="#451a03" strokeWidth={1} />
    <rect x={-20} y={-25} width={40} height={30} fill="#a16207" stroke="#78350f" strokeWidth={1} />
    <polygon points="-25,-25 0,-40 25,-25" fill="#dc2626" stroke="#b91c1c" strokeWidth={1} />
    <polygon points="-22,-25 0,-38 22,-25" fill="#ef4444" opacity={0.5} />
    <rect x={-18} y={-20} width={36} height={5} fill="#78350f" />
    {[...Array(Math.min(level + 1, 4))].map((_, i) => (
      <g key={i}>
        <circle cx={-12 + i * 8} cy={-12} r={4} fill={['#fbbf24', '#22c55e', '#3b82f6', '#a855f7'][i]} />
      </g>
    ))}
    <rect x={-15} y={-5} width={30} height={10} fill="#fef3c7" stroke="#a16207" strokeWidth={1} />
    <text x={0} y={2} textAnchor="middle" fontSize={6} fill="#78350f" fontWeight="bold">MARKET</text>
  </g>
);

const InsuranceHutSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-25,8 0,-5 25,8 0,20" fill="#1e3a5f" stroke="#0f172a" strokeWidth={1} />
    <rect x={-18} y={-30} width={36} height={35} fill="#3b82f6" stroke="#1e40af" strokeWidth={2} />
    <polygon points="-22,-30 0,-45 22,-30" fill="#1e40af" stroke="#1e3a8a" strokeWidth={1} />
    <rect x={-6} y={-12} width={12} height={17} fill="#1e3a8a" />
    <circle cx={0} cy={-5} r={2} fill="#fbbf24" />
    <g transform="translate(0, -38)">
      <circle r={8} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
      <path d="M-3,-3 L0,3 L3,-3 Z" fill="#1e40af" />
      <rect x={-1} y={-5} width={2} height={4} fill="#1e40af" />
    </g>
    {level >= 2 && (
      <>
        <rect x={-16} y={-25} width={6} height={6} fill="#93c5fd" />
        <rect x={10} y={-25} width={6} height={6} fill="#93c5fd" />
      </>
    )}
  </g>
);

const TrainingDojoSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-45,15 0,-10 45,15 0,40" fill="#78350f" stroke="#451a03" strokeWidth={1} />
    <rect x={-35} y={-40} width={70} height={50} fill="#fef3c7" stroke="#a16207" strokeWidth={2} />
    <polygon points="-40,-40 0,-60 40,-40" fill="#1f2937" stroke="#111827" strokeWidth={1} />
    <polygon points="-35,-40 0,-57 35,-40" fill="#374151" />
    <rect x={-10} y={-20} width={20} height={25} fill="#78350f" />
    <rect x={-30} y={-35} width={8} height={30} fill="#dc2626" />
    <rect x={22} y={-35} width={8} height={30} fill="#dc2626" />
    <circle cx={0} cy={-52} r={4} fill="#fbbf24" />
    {level >= 2 && (
      <g transform="translate(-20, -15)">
        <ellipse cx={0} cy={0} rx={5} ry={6} fill="white" />
        <circle cx={0} cy={-7} r={4} fill="white" />
        <circle cx={-3} cy={-10} r={2} fill="#1f2937" />
        <circle cx={3} cy={-10} r={2} fill="#1f2937" />
      </g>
    )}
    {level >= 3 && (
      <g transform="translate(20, -15)">
        <ellipse cx={0} cy={0} rx={5} ry={6} fill="white" />
        <circle cx={0} cy={-7} r={4} fill="white" />
        <circle cx={-3} cy={-10} r={2} fill="#1f2937" />
        <circle cx={3} cy={-10} r={2} fill="#1f2937" />
      </g>
    )}
  </g>
);

const TradingPostSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-35,10 0,-8 35,10 0,28" fill="#78350f" stroke="#451a03" strokeWidth={1} />
    <rect x={-30} y={-35} width={60} height={42} fill="#d97706" stroke="#92400e" strokeWidth={2} />
    <polygon points="-35,-35 0,-50 35,-35" fill="#059669" stroke="#047857" strokeWidth={1} />
    <rect x={-25} y={-30} width={20} height={25} fill="#fef3c7" stroke="#a16207" strokeWidth={1} />
    <rect x={5} y={-30} width={20} height={25} fill="#fef3c7" stroke="#a16207" strokeWidth={1} />
    <line x1={-15} y1={-25} x2={-15} y2={-10} stroke="#a16207" strokeWidth={1} />
    <line x1={15} y1={-25} x2={15} y2={-10} stroke="#a16207" strokeWidth={1} />
    {[...Array(Math.min(level, 3))].map((_, i) => (
      <circle key={i} cx={-15 + i * 15} cy={-42} r={3} fill="#fbbf24" />
    ))}
    <g transform="translate(0, -8)">
      <rect x={-8} y={0} width={16} height={12} fill="#78350f" />
      <rect x={-6} y={2} width={5} height={8} fill="#451a03" />
      <rect x={1} y={2} width={5} height={8} fill="#451a03" />
    </g>
  </g>
);

const PandaHouseSprite: React.FC<{ level: number }> = ({ level }) => (
  <g>
    <polygon points="-45,15 0,-10 45,15 0,40" fill="#059669" stroke="#047857" strokeWidth={1} />
    <ellipse cx={0} cy={-20} rx={35} ry={25} fill="#fef3c7" stroke="#a16207" strokeWidth={2} />
    <ellipse cx={0} cy={-20} rx={30} ry={20} fill="#f5f5f4" />
    <rect x={-10} y={-15} width={20} height={20} fill="#78350f" />
    <rect x={-8} y={-13} width={7} height={16} fill="#451a03" />
    <rect x={1} y={-13} width={7} height={16} fill="#451a03" />
    <ellipse cx={-20} cy={-35} rx={8} ry={6} fill="#1f2937" />
    <ellipse cx={20} cy={-35} rx={8} ry={6} fill="#1f2937" />
    <circle cx={-12} cy={-22} r={5} fill="#1f2937" />
    <circle cx={12} cy={-22} r={5} fill="#1f2937" />
    <circle cx={-12} cy={-22} r={2} fill="white" />
    <circle cx={12} cy={-22} r={2} fill="white" />
    <ellipse cx={0} cy={-15} rx={4} ry={3} fill="#1f2937" />
    {level >= 2 && (
      <>
        <circle cx={-25} cy={5} r={6} fill="white" stroke="#e5e5e5" strokeWidth={1} />
        <circle cx={-25} cy={2} r={3} fill="#1f2937" />
      </>
    )}
    {level >= 3 && (
      <>
        <circle cx={25} cy={5} r={6} fill="white" stroke="#e5e5e5" strokeWidth={1} />
        <circle cx={25} cy={2} r={3} fill="#1f2937" />
      </>
    )}
  </g>
);

const PandaWorker: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={0} rx={8} ry={10} fill="white" />
    <circle cx={0} cy={-12} r={7} fill="white" />
    <circle cx={-6} cy={-18} r={3} fill="#1f2937" />
    <circle cx={6} cy={-18} r={3} fill="#1f2937" />
    <ellipse cx={-3} cy={-13} rx={2} ry={3} fill="#1f2937" />
    <ellipse cx={3} cy={-13} rx={2} ry={3} fill="#1f2937" />
    <line x1={-5} y1={-2} x2={-12} y2={-8} stroke="#1f2937" strokeWidth={3} strokeLinecap="round" />
    <rect x={-16} y={-15} width={4} height={10} fill="#a16207" />
    <rect x={-18} y={-18} width={8} height={5} fill="#6b7280" />
  </g>
);

export default BuildingSprite;
