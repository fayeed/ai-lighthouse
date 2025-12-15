'use client';

import { Tooltip as ReactTooltip } from 'react-tooltip';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  id?: string;
}

export default function Tooltip({ content, children, id }: TooltipProps) {
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <>
      <span 
        data-tooltip-id={tooltipId} 
        {...(typeof content === 'string' ? { 'data-tooltip-content': content } : {})}
        className="cursor-help"
      >
        {children}
      </span>
      <ReactTooltip
        id={tooltipId}
        place="right"
        style={{
          backgroundColor: '#1f2937',
          color: '#fff',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          maxWidth: '20rem',
          zIndex: 50,
        }}
      >
        {typeof content !== 'string' && content}
      </ReactTooltip>
    </>
  );
}
