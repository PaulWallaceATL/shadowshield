'use client';

import { Cursor } from "motion-cursor";

export const CustomCursor = () => {
  return (
    <Cursor
      style={{
        backgroundColor: "#f5f5f5",
        width: "12px",
        height: "12px",
        mixBlendMode: "exclusion",
        pointerEvents: "none",
        zIndex: 9999,
      }}
      variants={{
        default: {
          scale: 1,
          opacity: 1,
        },
        button: {
          scale: 2,
          backgroundColor: "#f5f5f5",
          mixBlendMode: "exclusion",
        },
        text: {
          width: "2px",
          height: "24px",
          backgroundColor: "#f5f5f5",
        },
        link: {
          scale: 2,
          backgroundColor: "#f5f5f5",
          mixBlendMode: "exclusion",
        },
        disabled: {
          scale: 1,
          opacity: 0.5,
        }
      }}
      spring={{
        damping: 35,
        stiffness: 900,
        mass: 0.2,
      }}
    />
  );
};

export default CustomCursor; 