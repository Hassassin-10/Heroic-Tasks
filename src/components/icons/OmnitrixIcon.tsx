
// src/components/icons/OmnitrixIcon.tsx
import type React from 'react';

const OmnitrixIcon = ({ className }: { className?: string }) => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Omnitrix Icon"
  >
    <circle cx="100" cy="100" r="95" fill="hsl(var(--primary-foreground))" stroke="currentColor" strokeWidth="8"/>
    <circle cx="100" cy="100" r="70" fill="currentColor"/>
    <path d="M60 60 L90 100 L60 140 L70 150 L100 110 L130 150 L140 140 L110 100 L140 60 L130 50 L100 90 L70 50 Z"
          fill="hsl(var(--primary-foreground))" />
    <circle cx="100" cy="100" r="10" fill="currentColor"/>
  </svg>
);

export default OmnitrixIcon;
