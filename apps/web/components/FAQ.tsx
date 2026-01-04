'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What does AI Lighthouse analyze?",
    answer: "We scan your website's content, structure, metadata, and schema markup to evaluate how well AI systems (like ChatGPT, Perplexity, Claude, and search engines) can understand and accurately represent your information."
  },
  {
    question: "How is the AI Readiness Score calculated?",
    answer: "The score is based on five dimensions: Content Quality (clarity and completeness), Extractability (how easily AI can parse your content), Comprehensibility (logical structure), Discoverability (metadata and schema), and Trustworthiness (authority signals). Each dimension is weighted based on its impact on AI understanding."
  },
  {
    question: "What's the difference between basic and LLM-powered analysis?",
    answer: "Basic analysis uses rule-based checks for technical issues like missing metadata, schema problems, and structural errors. LLM-powered analysis adds deeper semantic understanding — it can evaluate if your content is clear, identify potential misinterpretations, and provide more nuanced recommendations."
  },
  {
    question: "Is my website data stored?",
    answer: "We only temporarily cache scan results to improve performance. No persistent user data is stored, and cached data is automatically cleared. You can request data deletion at any time through the privacy controls."
  },
  {
    question: "Why does AI readiness matter?",
    answer: "AI systems increasingly answer questions about businesses, products, and services. If your website isn't optimized for AI comprehension, these systems may provide incomplete or inaccurate information about you — or worse, hallucinate facts that aren't true."
  },
  {
    question: "How long does a scan take?",
    answer: "Basic scans typically complete in 15-30 seconds. LLM-powered analysis may take 30-90 seconds depending on the model selected and your website's size."
  },
  {
    question: "Can I scan any website?",
    answer: "You can scan publicly accessible websites. Some sites may block automated access, in which case the scan will return limited results. We respect robots.txt directives."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-2xl mx-auto mt-12 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {faq.question}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openIndex === index && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
