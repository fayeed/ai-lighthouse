'use client';

import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  currentStep: string;
  progress: number;
  message: string;
  enableLLM: boolean;
}

const STEPS = {
  basic: ['fetch', 'parse', 'rules', 'extract', 'processing', 'scoring', 'finalizing'],
  llm: ['fetch', 'parse', 'rules', 'extract', 'llm', 'processing', 'scoring', 'finalizing'],
};

const STEP_LABELS: Record<string, string> = {
  starting: 'Starting analysis',
  fetch: 'Fetching website',
  parse: 'Parsing HTML structure',
  rules: 'Running audit rules',
  extract: 'Analyzing extractability',
  llm: 'AI analyzing content',
  processing: 'Processing results',
  scoring: 'Calculating score',
  finalizing: 'Generating report',
};

export default function LoadingProgress({ currentStep, progress, message, enableLLM }: LoadingProgressProps) {
  const steps = enableLLM ? STEPS.llm : STEPS.basic;
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-fade-in-up">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Analyzing...
          </h3>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {progress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current step message */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {message || STEP_LABELS[currentStep] || 'Processing...'}
        </p>

        {/* Steps list */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isActive = step === currentStep;
            const isComplete = currentIndex > index || (currentIndex === index && progress > 90);
            const isPending = currentIndex < index;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isPending ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 w-4 h-4">
                  {isComplete && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && !isComplete && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`text-sm ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : isComplete
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
