'use client';

import { useState } from 'react';

interface Fact {
  id?: string;
  statement: string;
  category?: string;
  confidence?: number;
  sourceContext?: string;
}

interface Evidence {
  textSnippet?: string;
  similarity?: number;
}

interface Contradiction {
  textSnippet: string;
}

interface Verification {
  fact: Fact;
  verified?: boolean;
  evidence?: Evidence;
  contradictions?: Contradiction[];
}

interface FactVerificationListProps {
  verifications: Verification[];
}

export default function FactVerificationList({ verifications }: FactVerificationListProps) {
  const [showVerifiedFacts, setShowVerifiedFacts] = useState(true);
  const [showUnverifiedFacts, setShowUnverifiedFacts] = useState(true);
  const [showContradictedFacts, setShowContradictedFacts] = useState(true);

  // Separate facts by verification status
  const contradictedFacts = verifications.filter(
    (v) => v.contradictions && v.contradictions.length > 0
  );
  
  const verifiedFacts = verifications.filter(
    (v) => v.verified && (!v.contradictions || v.contradictions.length === 0)
  );
  
  const unverifiedFacts = verifications.filter(
    (v) => !v.verified && (!v.contradictions || v.contradictions.length === 0)
  );

  if (verifications.length === 0) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-zinc-800 p-3 rounded">
        No facts extracted for verification. Enable LLM analysis to extract and verify facts.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="space-y-4">
        {/* Verified Facts */}
        {verifiedFacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-blue-700 dark:text-blue-400">✓ Verified Facts ({verifiedFacts.length}):</strong>
              <button
                onClick={() => setShowVerifiedFacts(!showVerifiedFacts)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {showVerifiedFacts ? '▼ Collapse' : '▶ Expand'}
              </button>
            </div>
            {showVerifiedFacts && (
              <div className="space-y-2 mt-2">
                {verifiedFacts.map((verification, idx) => (
                  <div key={verification.fact.id || idx} className="bg-zinc-800 p-3 rounded border-l-4 border-blue-500 dark:border-blue-600">
                    <div className="text-white text-sm font-medium">{verification.fact.statement}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Verified
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {verification.fact.category || 'general'}
                      </span>
                      {verification.fact.confidence !== undefined && (
                        <span className="text-xs text-gray-400">
                          {Math.round(verification.fact.confidence * 100)}% confidence
                        </span>
                      )}
                      {verification.evidence?.similarity !== undefined && (
                        <span className="text-xs text-blue-400">
                          {Math.round(verification.evidence.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                    {verification.evidence?.textSnippet && (
                      <div className="mt-2 text-xs text-gray-400 bg-zinc-900 p-2 rounded">
                        <strong className="text-gray-300">Found in:</strong> {verification.evidence.textSnippet.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unverified Facts */}
        {unverifiedFacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-yellow-700 dark:text-yellow-400">⚠ Unverified Facts ({unverifiedFacts.length}):</strong>
              <button
                onClick={() => setShowUnverifiedFacts(!showUnverifiedFacts)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {showUnverifiedFacts ? '▼ Collapse' : '▶ Expand'}
              </button>
            </div>
            
            {showUnverifiedFacts && (
              <>
                {/* Source Link Recommendation Box */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-2 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-400 font-semibold mb-2">
                        Why these couldn't be verified:
                      </p>
                      <p className="text-sm text-gray-300 mb-3">
                        "LLM could not find supporting evidence in the page."
                      </p>
                      <p className="text-sm text-yellow-400 font-semibold mb-2">
                        Best practice:
                      </p>
                      <p className="text-sm text-gray-300">
                        "Consider providing a link or citation if this is important."
                      </p>
                      <p className="text-xs text-gray-400 mt-3 italic border-t border-yellow-500/20 pt-2">
                        This teaches good content practices and helps users trust your information.
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">These facts need manual verification as they couldn't be confirmed in the page content</p>
                <div className="space-y-2 mt-2">
                  {unverifiedFacts.map((verification, idx) => (
                    <div key={verification.fact.id || idx} className="bg-zinc-800 p-3 rounded border-l-4 border-yellow-500 dark:border-yellow-600">
                      <div className="text-white text-sm font-medium">{verification.fact.statement}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          Needs Verification
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {verification.fact.category || 'general'}
                        </span>
                        {verification.fact.confidence !== undefined && (
                          <span className="text-xs text-gray-400">
                            {Math.round(verification.fact.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {verification.fact.sourceContext && (
                        <div className="mt-2 text-xs text-gray-400 bg-zinc-900 p-2 rounded">
                          <strong className="text-gray-300">Source context:</strong> {verification.fact.sourceContext}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Contradicted Facts */}
        {contradictedFacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-red-700 dark:text-red-400">🔴 Contradicted Facts ({contradictedFacts.length}):</strong>
              <button
                onClick={() => setShowContradictedFacts(!showContradictedFacts)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {showContradictedFacts ? '▼ Collapse' : '▶ Expand'}
              </button>
            </div>
            {showContradictedFacts && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">These facts have contradictions found in the content</p>
                <div className="space-y-2 mt-2">
                  {contradictedFacts.map((verification, idx) => (
                    <div key={verification.fact.id || idx} className="bg-zinc-800 p-3 rounded border-l-4 border-red-500 dark:border-red-600">
                      <div className="text-white text-sm font-medium">{verification.fact.statement}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Contradicted
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {verification.fact.category || 'general'}
                        </span>
                        {verification.fact.confidence !== undefined && (
                          <span className="text-xs text-gray-400">
                            {Math.round(verification.fact.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {verification.contradictions && verification.contradictions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {verification.contradictions.map((contradiction, cIdx) => (
                            <div key={cIdx} className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2 rounded">
                              <strong className="text-red-400">⚠ Contradiction {cIdx + 1}:</strong> {contradiction.textSnippet.substring(0, 150)}...
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
