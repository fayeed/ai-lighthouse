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
    <div className="text-center mt-6">
      <p className="text-sm text-gray-500 mb-3">
        Or try an example:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {examples.map((example) => (
          <button
            key={example.url}
            onClick={() => onSelect(example.url)}
            disabled={disabled}
            className="px-4 py-2 text-sm bg-zinc-900 hover:bg-zinc-800 text-gray-300 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
