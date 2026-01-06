import React from 'react';
import ScoringGuide from '../../components/ScoringGuide';

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center">AI Readiness Scoring Guide</h1>
        <ScoringGuide />
        <div className="mt-8 text-center">
          <a href="/" className="text-teal-400 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
