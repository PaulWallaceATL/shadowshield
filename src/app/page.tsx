'use client';

import { redirect } from "next/navigation";
import Link from 'next/link';
import { motion, Variants, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence, useInView, MotionValue } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  BellIcon,
  ClockIcon,
  DocumentCheckIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  CubeTransparentIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  ArrowDownIcon,
  PlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useMediaQuery } from 'react-responsive';

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'Access to Advanced Models',
    description: 'Direct access to GPT-4, Claude 3.5, and Gemini 1.5 Pro, ensuring optimal performance for every use case.',
    color: '#00a0cb',
    models: ['GPT-4', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro']
  },
  {
    icon: LockClosedIcon,
    title: 'Enterprise-Grade Security',
    description: 'End-to-end encryption with DLP-driven policies to prevent data leaks and enforce compliance at scale.',
    color: '#2f4faa',
    stats: ['10% YoY breach cost reduction', '100 days faster detection']
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Real-Time Monitoring',
    description: 'Track AI usage, detect anomalies, and enforce customizable DLP policies across all AI interactions.',
    color: '#190b37',
    integrations: ['Google Cloud DLP', 'Forcepoint', 'Microsoft DLP']
  },
  {
    icon: SparklesIcon,
    title: 'Deep Analytics',
    description: 'Comprehensive insights into AI usage patterns, security incidents, and compliance metrics.',
    color: '#00a0cb',
    metrics: ['User-level tracking', 'Department analytics', 'Compliance reports']
  }
];

const trustLogos = [
  { name: 'Company 1', logo: '/logos/company1.svg' },
  { name: 'Company 2', logo: '/logos/company2.svg' },
  { name: 'Company 3', logo: '/logos/company3.svg' },
  { name: 'Company 4', logo: '/logos/company4.svg' },
];

const painPoints = [
  {
    icon: ShieldExclamationIcon,
    title: 'Data Exposure',
    description: 'Prevent sensitive corporate data and intellectual property from leaking into unsecured AI endpoints.',
  },
  {
    icon: DocumentCheckIcon,
    title: 'Compliance Risks',
    description: 'Maintain GDPR, HIPAA, and SOC 2 compliance without sacrificing AI-powered productivity.',
  },
  {
    icon: LockClosedIcon,
    title: 'Vendor Lock-In',
    description: 'Access multiple AI models including GPT-4, Claude 3.5, and Gemini 1.5 through a single secure gateway.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Connect",
    description: "Integrate ShadowShield with your existing AI tools through our enterprise-grade API",
    icon: CloudArrowUpIcon,
  },
  {
    step: 2,
    title: "Configure",
    description: "Set up custom security policies that protect your intellectual property and sensitive data",
    icon: CpuChipIcon,
  },
  {
    step: 3,
    title: "Monitor",
    description: "Track AI interactions in real-time with our advanced threat detection engine",
    icon: ShieldCheckIcon,
  },
  {
    step: 4,
    title: "Analyze",
    description: "Gain insights from comprehensive security analytics and compliance reporting",
    icon: ChartBarIcon,
  },
];

const useCases = [
  {
    title: "Financial Services",
    description: "Secure AI interactions for sensitive financial data and customer information.",
    icon: BeakerIcon,
    color: [340, 10],
  },
  {
    title: "Healthcare",
    description: "HIPAA-compliant AI processing for medical records and patient data.",
    icon: CubeTransparentIcon,
    color: [20, 40],
  },
  {
    title: "Legal",
    description: "Confidential document processing with attorney-client privilege protection.",
    icon: CloudArrowUpIcon,
    color: [205, 245],
  },
  {
    title: "Technology",
    description: "IP protection for source code and technical documentation.",
    icon: CpuChipIcon,
    color: [290, 320],
  },
];

const heroVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0, 1],
      staggerChildren: 0.1
    }
  }
};

const heroLogoVariants = {
  hidden: { 
    scale: 0,
    rotate: -180,
    filter: "blur(10px)",
  },
  visible: {
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 1.5,
    }
  }
};

const glowVariants = {
  initial: {
    opacity: 0,
    scale: 0.2,
  },
  animate: {
    opacity: [0.5, 0.3, 0.5],
    scale: [1, 1.2, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

const cardVariants: Variants = {
  offscreen: {
    y: 100,
    opacity: 0,
    scale: 0.8,
    rotateX: "45deg",
    rotateY: "-15deg",
  },
  onscreen: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotateX: "0deg",
    rotateY: "0deg",
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 1.2,
      ease: [0.25, 0.1, 0, 1],
    },
  },
};

const featureCardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0,
    scale: 0.9,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 1,
    },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// New ClientOnly component to prevent server-side rendering
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  return <>{children}</>;
};

// 1. Define a more consistent and professional color palette
const theme = {
  primary: '#42f5b6',
  primaryDark: '#38d6a0',
  secondary: '#00a0cb',
  accent: '#00ffff',
  dark: '#0c0521',
  darkBlue: '#190b37',
  cardBg: 'rgba(26, 31, 53, 0.5)',
  cardBorder: 'rgba(47, 79, 170, 0.2)',
  text: {
    primary: '#ffffff',
    secondary: '#c2c8d6',
    accent: '#42f5b6'
  },
  gradients: {
    primary: 'linear-gradient(90deg, #42f5b6 0%, #00a0cb 100%)',
    dark: 'linear-gradient(90deg, #190b37 0%, #0c0521 100%)',
    glow: 'radial-gradient(circle, rgba(66,245,182,0.2) 0%, transparent 70%)'
  }
};

