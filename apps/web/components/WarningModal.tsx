interface WarningModalProps {
  show: boolean;
  onClose: () => void;
  message: { message: string; details?: string };
}

export default function WarningModal({ show, onClose, message }: WarningModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              LLM Rate Limit Reached
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {message.message}
            </p>
            {message.details && (
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm text-gray-600 dark:text-gray-400 mb-3">
                <strong>Details:</strong> {message.details}
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your scan completed successfully with basic features. To use AI-enhanced features, you can:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>Wait and try again later</li>
              <li>Add credits to your LLM provider account</li>
              <li>Use a different API key</li>
              <li>Disable LLM features and run basic scans</li>
            </ul>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
