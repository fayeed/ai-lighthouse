'use client';

import { useState } from 'react';

export default function PrivacyNotice() {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('privacy-notice-seen');
    }
    return false;
  });
  const [showDetails, setShowDetails] = useState(false);

  const acknowledge = () => {
    localStorage.setItem('privacy-notice-seen', 'true');
    setShowBanner(false);
  };

  const handleDataRequest = async (type: 'access' | 'delete' | 'export') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/gdpr/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (type === 'export' && data) {
        // Download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-lighthouse-temp-data-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Data exported successfully! Note: This is only temporary cache data - no persistent user data exists.');
      } else {
        alert(data.message || data.note || `Request ${type} completed`);
      }
    } catch (error) {
      console.error(`Failed to ${type} data:`, error);
      alert(`Failed to ${type} data. Please try again.`);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🔒 Privacy Notice
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>We don't store user data.</strong> We only use temporary caching (30 days) and your IP for rate limiting (auto-expires).
              {' '}
              {!showDetails && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Learn more
                </button>
              )}
            </p>

            {showDetails && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <p><strong>What we DON'T collect:</strong> No user accounts, no emails, no tracking, no analytics</p>
                <p><strong>Temporary data only:</strong> IP (rate limits: 15min-1hr), Audit cache (30 days, content-based not user-based)</p>
                <p><strong>Auto-expiry:</strong> All data automatically deletes when expired</p>
                <p><strong>Your rights:</strong> View or delete temporary data anytime (though it auto-expires anyway)</p>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <button
                    onClick={() => handleDataRequest('access')}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    View temp data
                  </button>
                  <button
                    onClick={() => handleDataRequest('export')}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    Export temp data
                  </button>
                  <button
                    onClick={() => handleDataRequest('delete')}
                    className="text-red-600 dark:text-red-400 hover:underline text-xs"
                  >
                    Delete temp data
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={acknowledge}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
