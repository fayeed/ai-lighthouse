'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import 'react-tooltip/dist/react-tooltip.css';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-pulse">🏮</div>
          <h1 className="text-2xl font-bold text-white mb-3">AI Lighthouse</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    }>
    </Suspense>
  );
}