// 2. Improved background particle system with minimal movement
const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<any>>([]);
  
  useEffect(() => {
    // Significantly fewer particles for better performance
    const particleCount = 25;
    const newParticles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.7 ? theme.primary : Math.random() > 0.4 ? theme.secondary : '#2f4faa',
      // Very small, subtle movement
      xPath: [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ],
      yPath: [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ],
      duration: Math.random() * 30 + 30, // Very slow animation
      delay: Math.random() * 8,
      opacity: Math.random() * 0.2 + 0.1, // Very low opacity
    }));
    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            filter: `blur(${particle.size <= 2 ? 1 : 0}px)`,
          }}
          animate={{
            x: particle.xPath,
            y: particle.yPath,
            opacity: [particle.opacity, particle.opacity * 1.2, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const Card3D = ({ children, depth = 40, className = "" }: { 
  children: React.ReactNode; 
  depth?: number; 
  className?: string;
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (normalized to -1...1)
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * 2.5;
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * 2.5;
    
    // Apply rotation with smaller values for subtlety
    setRotateX(-rotateXValue);
    setRotateY(rotateYValue);
  };
  
  const handleMouseLeave = () => {
    // Smoothly reset rotation on mouse leave
    setRotateX(0);
    setRotateY(0);
  };
  
  return (
    <div 
      ref={cardRef}
      className={`perspective-${depth * 5} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="w-full h-full transform-gpu"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const EffectButton = ({ children, className = "", primary = false, href }: { children: React.ReactNode, className?: string, primary?: boolean, href: string }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Link
        href={href}
        className={`relative block z-10 px-8 py-4 rounded-full font-medium transition-all duration-200 text-center overflow-hidden ${primary 
          ? 'bg-[#00a0cb] hover:bg-[#0090b7] text-white shadow-lg hover:shadow-[#00a0cb]/25' 
          : 'border-2 border-[#42f5b6] text-[#42f5b6] hover:bg-[#42f5b6]/10'
        } ${className}`}
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {children}
          {primary && (
            <motion.span
              animate={{
                x: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <ArrowRightIcon className="w-5 h-5" />
            </motion.span>
          )}
        </div>
        
        {primary && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#00a0cb] to-[#42f5b6]"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.4 }}
            style={{ zIndex: -1 }}
          />
        )}
      </Link>
      
      <motion.div
        className="absolute -inset-1 rounded-full"
        animate={{
          boxShadow: primary 
            ? ['0 0 0 0 rgba(0,160,203,0)', '0 0 20px 5px rgba(0,160,203,0.5)', '0 0 0 0 rgba(0,160,203,0)']
            : ['0 0 0 0 rgba(66,245,182,0)', '0 0 20px 5px rgba(66,245,182,0.5)', '0 0 0 0 rgba(66,245,182,0)'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

const CtaParticles = () => {
  const [particles, setParticles] = useState<Array<any>>([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      backgroundColor: Math.random() > 0.5 ? '#42f5b6' : '#00ffff',
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      x: [
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
      ],
      y: [
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
      ],
      duration: Math.random() * 15 + 15,
    }));
    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <>
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: particle.width,
            height: particle.height,
            backgroundColor: particle.backgroundColor,
            left: particle.left,
            top: particle.top,
            opacity: 0.6,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
};

// 3. Professional Hero Visualization Component
const HeroVisualization = () => {
  return (
    <div className="relative w-full md:w-1/2 lg:w-2/5 h-[380px] md:h-auto">
      <div className="absolute w-full h-full flex items-center justify-center">
        <div className="relative w-[340px] h-[340px] flex items-center justify-center">
          {/* Central shield */}
          <motion.div 
            className="absolute w-40 h-40 rounded-full bg-gradient-to-b from-[#190b37] to-[#0c0521] border-2 border-[#42f5b6]/30 flex items-center justify-center z-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1,
              opacity: 1,
              boxShadow: [
                '0 0 0 0 rgba(66,245,182,0)',
                '0 0 30px 5px rgba(66,245,182,0.2)',
                '0 0 0 0 rgba(66,245,182,0)',
              ],
            }}
            transition={{
              scale: { duration: 1 },
              opacity: { duration: 1 },
              boxShadow: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          >
            <ShieldCheckIcon className="w-20 h-20 text-[#42f5b6]" />
          </motion.div>
          
          {/* Security layers */}
          {[60, 80, 100].map((size, i) => (
            <motion.div 
              key={i}
              className="absolute rounded-full border border-[#42f5b6]/15"
              style={{ 
                width: `${size}%`, 
                height: `${size}%`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 0.7 - (i * 0.2),
                scale: 1,
                rotate: i % 2 === 0 ? 360 : -360,
              }}
              transition={{ 
                opacity: { duration: 1, delay: 0.3 + (i * 0.2) },
                scale: { duration: 1, delay: 0.3 + (i * 0.2) },
                rotate: {
                  duration: 40 + (i * 10),
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          ))}
          
          {/* Model orbit */}
          <motion.div
            className="absolute w-[95%] h-[95%] rounded-full border-[0.5px] border-[#42f5b6]/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{
              opacity: { duration: 1, delay: 0.8 },
              rotate: {
                duration: 40,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          >
            {/* Orbiting models */}
            {[0, 120, 240].map((angle, i) => {
              const model = ["GPT-4o", "Claude 3.5", "Gemini 1.5"][i];
              return (
                <motion.div
                  key={i}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#0c0521]/80 border border-[#42f5b6]/30 rounded-lg"
                  style={{
                    transformOrigin: 'center 170px',
                    transform: `rotate(${angle}deg)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 + (i * 0.2) }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-xs font-mono text-[#42f5b6] block" style={{ transform: `rotate(-${angle}deg)` }}>
                    {model}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
          
          {/* Data flow lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-transparent via-[#42f5b6]/30 to-transparent"
              style={{
                width: '100%',
                transformOrigin: 'center',
                transform: `rotate(${angle}deg)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5 + (i * 0.05) }}
            >
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-[#42f5b6]"
                animate={{
                  left: ['5%', '95%', '5%'],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.3,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Feature labels */}
      <motion.div 
        className="absolute top-1/4 left-1/4 bg-[#0c0521]/80 px-3 py-1.5 rounded-lg text-sm border border-[#00a0cb]/30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2 }}
      >
        <span className="text-[#00a0cb]">Real-time Monitoring</span>
      </motion.div>
      
      <motion.div 
        className="absolute top-2/3 right-1/4 bg-[#0c0521]/80 px-3 py-1.5 rounded-lg text-sm border border-[#42f5b6]/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.2 }}
      >
        <span className="text-[#42f5b6]">Enterprise-grade DLP</span>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-1/4 left-1/3 bg-[#0c0521]/80 px-3 py-1.5 rounded-lg text-sm border border-[#00ffff]/30 backdrop-blur-sm z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.4 }}
      >
        <span className="text-[#00ffff]">Multi-LLM Support</span>
      </motion.div>
    </div>
  );
};

// Helper components for the hero visualization
interface ModelBadgeProps {
  name: string;
  position: React.CSSProperties;
  transforms: any; // Using any for now to fix the immediate error
  delay?: number;
}

const ModelBadge = ({ name, position, transforms, delay = 0 }: ModelBadgeProps) => (
  <motion.div 
    className="absolute px-3 py-1.5 bg-[#190b37] border border-[#42f5b6]/30 rounded-md z-10"
    style={{
      ...position,
      x: transforms.x,
      y: transforms.y,
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      type: "spring", 
      stiffness: 200, 
      damping: 20,
      delay: delay + 1 
    }}
    whileHover={{ 
      scale: 1.1, 
      backgroundColor: "rgba(25,11,55,0.9)",
      borderColor: "rgba(66,245,182,0.5)"
    }}
  >
    <span className="text-sm font-mono text-[#42f5b6]">{name}</span>
  </motion.div>
);

interface FeatureTagProps {
  text: string;
  position: React.CSSProperties;
  delay?: number;
}

const FeatureTag = ({ text, position, delay = 0 }: FeatureTagProps) => (
  <motion.div 
    className="absolute px-3 py-1.5 bg-[#190b37]/80 rounded-md border border-[#42f5b6]/30 text-sm z-30"
    style={position}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay + 1.5 }}
    whileHover={{ scale: 1.05, y: -3 }}
  >
    <span className="text-[#42f5b6]">{text}</span>
  </motion.div>
);

// 4. Professional button component
interface ButtonProps {
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
  className?: string;
}

const PrimaryButton = ({ children, href, onClick, className = "" }: ButtonProps) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="relative group"
  >
    <Link
      href={href || "#"}
      onClick={onClick}
      className={`relative block bg-[${theme.primary}] text-[${theme.dark}] px-8 py-4 rounded-full font-medium text-center shadow-lg z-10 overflow-hidden ${className}`}
    >
      <motion.span 
        className={`absolute inset-0 bg-gradient-to-r from-[${theme.primary}] to-[${theme.accent}] opacity-0 group-hover:opacity-100`}
        initial={{ x: "-100%" }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.4 }}
      />
      
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
    </Link>
    
    <motion.div
      className="absolute inset-0 rounded-full"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.3, 0],
        scale: [0.9, 1.02, 0.9],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        background: `rgba(66, 245, 182, 0.3)`,
        filter: 'blur(8px)',
      }}
    />
  </motion.div>
);

