'use client';

import * as Accordion from '@radix-ui/react-accordion';

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

export default function FAQ() {
  return (
    <section className="w-full max-w-2xl mx-auto mt-16 mb-12 px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
        Frequently Asked Questions
      </h2>

      <Accordion.Root type="single" collapsible defaultValue="item-0" className="space-y-2 w-full">
        {faqs.map((faq, index) => (
          <Accordion.Item
            key={index}
            value={`item-${index}`}
            className="w-full border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950 transition-colors duration-200 hover:border-zinc-800"
          >
            <Accordion.Header className="w-full">
              <Accordion.Trigger className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-white/5 transition-colors group">
                <span className="text-base flex-shrink-0">{faq.icon}</span>
                <span className="font-medium text-white text-sm flex-1 pr-4">
                  {faq.question}
                </span>
                <svg
                  className="w-4 h-4 text-gray-600 transition-transform duration-200 flex-shrink-0 group-data-[state=open]:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="px-4 pb-4 text-sm text-gray-500 leading-relaxed pl-10">
                {faq.answer}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      {/* Contact CTA */}
      <div className="mt-6 p-4 bg-zinc-950 rounded-lg border border-zinc-900">
        <p className="text-sm text-gray-500 text-center">
          Still have questions?{' '}
          <a
            href="https://github.com/fayeed/ai-lighthouse/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 underline font-medium transition-colors"
          >
            Start a discussion on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
