import React from 'react';
import { cn } from '../utils/cn';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 24 }) => {
  return (
    <img 
      src="/logo.svg" 
      alt="QuantLab Logo" 
      width={size} 
      height={size} 
      className={cn("object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
};
