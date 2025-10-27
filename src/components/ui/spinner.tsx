import React from 'react';
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const spinnerSizeClasses = {
  small: "h-4 w-4",
  medium: "h-8 w-8",
  large: "h-20 w-20", // Increased size for large spinner
};

const spinnerSizeMap = {
  small: "16px",
  medium: "32px",
  large: "80px",
};

const Spinner: React.FC<SpinnerProps> = React.memo(
  ({ size = 'medium', className }) => {
    return (
      <div
        className={cn(
          "spinner-ripple text-orange-500",
          spinnerSizeClasses[size],
          className
        )}
        style={{ '--spinner-size': spinnerSizeMap[size] } as React.CSSProperties}
      >
        <div></div>
        <div></div>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

export default Spinner;