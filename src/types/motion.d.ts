// This declaration file fixes the TypeScript errors with framer-motion components
import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface MotionProps extends HTMLMotionProps<any> {
    className?: string;
    style?: React.CSSProperties;
    src?: string;
    alt?: string;
  }
} 