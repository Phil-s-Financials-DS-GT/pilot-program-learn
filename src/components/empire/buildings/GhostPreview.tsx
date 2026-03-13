import React from 'react';
import { motion } from 'framer-motion';
import { BuildingType, BUILDING_DEFINITIONS } from './BuildingTypes';
import { gridToScreen } from '../lib/grid';

interface GhostPreviewProps {
  type: BuildingType;
  gridX: number;
  gridY: number;
  isValid: boolean;
}

const GhostPreview: React.FC<GhostPreviewProps> = ({
  type,
  gridX,
  gridY,
  isValid,
}) => {
  const def = BUILDING_DEFINITIONS[type];
  const { screenX: finalX, screenY: finalY } = gridToScreen(gridX, gridY);
  
  const color = isValid ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)';
  const strokeColor = isValid ? '#22c55e' : '#ef4444';
  
  const getBasePoints = () => {
    const w = def.size.width;
    const h = def.size.height;
    const baseW = w === 1 ? 25 : 40 + (w - 2) * 10;
    const baseH = h === 1 ? 8 : 15 + (h - 2) * 5;
    return `-${baseW},${baseH} 0,-${baseH / 2} ${baseW},${baseH} 0,${baseH * 1.5}`;
  };
  
  const renderGhostBuilding = () => {
    const basePoints = getBasePoints();
    const boxWidth = def.size.width === 1 ? 40 : 60 + (def.size.width - 2) * 15;
    const boxHeight = def.size.height === 1 ? 40 : 60 + (def.size.height - 2) * 15;
    
    return (
      <g opacity={0.7}>
        <ellipse
          cx={0}
          cy={0}
          rx={def.size.width * 24}
          ry={def.size.height * 10}
          fill={color}
          opacity={0.25}
        />
        <polygon
          points={basePoints}
          fill={color}
          stroke={strokeColor}
          strokeWidth={2}
        />
        <rect 
          x={-boxWidth / 2} 
          y={-boxHeight} 
          width={boxWidth} 
          height={boxHeight} 
          fill={color} 
          stroke={strokeColor} 
          strokeWidth={2} 
          strokeDasharray="5,5" 
        />
        <text x={0} y={-boxHeight / 2 + 8} textAnchor="middle" fontSize={24}>
          {def.emoji}
        </text>
      </g>
    );
  };
  
  return (
    <motion.g
      transform={`translate(${finalX}, ${finalY})`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {renderGhostBuilding()}
    
      {!isValid && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <circle cx={0} cy={-50} r={15} fill="#ef4444" />
          <text x={0} y={-45} textAnchor="middle" fontSize={20} fontWeight="bold" fill="white">
            ✕
          </text>
        </motion.g>
      )}
      
      {isValid && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <circle cx={0} cy={-50} r={15} fill="#22c55e" />
          <text x={0} y={-45} textAnchor="middle" fontSize={16} fontWeight="bold" fill="white">
            ✓
          </text>
        </motion.g>
      )}
    </motion.g>
  );
};

export default GhostPreview;