const SecondaryButton = ({ children, href, onClick, className = "" }: ButtonProps) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="relative"
  >
    <Link
      href={href || "#"}
      onClick={onClick}
      className={`block border-2 border-[${theme.primary}] text-[${theme.primary}] px-8 py-4 rounded-full font-medium transition-all duration-200 hover:bg-[${theme.primary}]/10 text-center ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        {children}
      </div>
    </Link>
  </motion.div>
);

// 5. Section divider component
const SectionDivider = () => (
  <div className="relative h-24 overflow-hidden">
    <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent to-[#0c0521] z-10"></div>
    <motion.div 
      className="absolute left-1/2 bottom-8 transform -translate-x-1/2"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <ArrowDownIcon className="w-6 h-6 text-[#42f5b6]" />
    </motion.div>
  </div>
);

export default function Home() {
  const { data: session } = useSession();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStep, setActiveStep] = useState(1);
  const isTablet = useMediaQuery({ query: '(max-width: 1024px)' });
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const { scrollY, scrollYProgress } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef as React.RefObject<HTMLElement>);

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const backgroundY = useTransform(scrollY, [0, 1000], ['0%', '50%']);

  const springConfig = { stiffness: 100, damping: 30, mass: 0.2 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (session?.user) {
      if (['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        redirect('/admin');
      } else {
        redirect('/chat');
      }
    }
  }, [session]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      mouseX.set((clientX - centerX) / centerX);
      mouseY.set((clientY - centerY) / centerY);
      cursorX.set(clientX);
      cursorY.set(clientY);
      setMousePosition({ x: clientX, y: clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate through How It Works steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const hue = (h: number) => `hsl(${h}, 100%, 65%)`;

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 15;
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -15;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleCardMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen relative overflow-hidden antialiased">
      {/* Particle system wrapped in ClientOnly */}
      <ClientOnly>
        <ParticleBackground />
      </ClientOnly>
      
      {/* Replace the mouse-following gradient */}
      <ClientOnly>
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{
            filter: 'blur(120px)',
            y: backgroundY,
          }}
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(66,247,227,0.05) 0%, transparent 70%)',
              'radial-gradient(circle at 80% 80%, rgba(0,160,203,0.05) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 20%, rgba(66,247,227,0.05) 0%, transparent 70%)',
              'radial-gradient(circle at 20% 80%, rgba(0,160,203,0.05) 0%, transparent 70%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </ClientOnly>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen py-16 flex items-center">
          {/* Grid background with proper positioning and sizing */}
          <div className="absolute inset-0 bg-[#0c0521] overflow-hidden">
            <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'linear-gradient(#42f5b6 0.5px, transparent 0.5px), linear-gradient(to right, #42f5b6 0.5px, transparent 0.5px)',
                backgroundSize: '40px 40px',
              }} 
            />
            
            {/* Subtle glow effects */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
              style={{ 
                background: 'radial-gradient(circle, #42f5b6 0%, transparent 70%)',
                filter: 'blur(40px)'
              }}
            />
            
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-5"
              style={{ 
                background: 'radial-gradient(circle, #00a0cb 0%, transparent 70%)',
                filter: 'blur(40px)'
              }}
            />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 z-10 pt-16">
            {/* Enterprise badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#190b37] border border-[#42f5b6]/30 mb-10 backdrop-blur-sm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42f5b6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#42f5b6]"></span>
              </span>
              <span className="text-sm font-medium text-[#42f5b6]">Enterprise AI Security Solution</span>
            </motion.div>
            
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">
              {/* Left column: Hero text */}
              <motion.div 
                className="w-full lg:w-1/2 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.25, 0.1, 0, 1],
                }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  <motion.div className="space-y-2">
                    <div>Protect Your</div>
                    <div>Enterprise IP</div>
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">
                      from Unauthorized AI Access
                    </div>
                  </motion.div>
                </h1>
                
                <motion.p 
                  className="text-xl text-gray-300 mb-8 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Securely harness the power of consumer-grade LLMs without risking your intellectual property or compromising compliance.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <PrimaryButton href="/request-demo" onClick={() => {}}>
                    Request a Demo
                  </PrimaryButton>
                  
                  <SecondaryButton href="/chat" onClick={() => {}}>
                    <div className="flex items-center gap-2">
                      <span>Go to Chat</span>
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </div>
                  </SecondaryButton>
                  
                  <SecondaryButton href="/learn-more" onClick={() => {}}>
                    Learn More
                  </SecondaryButton>
                </motion.div>
                
                {/* Compliance badges */}
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'gdpr', label: 'GDPR Compliant', icon: ShieldCheckIcon },
                    { id: 'hipaa', label: 'HIPAA Ready', icon: ShieldCheckIcon },
                    { id: 'soc2', label: 'SOC 2 Certified', icon: ShieldCheckIcon },
                    { id: 'e2e', label: 'End-to-End Encrypted', icon: LockClosedIcon }
                  ].map(cert => (
                    <motion.div 
                      key={cert.id}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#190b37] border border-[#42f5b6]/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1 + Math.random() * 0.5 }}
                    >
                      <cert.icon className="w-3.5 h-3.5 text-[#42f5b6]" />
                      <span className="text-xs text-gray-300">{cert.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Right column: Logo-centered visualization with fixed model bubbles */}
              <motion.div 
                className="w-full lg:w-1/2 flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                  {/* Central logo with shield */}
                  <motion.div 
                    className="absolute w-40 h-40 rounded-full bg-[#190b37] border border-[#42f5b6]/30 flex items-center justify-center z-30"
                    animate={{
                      boxShadow: ['0 0 20px rgba(66,245,182,0.1)', '0 0 40px rgba(66,245,182,0.2)', '0 0 20px rgba(66,245,182,0.1)'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Add the SSLogo.svg in the center */}
                    <motion.img 
                      src="/SSLogo.svg" 
                      alt="ShadowShield Logo" 
                      className="w-24 h-24"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                  
                  {/* Security rings with proper sizing and centering */}
                  <motion.div 
                    className="absolute w-64 h-64 rounded-full border border-[#00a0cb]/20 z-10"
                    animate={{ 
                      boxShadow: ['0 0 20px rgba(0,160,203,0.05)', '0 0 30px rgba(0,160,203,0.1)', '0 0 20px rgba(0,160,203,0.05)'],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <motion.div 
                    className="absolute w-56 h-56 rounded-full border border-[#42f5b6]/20 z-10"
                    animate={{ 
                      boxShadow: ['0 0 20px rgba(66,245,182,0.05)', '0 0 30px rgba(66,245,182,0.1)', '0 0 20px rgba(66,245,182,0.05)'],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                  
                  <motion.div 
                    className="absolute w-48 h-48 rounded-full border border-[#00ffff]/20 z-10"
                    animate={{ 
                      boxShadow: ['0 0 20px rgba(0,255,255,0.05)', '0 0 30px rgba(0,255,255,0.1)', '0 0 20px rgba(0,255,255,0.05)'],
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                  
                  {/* Fixed position AI model bubbles that never overlap or appear upside down */}
                  
                  {/* GPT-4o Bubble - Top Position - Fixed, non-rotating */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.div
                      className="px-3 py-1.5 bg-[#190b37] rounded-lg border border-[#42f5b6]/40 shadow-lg"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 15px rgba(66, 245, 182, 0.5)",
                        borderColor: "rgba(66, 245, 182, 0.8)" 
                      }}
                      initial={{ y: 0 }}
                      // No repeat animation
                    >
                      <span className="text-xs font-mono text-[#42f5b6] flex items-center gap-1.5">
                        GPT-4o
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42f5b6] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#42f5b6]"></span>
                        </span>
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Claude 3.5 Bubble - Right Position - Fixed, non-rotating */}
                  <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.div
                      className="px-3 py-1.5 bg-[#190b37] rounded-lg border border-[#00a0cb]/40 shadow-lg"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 15px rgba(0, 160, 203, 0.5)",
                        borderColor: "rgba(0, 160, 203, 0.8)" 
                      }}
                      initial={{ x: 0 }}
                      // No repeat animation
                    >
                      <span className="text-xs font-mono text-[#00a0cb] flex items-center gap-1.5">
                        Claude 3.5
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a0cb] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00a0cb]"></span>
                        </span>
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Gemini 1.5 Bubble - Left Position - Fixed, non-rotating */}
                  <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.div
                      className="px-3 py-1.5 bg-[#190b37] rounded-lg border border-[#00ffff]/40 shadow-lg"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
                        borderColor: "rgba(0, 255, 255, 0.8)" 
                      }}
                      initial={{ x: 0 }}
                      // No repeat animation
                    >
                      <span className="text-xs font-mono text-[#00ffff] flex items-center gap-1.5">
                        Gemini 1.5
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffff] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00ffff]"></span>
                        </span>
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* GPT-4o mini bubble - Bottom Right Position - Fixed, non-rotating */}
                  <div className="absolute bottom-[20%] right-[20%] z-20">
                    <motion.div
                      className="px-2 py-1 bg-[#190b37] rounded-lg border border-[#42f5b6]/40 shadow-lg"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 12px rgba(66, 245, 182, 0.5)",
                        borderColor: "rgba(66, 245, 182, 0.8)" 
                      }}
                      initial={{ y: 0 }}
                      // No repeat animation
                    >
                      <span className="text-xs font-mono text-[#42f5b6] flex items-center gap-1">
                        o3-mini
                        <span className="flex h-1 w-1 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42f5b6] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1 w-1 bg-[#42f5b6]"></span>
                        </span>
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Haiku bubble - Bottom Left Position - Fixed, non-rotating */}
                  <div className="absolute bottom-[20%] left-[20%] z-20">
                    <motion.div
                      className="px-2 py-1 bg-[#190b37] rounded-lg border border-[#00a0cb]/40 shadow-lg"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 0 12px rgba(0, 160, 203, 0.5)",
                        borderColor: "rgba(0, 160, 203, 0.8)" 
                      }}
                      initial={{ y: 0 }}
                      // No repeat animation
                    >
                      <span className="text-xs font-mono text-[#00a0cb] flex items-center gap-1">
                        Haiku
                        <span className="flex h-1 w-1 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a0cb] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1 w-1 bg-[#00a0cb]"></span>
                        </span>
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Data flow lines with precise positioning */}
                  {[30, 90, 150, 210, 270, 330].map((angle, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-[170px] h-[1px] opacity-50"
                      style={{ 
                        background: 'linear-gradient(90deg, rgba(66,245,182,0) 0%, rgba(66,245,182,0.5) 50%, rgba(66,245,182,0) 100%)',
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                        transformOrigin: 'center',
                      }}
                    >
                      <motion.div
                        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#42f5b6]"
                        animate={{
                          left: ['0%', '100%', '0%'],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  ))}
                  
                  {/* Feature labels with proper positioning */}
                  <motion.div
                    className="absolute top-[15%] right-[15%] px-3 py-1.5 rounded bg-[#190b37] border border-[#42f5b6]/30 backdrop-blur-sm z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <span className="text-xs text-[#42f5b6]">DLP Protection</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute top-[75%] right-[15%] px-3 py-1.5 rounded bg-[#190b37] border border-[#00a0cb]/30 backdrop-blur-sm z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                  >
                    <span className="text-xs text-[#00a0cb]">Real-time Monitoring</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute bottom-[5%] left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded bg-[#190b37] border border-[#00ffff]/30 backdrop-blur-sm z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.6 }}
                  >
                    <span className="text-xs text-[#00ffff]">Multi-Model Access</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* Subtle scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-0 right-0 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDownIcon className="w-5 h-5 text-[#42f5b6]" />
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Rest of the sections with consistent styling */}
        {/* Each section gets similarly enhanced with professional styling */}
        
        {/* First, let's restore the Features section after the hero */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#0c0521] to-[#0f0828]">
          {/* Fixed subtle background accents */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] right-[5%] w-64 h-64 rounded-full opacity-5"
              style={{ 
                background: 'radial-gradient(circle, #42f5b6 0%, transparent 70%)',
                filter: 'blur(50px)'
              }}
            />
            <div className="absolute bottom-[20%] left-[10%] w-64 h-64 rounded-full opacity-5"
              style={{ 
                background: 'radial-gradient(circle, #00a0cb 0%, transparent 70%)',
                filter: 'blur(50px)'
              }}
            />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.span 
                className="inline-block px-4 py-1 rounded-full bg-[#190b37] border border-[#42f5b6]/30 text-[#42f5b6] text-sm font-medium mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Enterprise Security
              </motion.span>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Security for Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">AI Interactions</span>
              </h2>
              
              <p className="text-xl text-gray-300">
                Monitor, control, and secure all enterprise AI access with robust security controls and powerful analytics.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {features.map((feature, index) => (
                <Card3D key={feature.title} depth={30} className="h-full">
                  <motion.div 
                    className="h-full bg-[#190b37]/80 backdrop-blur-md rounded-2xl p-8 border border-[#2f4faa]/20 overflow-hidden relative"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    // Simple hover effect only on the container, no nested hover effects
                    whileHover={{ 
                      y: -5,
                      boxShadow: "0 20px 40px rgba(12, 5, 33, 0.5)",
                      borderColor: `${feature.color}50` 
                    }}
                  >
                    {/* Static background glow - no animation */}
                    <div 
                      className="absolute top-0 right-0 w-full h-64 -mt-32 -mr-32 opacity-10"
                      style={{ 
                        background: `radial-gradient(circle, ${feature.color} 0%, transparent 70%)`,
                        filter: 'blur(40px)'
                      }}
                    />
                    
                    <div className="relative z-10">
                      {/* Feature icon - no hover effect */}
                      <div className="mb-6 w-14 h-14 rounded-2xl bg-[#0c0521] border border-[#42f5b6]/20 flex items-center justify-center">
                        <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                      <p className="text-gray-300 mb-6">{feature.description}</p>
                      
                      {feature.models && (
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: feature.color }}>
                            <SparklesIcon className="w-4 h-4" />
                            Supported Models
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {feature.models.map(model => (
                              <span 
                                key={model}
                                className="text-xs py-1 px-2 rounded-full bg-[#0c0521] border border-[#42f5b6]/20"
                              >
                                {model}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {feature.stats && (
                        <motion.div 
                          className="space-y-2 mt-4"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: feature.color }}>
                            <ChartBarIcon className="w-4 h-4" />
                            Key Stats
                          </h4>
                          <div className="space-y-1">
                            {feature.stats.map((stat, i) => (
                              <div 
                                key={stat}
                                className="flex items-center gap-2"
                              >
                                <CheckCircleIcon className="w-4 h-4" style={{ color: feature.color }} />
                                <span className="text-sm text-gray-300">{stat}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {feature.integrations && (
                        <motion.div 
                          className="space-y-2 mt-4"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: feature.color }}>
                            <CubeTransparentIcon className="w-4 h-4" />
                            Integrations
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {feature.integrations.map(integration => (
                              <span 
                                key={integration}
                                className="text-xs py-1 px-2 rounded-full bg-[#0c0521] border border-[#42f5b6]/20"
                              >
                                {integration}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Simple, non-glitchy learn more link */}
                      <div className="mt-6 text-right">
                        <a
                          href={`#${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="inline-flex items-center text-sm hover:underline transition-transform duration-300 hover:translate-x-1"
                          style={{ color: feature.color }}
                        >
                          <span>Learn more</span>
                          <ArrowRightIcon className="w-4 h-4 ml-1" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </Card3D>
              ))}
            </div>
          </div>
        </section>

        {/* The Challenge Section */}
        <section className="relative py-20 md:py-28 bg-[#0c0521]">
          <Card3D depth={60} className="w-full">
            <motion.div
              className="relative bg-gradient-to-r from-[#190b37]/90 to-[#0c0521]/90 rounded-2xl overflow-hidden backdrop-blur-lg border border-[#2f4faa]/20 p-12 md:p-16"
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
            >
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 80%, rgba(47,79,170,0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 20%, rgba(47,79,170,0.15) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, rgba(47,79,170,0.15) 0%, transparent 50%)',
                  ],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative z-10 max-w-7xl mx-auto">
                <motion.div 
                  className="max-w-3xl mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    The Enterprise AI Security <span className="text-[#42f5b6]">Challenge</span>
                  </h2>
                  <p className="text-xl text-gray-300">
                    Using consumer-grade AI tools in enterprise environments creates significant risks to intellectual property and sensitive data.
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {painPoints.map((point, index) => (
                    <motion.div
                      key={point.title}
                      className="bg-[#0c0521]/70 backdrop-blur-sm rounded-xl p-6 border border-[#2f4faa]/20"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(66,245,182,0.1)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 w-12 h-12 rounded-lg bg-[#190b37] border border-[#42f5b6] text-[#42f5b6] flex items-center justify-center flex-shrink-0">
                          <point.icon className="w-6 h-6" />
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold mb-2">{point.title}</h3>
                          <p className="text-gray-300">{point.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <motion.div 
                  className="mt-16 p-6 border border-[#42f5b6]/30 rounded-xl bg-[#190b37]/50 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <ShieldExclamationIcon className="w-12 h-12 text-[#42f5b6] flex-shrink-0" />
                    <p className="text-lg italic text-center md:text-left">
                      "Your enterprise's competitive edge depends on the security of your intellectual property — don't leave it to chance with unsecured AI tools."
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </Card3D>
        </section>

        {/* Improved How It Works Section with fixed animations */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#0f0828] to-[#0c0521]">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="max-w-3xl mx-auto text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.span 
                className="inline-block px-4 py-1 rounded-full bg-[#190b37] border border-[#42f5b6]/30 text-[#42f5b6] text-sm font-medium mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Simple Integration
              </motion.span>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">ShadowShield</span> Works
              </h2>
              
              <p className="text-xl text-gray-300">
                Our enterprise security platform connects seamlessly with your systems to provide comprehensive protection.
              </p>
            </motion.div>
            
            <div className="max-w-5xl mx-auto">
              <div className="relative">
                {/* Center timeline */}
                <motion.div 
                  className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#42f5b6]/0 via-[#42f5b6]/20 to-[#42f5b6]/0 transform -translate-x-1/2 hidden md:block"
                  initial={{ height: 0 }}
                  whileInView={{ height: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                {/* Steps with fixed animations */}
                <div className="space-y-20 md:space-y-32">
                  {howItWorks.map((step, index) => (
                    <motion.div 
                      key={step.step}
                      className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-12"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                    >
                      <div className={`z-10 relative ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:order-2 md:text-left md:pl-12'}`}>
                        {/* Step number bubble with fixed pulse effect */}
                        <div className={`hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-[#190b37] border-2 border-[#42f5b6] text-[#42f5b6] font-bold absolute top-1/2 ${index % 2 === 0 ? 'right-0 transform translate-x-1/2' : 'left-0 transform -translate-x-1/2'} -translate-y-1/2`}>
                          <div className="absolute w-full h-full rounded-full animate-ping opacity-30 bg-[#42f5b6]/10 duration-1000"></div>
                          {step.step}
                        </div>
                        
                        <div className="md:max-w-xs md:mx-auto">
                          <div className="flex md:hidden items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#190b37] border-2 border-[#42f5b6] text-[#42f5b6] font-bold">
                              {step.step}
                            </div>
                            <h3 className="text-2xl font-bold">{step.title}</h3>
                          </div>
                          
                          <h3 className="hidden md:block text-2xl font-bold mb-3">{step.title}</h3>
                          <p className="text-gray-300">{step.description}</p>
                        </div>
                      </div>
                      
                      <Card3D depth={30} className={`${index % 2 === 0 ? 'md:order-2' : ''}`}>
                        <motion.div 
                          className="bg-[#190b37]/80 backdrop-blur-sm rounded-xl p-8 border border-[#2f4faa]/20 h-full overflow-hidden"
                          whileHover={{ 
                            y: -5,
                            borderColor: "rgba(66, 245, 182, 0.3)",
                            boxShadow: "0 20px 40px -10px rgba(12, 5, 33, 0.7)" 
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Static background glow */}
                          <div 
                            className="absolute top-0 right-0 w-64 h-64 -mt-32 -mr-32 opacity-10"
                            style={{ 
                              background: 'radial-gradient(circle, #42f5b6 0%, transparent 70%)',
                              filter: 'blur(30px)'
                            }}
                          />
                          
                          <div className="h-full flex items-center justify-center relative z-10">
                            <div className="w-20 h-20 rounded-full bg-[#0c0521] border border-[#42f5b6]/30 flex items-center justify-center">
                              <step.icon className="w-10 h-10 text-[#42f5b6]" />
                            </div>
                          </div>
                        </motion.div>
                      </Card3D>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section with improved hover effects */}
        <section className="relative py-20 md:py-32 bg-[#0c0521]">
          <Card3D depth={40} className="w-full">
            <motion.div
              className="relative bg-gradient-to-r from-[#190b37]/90 to-[#0c0521]/90 rounded-2xl overflow-hidden backdrop-blur-lg border border-[#42f5b6]/10"
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
              whileHover={{ borderColor: "rgba(66, 245, 182, 0.2)" }}
            >
              {/* Better background effect */}
              <div
                className="absolute inset-0 opacity-20"
                style={{ 
                  background: 'radial-gradient(circle at 50% 50%, #42f5b6 0%, transparent 70%)',
                  filter: 'blur(80px)'
                }}
              />
              
              <div className="relative p-12 md:p-16 lg:p-20 z-10">
                <div className="max-w-3xl mx-auto text-center">
                  <motion.h2
                    className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">
                      Ready to Secure Your AI Infrastructure?
                    </span>
                  </motion.h2>

                  <motion.p
                    className="text-xl text-gray-200 mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Join leading enterprises in securing their AI interactions with ShadowShield
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {/* Clean button components with proper hover states */}
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link 
                        href="/auth/signin"
                        className="flex items-center justify-center gap-2 bg-[#42f5b6] text-[#0c0521] px-8 py-4 rounded-full font-medium shadow-lg transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(66,245,182,0.3)]"
                      >
                        <span>Start Free Trial</span>
                        <ArrowRightIcon className="w-5 h-5" />
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link 
                        href="#contact"
                        className="flex items-center justify-center gap-2 border-2 border-[#42f5b6]/70 text-[#42f5b6] px-8 py-4 rounded-full font-medium transition-colors duration-300 hover:bg-[#42f5b6]/10"
                      >
                        <span>Contact Sales</span>
                      </Link>
                    </motion.div>
                  </motion.div>
                  
                  {/* Client logos with improved styling */}
                  <motion.div
                    className="pt-12 border-t border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <motion.p 
                      className="text-sm text-gray-300 mb-8"
                    >
                      Trusted by leading enterprises
                    </motion.p>
                    
                    <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
                      {['ACME Corp', 'TechGiant', 'DataSafe', 'SecureAI'].map((company, i) => (
                        <motion.div
                          key={company}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                          className="px-6 py-2 rounded-lg bg-[#190b37] border border-[#42f5b6]/10 transition-all duration-300 hover:border-[#42f5b6]/30 hover:bg-[#190b37]/90"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-sm font-medium text-gray-300">{company}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </Card3D>
        </section>

        {/* Features Section - based on shadowshieldai "One product for simple AI governance" */}
        <section className="relative py-24 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col items-center text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                One product for simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">AI governance</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl">
                Monitor, control, and safeguard AI interactions in real time. Prevent unauthorized access, enforce compliance, and protect sensitive data with enterprise-grade security.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: 'Data Protection & Alerts',
                  description: 'Protect sensitive information with real-time alerts and AI-driven security enforcement.'
                },
                {
                  icon: DocumentCheckIcon,
                  title: 'Compliance & Governance',
                  description: 'Maintain regulatory standards and corporate policies with automated reporting and transparent oversight.'
                },
                {
                  icon: ChartBarIcon,
                  title: 'Dashboards & Reporting',
                  description: 'Gain real-time visibility into how AI is being used across your organization. Track key metrics around AI usage.'
                },
                {
                  icon: BeakerIcon,
                  title: 'Customized AI Productivity',
                  description: 'Tailor AI models to your unique data, boosting efficiency without compromising security.'
                },
                {
                  icon: ShieldExclamationIcon,
                  title: 'Multi-Model Access',
                  description: 'Securely integrate with all leading AI models including OpenAI, Anthropic, and Google Gemini.'
                },
                {
                  icon: CloudArrowUpIcon,
                  title: 'Enterprise Integrations',
                  description: 'Seamlessly connect with your existing security infrastructure for unified protection.'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-[#190b37] p-8 rounded-2xl border border-[#42f5b6]/20 hover:border-[#42f5b6]/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(66, 245, 182, 0.2)' }}
                >
                  <div className="w-12 h-12 bg-[#0c0521] rounded-full flex items-center justify-center mb-6 border border-[#42f5b6]/30">
                    <feature.icon className="w-6 h-6 text-[#42f5b6]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - based on shadowshieldai "About ShadowShield AI" */}
        <section className="relative py-24 bg-[#0c0521]/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col items-center text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#190b37] border border-[#42f5b6]/30 mb-6 backdrop-blur-sm">
                <span className="text-sm font-medium text-[#42f5b6]">About ShadowShield AI</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-4xl">
                "<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">Secure AI</span> adoption made simple—design, implement, and scale with full transparency and efficiency."
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                className="bg-[#190b37] p-8 rounded-2xl border border-[#42f5b6]/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-5xl font-bold mb-2 text-[#42f5b6]">$2.2M</div>
                <h3 className="text-xl font-bold mb-3 text-[#42f5b6]">Average Savings</h3>
                <div className="w-16 h-0.5 bg-[#42f5b6]/30 mb-4"></div>
                <p className="text-gray-300">Average cost savings from extensive use of AI in prevention</p>
              </motion.div>
              
              <motion.div
                className="bg-[#190b37] p-8 rounded-2xl border border-[#42f5b6]/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="text-5xl font-bold mb-2 text-[#42f5b6]">$4.9M</div>
                <h3 className="text-xl font-bold mb-3 text-[#42f5b6]">Cost of a Data Breach</h3>
                <div className="w-16 h-0.5 bg-[#42f5b6]/30 mb-4"></div>
                <p className="text-gray-300">Cost of a data breach per IBM's Cost of Data Breach 2024 Report</p>
              </motion.div>
              
              <motion.div
                className="bg-gradient-to-br from-[#42f5b6]/10 to-[#00a0cb]/10 p-8 rounded-2xl border border-[#42f5b6]/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="text-5xl font-bold mb-2">100+</div>
                <h3 className="text-xl font-bold mb-3">DLP Rule Presets</h3>
                <div className="w-16 h-0.5 bg-[#42f5b6]/30 mb-4"></div>
                <p className="text-gray-300">ShadowShield provides hundreds of DLP presets for all industries</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - based on shadowshieldai "Real experiences" */}
        <section className="relative py-24">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col items-center text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#190b37] border border-[#42f5b6]/30 mb-6 backdrop-blur-sm">
                <span className="text-sm font-medium text-[#42f5b6]">50+ Trusted Reviews</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Real experiences from businesses using <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">Shadow Shield</span> to secure their AI workflows.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  rating: 4.8,
                  text: '"ShadowShield AI has been a game-changer for our company. With its real-time monitoring and data protection features, we can confidently use AI without worrying about compliance risks. It\'s a crucial tool for any security-conscious enterprise."',
                  name: 'David L.',
                  title: 'Chief Security Officer',
                  company: 'Enterprise Co.'
                },
                {
                  rating: 5.0,
                  text: '"As an IT director, ensuring data security is my top priority. ShadowShield AI seamlessly integrates with our existing security tools, giving us full visibility and control over AI interactions. It\'s exactly what we needed."',
                  name: 'Sarah M.',
                  title: 'IT Director',
                  company: 'Tech Solutions'
                },
                {
                  rating: 4.9,
                  text: '"The DLP capabilities in ShadowShield have transformed how we approach AI security. The prebuilt rule templates saved us months of work and provide complete protection for our most sensitive data."',
                  name: 'Michael K.',
                  title: 'Security Engineer',
                  company: 'Global Finance'
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-white/5 to-transparent p-8 rounded-2xl border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="flex items-center mb-6">
                    <div className="text-4xl font-bold text-[#42f5b6] mr-4">{testimonial.rating}</div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Rating</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className={`w-5 h-5 ${i < Math.floor(testimonial.rating) ? 'text-[#42f5b6]' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-8">{testimonial.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#42f5b6] to-[#00a0cb] flex items-center justify-center mr-3">
                        <span className="text-[#0c0521] font-bold">{testimonial.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-gray-400">{testimonial.title}</p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-white/50">{testimonial.company}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - based on shadowshieldai FAQ */}
        <section className="relative py-24 bg-[#0c0521]/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col items-center text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                Frequently <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">asked</span> questions
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              {[
                {
                  question: 'What are the benefits of using ShadowShield AI?',
                  answer: 'Enterprise-Grade Security – Prevents unauthorized data exposure and safeguards sensitive AI interactions.\n\nCompliance & Governance – Enforces GDPR, HIPAA, and SOC 2 compliance with adaptive security policies.\n\nMulti-LLM Compatibility – Securely integrates with OpenAI, Anthropic Claude, and Google Gemini.\n\nReal-Time Monitoring – Tracks AI usage, blocks risky queries, and provides deep analytics.\n\nSeamless Integrations – Works with enterprise security tools like Google Cloud DLP, Forcepoint, and Microsoft DLP.'
                },
                {
                  question: 'How do you protect client data?',
                  answer: 'ShadowShield AI protects client data through end-to-end encryption, ensuring all AI queries remain secure. Real-time DLP enforcement prevents unauthorized data exposure, while role-based access control limits AI interactions based on security policies. Comprehensive audit logs provide transparency and compliance with industry standards like GDPR and HIPAA.'
                },
                {
                  question: 'Why do I need your software solutions?',
                  answer: 'ShadowShield AI is essential for enterprises that need to secure AI interactions, prevent data leaks, and enforce compliance with regulations like GDPR and HIPAA. It provides real-time monitoring, adaptive security policies, and seamless integration with enterprise security tools.'
                },
                {
                  question: 'What features are included in your software?',
                  answer: 'ShadowShield AI provides enterprise-grade security for AI interactions, including real-time monitoring, DLP enforcement, end-to-end encryption, and customizable governance policies. It supports multi-LLM compatibility with OpenAI, Anthropic, and Gemini models, integrates seamlessly with enterprise security tools, and offers user-based analytics, security alerts, and compliance enforcement.'
                }
              ].map((faq, index) => (
                <motion.div 
                  key={index}
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <motion.div 
                    className="flex items-center justify-between p-6 bg-[#190b37] rounded-t-xl border border-[#42f5b6]/20 cursor-pointer"
                    onClick={() => {}}
                    whileHover={{ backgroundColor: 'rgba(66, 245, 182, 0.05)' }}
                  >
                    <h3 className="text-xl font-medium">{faq.question}</h3>
                    <PlusIcon className="w-5 h-5 text-[#42f5b6]" />
                  </motion.div>
                  <div className="p-6 bg-[#0c0521]/80 rounded-b-xl border border-t-0 border-[#42f5b6]/10">
                    <p className="text-gray-300 whitespace-pre-line">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners/Integrations Section - based on shadowshieldai "Enterprise-Grade AI Access" */}
        <section className="relative py-24 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <motion.div 
              className="flex flex-col items-center text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-sm font-medium text-[#42f5b6] mb-4">Enterprise-Grade AI Access</div>
              <h2 className="text-4xl font-bold mb-8">
                Seamless integration with leading AI platforms and <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42f5b6] to-[#00a0cb]">security solutions.</span>
              </h2>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mb-12"
              >
                <Link 
                  href="/request-demo"
                  className="flex items-center justify-center gap-2 bg-[#42f5b6] text-[#0c0521] px-8 py-4 rounded-full font-medium shadow-lg hover:shadow-[#42f5b6]/20 hover:shadow-xl transition-all duration-300"
                >
                  <span>Request a Demo</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-center opacity-70">
              {[...Array(10)].map((_, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-center h-16"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <CpuChipIcon className="w-6 h-6 text-white/70" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Background gradient elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-[100px] bg-[#42f5b6]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[100px] bg-[#00a0cb]"></div>
        </section>

        {/* Original SectionDivider */}
        <SectionDivider />
      </main>
    </div>
  );
}
