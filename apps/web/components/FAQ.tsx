'use client';

import { motion } from 'framer-motion';
import { Search, BarChart3, Cpu, Lock, Zap, Clock, Globe } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';

interface FAQItem {
  question: string;
  answer: string;
  icon: any;
}

const faqs: FAQItem[] = [
  {
    question: "What does AI Lighthouse analyze?",
    answer: "We scan your website's content, structure, metadata, and schema markup to evaluate how well AI systems (like ChatGPT, Perplexity, Claude, and search engines) can understand and accurately represent your information.",
    icon: Search
  },
  {
    question: "How is the AI Readiness Score calculated?",
    answer: "The score is based on five dimensions: Content Quality (clarity and completeness), Extractability (how easily AI can parse your content), Comprehensibility (logical structure), Discoverability (metadata and schema), and Trustworthiness (authority signals). Each dimension is weighted based on its impact on AI understanding.",
    icon: BarChart3
  },
  {
    question: "What's the difference between basic and LLM-powered analysis?",
    answer: "Basic analysis uses rule-based checks for technical issues like missing metadata, schema problems, and structural errors. LLM-powered analysis adds deeper semantic understanding — it can evaluate if your content is clear, identify potential misinterpretations, and provide more nuanced recommendations.",
    icon: Cpu
  },
  {
    question: "Is my website data stored?",
    answer: "We only temporarily cache scan results to improve performance. No persistent user data is stored, and cached data is automatically cleared. You can request data deletion at any time through the privacy controls.",
    icon: Lock
  },
  {
    question: "Why does AI readiness matter?",
    answer: "AI systems increasingly answer questions about businesses, products, and services. If your website isn't optimized for AI comprehension, these systems may provide incomplete or inaccurate information about you — or worse, hallucinate facts that aren't true.",
    icon: Zap
  },
  {
    question: "How long does a scan take?",
    answer: "Basic scans typically complete in 15-30 seconds. LLM-powered analysis may take 30-90 seconds depending on the model selected and your website's size.",
    icon: Clock
  },
  {
    question: "Can I scan any website?",
    answer: "You can scan publicly accessible websites. Some sites may block automated access, in which case the scan will return limited results. We respect robots.txt directives.",
    icon: Globe
  }
];

export default function FAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="max-w-2xl mx-auto pt-32 space-y-12"
    >
      <h2 className="text-3xl font-display font-bold tracking-tight text-white">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="space-y-4 text-left">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-none">
            <AccordionTrigger className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:no-underline transition-all group">
              <div className="flex items-center gap-4">
                <faq.icon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 text-sm text-white/40 font-light leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5">
        <p className="text-xs text-white/40">
          Still have questions? <a href="https://github.com/fayeed/ai-lighthouse/discussions" target="_blank" rel="noopener noreferrer" className="text-white hover:underline underline-offset-4 transition-all">Start a discussion on GitHub</a>
        </p>
      </div>
    </motion.div>
  );
}
