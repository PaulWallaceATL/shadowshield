import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';

// AnimateNumber component adapted from motion-plus
interface AnimateNumberProps {
  children: number;
  className?: string;
  style?: React.CSSProperties;
  transition?: {
    duration: number;
    ease: string;
  };
}

export const AnimateNumber: React.FC<AnimateNumberProps> = ({ 
  children, 
  className, 
  style, 
  transition = { duration: 0.2, ease: "easeOut" }
}) => {
  const value = useMotionValue(Number(children));
  
  useEffect(() => {
    value.set(Number(children));
  }, [children, value]);
  
  const displayValue = useTransform(value, (latest) => 
    Math.round(latest * 100) / 100
  );
  
  return (
    <motion.div
      className={className}
      style={{ ...style }}
      transition={transition}
    >
      {displayValue}
    </motion.div>
  );
};

// TemperatureSlider component
interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showLabels?: boolean;
}

export const TemperatureSlider: React.FC<TemperatureSliderProps> = ({ 
  value, 
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showLabels = true
}) => {
  const [velocity, setVelocity] = useState(0);
  const lastValue = useRef(value);
  
  const rotate = useSpring(velocity, { stiffness: 500, damping: 30 });
  
  // Calculate percentage for positioning
  const percentage = ((value - min) / (max - min)) * 100;
  
  useEffect(() => {
    // Calculate velocity based on how quickly the value changes
    const newVelocity = value - lastValue.current;
    setVelocity(newVelocity * 3); // Amplify the effect
    lastValue.current = value;
  }, [value]);
  
  return (
    <div className="w-full relative py-8">
      {/* The animated temperature value display */}
      <motion.div 
        className="bg-[#00a0cb] text-white px-2 py-0.5 rounded-md text-sm absolute -top-10 shadow-lg min-w-[40px] text-center z-30"
        style={{
          rotate,
          left: `${percentage}%`,
          translateX: '-50%'
        }}
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          scale: { duration: 0.2 }
        }}
      >
        <AnimateNumber
          className="font-medium"
          style={{}}
        >
          {min === 0 && max === 1 ? value : value / (max / 1)}
        </AnimateNumber>
        <div className="w-2 h-2 bg-[#00a0cb] absolute -bottom-1 left-1/2 transform -translate-x-1/2 rotate-45"></div>
      </motion.div>

      {/* The slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#00a0cb] relative z-10"
          style={{ 
            background: `linear-gradient(to right, #00a0cb 0%, #00a0cb ${percentage}%, #4b5563 ${percentage}%, #4b5563 100%)`,
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        />
        
        {/* Custom thumb */}
        <motion.div 
          className="w-5 h-5 bg-white rounded-full absolute top-1/2 -mt-2.5 shadow-md border border-gray-200 pointer-events-none z-20"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            scale: { duration: 0.2 }
          }}
        />
        
        <style jsx global>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: transparent;
            cursor: pointer;
          }
          
          input[type=range]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: transparent;
            border: none;
            cursor: pointer;
          }
        `}</style>
      </div>
      
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-400 mt-3">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      )}
    </div>
  );
}; 