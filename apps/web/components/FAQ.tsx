'use client';

import { useState, useRef, useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  icon?: string;
}

const faqs: FAQItem[] = [
  {
    question: "What does AI Lighthouse analyze?",
    answer: "We scan your website's content, structure, metadata, and schema markup to evaluate how well AI systems (like ChatGPT, Perplexity, Claude, and search engines) can understand and accurately represent your information.",
    icon: "🔍"
  },
  {
    question: "How is the AI Readiness Score calculated?",
    answer: "The score is based on five dimensions: Content Quality (clarity and completeness), Extractability (how easily AI can parse your content), Comprehensibility (logical structure), Discoverability (metadata and schema), and Trustworthiness (authority signals). Each dimension is weighted based on its impact on AI understanding.",
    icon: "📊"
  },
  {
    question: "What's the difference between basic and LLM-powered analysis?",
    answer: "Basic analysis uses rule-based checks for technical issues like missing metadata, schema problems, and structural errors. LLM-powered analysis adds deeper semantic understanding — it can evaluate if your content is clear, identify potential misinterpretations, and provide more nuanced recommendations.",
    icon: "🤖"
  },
  {
    question: "Is my website data stored?",
    answer: "We only temporarily cache scan results to improve performance. No persistent user data is stored, and cached data is automatically cleared. You can request data deletion at any time through the privacy controls.",
    icon: "🔒"
  },
  {
    question: "Why does AI readiness matter?",
    answer: "AI systems increasingly answer questions about businesses, products, and services. If your website isn't optimized for AI comprehension, these systems may provide incomplete or inaccurate information about you — or worse, hallucinate facts that aren't true.",
    icon: "💡"
  },
  {
    question: "How long does a scan take?",
    answer: "Basic scans typically complete in 15-30 seconds. LLM-powered analysis may take 30-90 seconds depending on the model selected and your website's size.",
    icon: "⏱️"
  },
  {
    question: "Can I scan any website?",
    answer: "You can scan publicly accessible websites. Some sites may block automated access, in which case the scan will return limited results. We respect robots.txt directives.",
    icon: "🌐"
  }
];

function FAQItemComponent({ faq, isOpen, onToggle, index }: { 
  faq: FAQItem; 
  isOpen: boolean; 
  onToggle: () => void;
  index: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all duration-300 ${
        isOpen 
          ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-lg flex-shrink-0">{faq.icon}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm flex-1">
          {faq.question}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div 
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: height }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-400 pl-11">
          {faq.answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
    setExpandAll(false);
  };

  const toggleAll = () => {
    setExpandAll(!expandAll);
    setOpenIndex(null);
  };

  return (
    <section className="max-w-2xl mx-auto mt-12 mb-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h2>
        <button
          onClick={toggleAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <FAQItemComponent
            key={index}
            faq={faq}
            isOpen={expandAll || openIndex === index}
            onToggle={() => toggle(index)}
            index={index}
          />
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
          Still have questions?{' '}
          <a 
            href="https://github.com/fayeed/ai-lighthouse/discussions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Start a discussion on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
