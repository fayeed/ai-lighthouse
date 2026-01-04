'use client';

interface ExampleSitesProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

const examples = [
  { url: 'https://stripe.com', name: 'Stripe', description: 'Well-structured site' },
  { url: 'https://linear.app', name: 'Linear', description: 'Modern SaaS' },
  { url: 'https://notion.so', name: 'Notion', description: 'Popular tool' },
];

export default function ExampleSites({ onSelect, disabled }: ExampleSitesProps) {
  return (
    <div className="text-center mt-3">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
        Or try an example:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {examples.map((example) => (
          <button
            key={example.url}
            onClick={() => onSelect(example.url)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
