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
    <div className="text-center mt-5">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
          OR TRY AN EXAMPLE:
        </span>
        {examples.map((example) => (
          <button
            key={example.url}
            onClick={() => onSelect(example.url)}
            disabled={disabled}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-gray-400 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
