import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function GradientButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  type = 'button'
}: GradientButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden px-4 py-3 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#2f4faa] disabled:opacity-50 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2f4faa 0%, #00a0cb 100%)',
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transform: 'translateX(-100%)',
        }}
        animate={isHovered ? {
          transform: ['translateX(-100%)', 'translateX(100%)'],
        } : {
          transform: 'translateX(-100%)',
        }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          repeat: isHovered ? Infinity : 0,
          repeatDelay: 0.2,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.button>
  );
} 