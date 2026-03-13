import React, { useMemo } from 'react';
import { TILE_WIDTH, TILE_HEIGHT, type TerrainType } from '../lib/grid';

interface TileProps {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  terrain: TerrainType;
  isSelected: boolean;
  isOccupied: boolean;
  isBuildable: boolean;
  isGhostValid?: boolean;
  isGhostInvalid?: boolean;
  onClick: () => void;
  onHover: () => void;
}

const terrainColors: Record<TerrainType, { base: string; light: string; dark: string; stroke: string }> = {
  grass: {
    base: '#4ade80',
    light: '#86efac',
    dark: '#22c55e',
    stroke: '#16a34a',
  },
  water: {
    base: '#60a5fa',
    light: '#93c5fd',
    dark: '#3b82f6',
    stroke: '#2563eb',
  },
  pathway: {
    base: '#a8a29e',
    light: '#d6d3d1',
    dark: '#78716c',
    stroke: '#57534e',
  },
  bamboo_forest: {
    base: '#059669',
    light: '#10b981',
    dark: '#047857',
    stroke: '#065f46',
  },
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const Tile: React.FC<TileProps> = ({
  x,
  y,
  screenX,
  screenY,
  terrain,
  isSelected,
  isOccupied,
  isBuildable,
  isGhostValid,
  isGhostInvalid,
  onClick,
  onHover,
}) => {
  const seed = x * 31 + y * 17;
  const colors = terrainColors[terrain];
  
  const points = useMemo(() => {
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    return `${screenX},${screenY - halfHeight} ${screenX + halfWidth},${screenY} ${screenX},${screenY + halfHeight} ${screenX - halfWidth},${screenY}`;
  }, [screenX, screenY]);
  
  const getFillColor = () => {
    if (isGhostValid) return 'rgba(74, 222, 128, 0.5)';
    if (isGhostInvalid) return 'rgba(248, 113, 113, 0.5)';
    if (isSelected) return colors.light;
    return colors.base;
  };
  
  const getStrokeColor = () => {
    if (isGhostValid) return '#22c55e';
    if (isGhostInvalid) return '#ef4444';
    if (isSelected) return '#fbbf24';
    return colors.stroke;
  };
  
  const getStrokeWidth = () => {
    if (isSelected || isGhostValid || isGhostInvalid) return 2;
    return 0.5;
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const renderBambooForest = () => {
    const stalks = [];
    const numStalks = 3 + Math.floor(seededRandom(seed) * 3);
    
    for (let i = 0; i < numStalks; i++) {
      const offsetX = (seededRandom(seed + i * 7) - 0.5) * 20;
      const offsetY = (seededRandom(seed + i * 13) - 0.5) * 8;
      const height = 15 + seededRandom(seed + i * 19) * 20;
      const thickness = 2 + seededRandom(seed + i * 23) * 1.5;
      const hue = seededRandom(seed + i * 29) > 0.5 ? '#047857' : '#065f46';
      const leafHue = seededRandom(seed + i * 31) > 0.5 ? '#10b981' : '#059669';
      
      stalks.push(
        <g key={`stalk-${i}`}>
          <line
            x1={screenX + offsetX}
            y1={screenY + offsetY + 5}
            x2={screenX + offsetX}
            y2={screenY + offsetY - height}
            stroke={hue}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {[0.3, 0.5, 0.7].map((pos, j) => (
            <line
              key={`segment-${j}`}
              x1={screenX + offsetX - thickness}
              y1={screenY + offsetY - height * pos}
              x2={screenX + offsetX + thickness}
              y2={screenY + offsetY - height * pos}
              stroke={hue}
              strokeWidth={1}
              opacity={0.6}
            />
          ))}
          <ellipse
            cx={screenX + offsetX - 4 - seededRandom(seed + i * 37) * 3}
            cy={screenY + offsetY - height + 2}
            rx={6 + seededRandom(seed + i * 41) * 3}
            ry={3 + seededRandom(seed + i * 43) * 2}
            fill={leafHue}
          />
          <ellipse
            cx={screenX + offsetX + 3 + seededRandom(seed + i * 47) * 3}
            cy={screenY + offsetY - height + 5}
            rx={5 + seededRandom(seed + i * 53) * 2}
            ry={2.5 + seededRandom(seed + i * 59) * 1.5}
            fill={leafHue}
            opacity={0.9}
          />
          {seededRandom(seed + i * 61) > 0.5 && (
            <ellipse
              cx={screenX + offsetX - 2}
              cy={screenY + offsetY - height * 0.6}
              rx={4}
              ry={2}
              fill={leafHue}
              opacity={0.7}
            />
          )}
        </g>
      );
    }
    
    return (
      <g>
        <ellipse
          cx={screenX}
          cy={screenY + 3}
          rx={18}
          ry={6}
          fill="#064e3b"
          opacity={0.3}
        />
        {stalks}
      </g>
    );
  };

  const renderWater = () => {
    const hasLilyPad = seededRandom(seed * 67) > 0.6;
    
    return (
      <g>
        <polygon
          points={points}
          fill="url(#waterShimmer)"
          opacity={0.35}
        />
        
        <ellipse
          cx={screenX - 8}
          cy={screenY - 3}
          rx={4}
          ry={2}
          fill="none"
          stroke="#93c5fd"
          strokeWidth={0.5}
          opacity={0.3}
        />
        
        <ellipse
          cx={screenX + 6}
          cy={screenY + 2}
          rx={3}
          ry={1.5}
          fill="none"
          stroke="#bfdbfe"
          strokeWidth={0.5}
          opacity={0.25}
        />
        
        <ellipse
          cx={screenX - 3}
          cy={screenY - 6}
          rx={8}
          ry={3}
          fill="#dbeafe"
          opacity={0.15}
        />
        
        {hasLilyPad && (
          <g>
            <ellipse
              cx={screenX + (seededRandom(seed * 73) - 0.5) * 15}
              cy={screenY + (seededRandom(seed * 79) - 0.5) * 6}
              rx={5}
              ry={2.5}
              fill="url(#lilyPadGradient)"
              opacity={0.9}
            />
            {seededRandom(seed * 83) > 0.5 && (
              <circle
                cx={screenX + (seededRandom(seed * 73) - 0.5) * 15 + 2}
                cy={screenY + (seededRandom(seed * 79) - 0.5) * 6 - 1}
                r={1.5}
                fill="#fbbf24"
                opacity={0.8}
              />
            )}
          </g>
        )}
      </g>
    );
  };

  const renderGrass = () => {
    if (isOccupied) return null;
    
    const elements = [];
    const numTufts = 2 + Math.floor(seededRandom(seed * 89) * 3);
    
    for (let i = 0; i < numTufts; i++) {
      const tuftX = screenX + (seededRandom(seed + i * 97) - 0.5) * 22;
      const tuftY = screenY + (seededRandom(seed + i * 101) - 0.5) * 8;
      const bladeCount = 3 + Math.floor(seededRandom(seed + i * 103) * 3);
      
      const blades = [];
      for (let j = 0; j < bladeCount; j++) {
        const angle = (j - bladeCount / 2) * 15;
        const height = 3 + seededRandom(seed + i * 107 + j * 109) * 4;
        const shade = seededRandom(seed + i * 113 + j * 127) > 0.5 ? '#22c55e' : '#16a34a';
        
        blades.push(
          <line
            key={`blade-${j}`}
            x1={tuftX}
            y1={tuftY}
            x2={tuftX + Math.sin(angle * Math.PI / 180) * height}
            y2={tuftY - Math.cos(angle * Math.PI / 180) * height}
            stroke={shade}
            strokeWidth={0.8}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      }
      
      elements.push(<g key={`tuft-${i}`}>{blades}</g>);
    }
    
    if (seededRandom(seed * 131) > 0.7) {
      const flowerX = screenX + (seededRandom(seed * 137) - 0.5) * 18;
      const flowerY = screenY + (seededRandom(seed * 139) - 0.5) * 7;
      const flowerColor = seededRandom(seed * 149) > 0.5 ? '#fbbf24' : 
                          seededRandom(seed * 151) > 0.5 ? '#f472b6' : '#a78bfa';
      
      elements.push(
        <g key="flower">
          <line
            x1={flowerX}
            y1={flowerY + 4}
            x2={flowerX}
            y2={flowerY}
            stroke="#16a34a"
            strokeWidth={0.8}
          />
          <circle cx={flowerX} cy={flowerY} r={2} fill={flowerColor} opacity={0.9} />
          <circle cx={flowerX} cy={flowerY} r={0.8} fill="#fef3c7" opacity={0.8} />
        </g>
      );
    }
    
    if (seededRandom(seed * 157) > 0.8) {
      elements.push(
        <ellipse
          key="pebble"
          cx={screenX + (seededRandom(seed * 163) - 0.5) * 16}
          cy={screenY + (seededRandom(seed * 167) - 0.5) * 6}
          rx={2}
          ry={1}
          fill="#9ca3af"
          opacity={0.4}
        />
      );
    }
    
    return <g>{elements}</g>;
  };

  const renderPathway = () => {
    const stones = [];
    const numStones = 3 + Math.floor(seededRandom(seed * 173) * 2);
    
    for (let i = 0; i < numStones; i++) {
      const stoneX = screenX + (seededRandom(seed + i * 179) - 0.5) * 20;
      const stoneY = screenY + (seededRandom(seed + i * 181) - 0.5) * 8;
      const rx = 3 + seededRandom(seed + i * 191) * 4;
      const ry = 1.5 + seededRandom(seed + i * 193) * 2;
      const shade = seededRandom(seed + i * 197) > 0.5 ? colors.dark : colors.light;
      
      stones.push(
        <ellipse
          key={`stone-${i}`}
          cx={stoneX}
          cy={stoneY}
          rx={rx}
          ry={ry}
          fill={shade}
          opacity={0.5}
        />
      );
    }
    
    return <g>{stones}</g>;
  };

  return (
    <g
      onClick={handleClick}
      onMouseEnter={onHover}
      style={{ cursor: isBuildable ? 'pointer' : 'default', pointerEvents: 'all' }}
    >
      <polygon
        points={points}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        opacity={terrain === 'bamboo_forest' ? 0.95 : 1}
      />
      
      {terrain === 'water' && renderWater()}
      {terrain === 'grass' && renderGrass()}
      {terrain === 'pathway' && renderPathway()}
      {terrain === 'bamboo_forest' && renderBambooForest()}
      
      {isSelected && (
        <polygon
          points={points}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={3}
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="1s"
            repeatCount="indefinite"
          />
        </polygon>
      )}
    </g>
  );
};

export default Tile;
