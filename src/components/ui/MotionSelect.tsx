'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
}

interface MotionSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function MotionSelect({ options, value, onChange, label, className = '' }: MotionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousOptionsRef = useRef<Option[]>([]);
  const isUpdatingInternally = useRef(false);

  // Update internal value when prop changes
  useEffect(() => {
    console.log(`MotionSelect [${label}] - Prop value changed:`, value);
    
    // Skip if we're doing an internal update to avoid loops
    if (isUpdatingInternally.current) {
      console.log(`MotionSelect [${label}] - Skipping update as it's happening internally`);
      return;
    }
    
    // Always update the internal state to match the prop
    setSelectedValue(value);
  }, [value, label]);

  // Handle options changing (like when provider changes)
  useEffect(() => {
    // Check if options array has changed significantly by comparing values
    const optionsChanged = JSON.stringify(options.map(o => o.value)) !== 
                          JSON.stringify(previousOptionsRef.current.map(o => o.value));
    
    if (optionsChanged) {
      console.log(`MotionSelect [${label}] - Options changed from:`, 
        previousOptionsRef.current.map(o => o.value), 
        'to:', options.map(o => o.value));
      
      // Store the new options for future comparison
      previousOptionsRef.current = [...options];
      
      // If current value is not in new options, reset to first available option
      const valueExists = options.some(opt => opt.value === selectedValue);
      if (!valueExists && options.length > 0) {
        console.log(`MotionSelect [${label}] - Selected value ${selectedValue} not in new options, resetting to:`, options[0].value);
        
        // Set the internal flag to prevent loops
        isUpdatingInternally.current = true;
        
        // Update our internal state
        setSelectedValue(options[0].value);
        
        // Also notify parent of the change to maintain consistency
        if (options[0].value !== value) {
          console.log(`MotionSelect [${label}] - Notifying parent of change to:`, options[0].value);
          onChange(options[0].value);
        }
        
        // Reset the flag after a longer delay
        setTimeout(() => {
          isUpdatingInternally.current = false;
          console.log(`MotionSelect [${label}] - Reset isUpdatingInternally=false`);
        }, 100);
      }
    }
  }, [options, selectedValue, value, onChange, label]);

  // Find the selected option (or default to first option if none found)
  const selectedOption = options.find(opt => opt.value === selectedValue) || 
                        (options.length > 0 ? options[0] : { value: '', label: 'No options available' });

  // For debugging - log when props change
  useEffect(() => {
    console.log(`MotionSelect [${label}] - Current value:`, value);
    console.log(`MotionSelect [${label}] - Available options:`, options);
    console.log(`MotionSelect [${label}] - Selected option:`, selectedOption);
  }, [value, options, selectedOption, label]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (optionValue: string) => {
    console.log(`MotionSelect [${label}] - Option selected:`, optionValue);
    
    // Set the internal flag to prevent loops
    isUpdatingInternally.current = true;
    console.log(`MotionSelect [${label}] - Set isUpdatingInternally=true`);
    
    // Update local state first to ensure UI is responsive
    setSelectedValue(optionValue);
    setIsOpen(false);
    
    // Then propagate change to parent component
    if (optionValue !== value) {
      console.log(`MotionSelect [${label}] - Notifying parent of change from ${value} to:`, optionValue);
      onChange(optionValue);
    }
    
    // Reset the flag after a longer delay
    setTimeout(() => {
      isUpdatingInternally.current = false;
      console.log(`MotionSelect [${label}] - Reset isUpdatingInternally=false`);
    }, 100);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {label}
        </label>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-[#190b37] text-white rounded-lg flex items-center justify-between hover:bg-[#2d1657] transition-colors"
        key={`button-${selectedValue}`} // Force remount when selected value changes
      >
        <span>{selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#190b37] border border-[#2d1657] rounded-lg shadow-lg overflow-hidden"
          >
            <motion.div
              className="py-1"
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                closed: {
                  transition: {
                    staggerChildren: 0.05,
                    staggerDirection: -1
                  }
                }
              }}
            >
              {options.map((option) => (
                <motion.div
                  key={option.value}
                  variants={{
                    open: { opacity: 1, y: 0 },
                    closed: { opacity: 0, y: -10 }
                  }}
                >
                  <button
                    onClick={() => handleOptionSelect(option.value)}
                    className={`w-full px-4 py-2 text-left hover:bg-[#2d1657] transition-colors ${
                      option.value === selectedValue
                        ? 'text-[#00a0cb] bg-[#2d1657]'
                        : 'text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 