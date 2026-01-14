import React from 'react';
import { ArrowRight } from "lucide-react";
import { cn } from '../lib/utils';
import './InteractiveHoverButton.css';

export function InteractiveHoverButton({
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn("interactive-hover-button", className)}
      {...props}
    >
      <div className="interactive-hover-button__dot"></div>
      <div className="interactive-hover-button__content">
        <span className="interactive-hover-button__text">
          {children}
        </span>
      </div>
      <div className="interactive-hover-button__hover-content">
        <span>{children}</span>
        <ArrowRight className="interactive-hover-button__arrow" />
      </div>
    </button>
  );
}

