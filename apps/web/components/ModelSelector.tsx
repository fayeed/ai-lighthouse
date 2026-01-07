'use client';

import { useState } from 'react';
import { ChevronDown, Scan } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AnimatePresence, motion } from 'framer-motion';
import ScanEstimate from './ScanEstimate';

export interface ModelConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
  enableLLM?: boolean;
  provider?: string;
  modelConfig?: ModelConfig;
}

const providerModels = {
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free', 'nex-agi/deepseek-v3.1-nex-n1:free'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['qwen2.5:0.5b', 'llama3.2:latest', 'mistral:latest'],
};

const isDev = process.env.NODE_ENV === 'development';

export default function ModelSelector({ value, onChange, enableLLM, provider, modelConfig }: ModelSelectorProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProviderChange = (provider: ModelConfig['provider']) => {
    const defaultModel = providerModels[provider][0];
    onChange({
      provider,
      model: defaultModel,
      apiKey: provider === 'openrouter' || provider === 'ollama' ? undefined : value.apiKey,
      baseUrl: provider === 'ollama' ? 'http://localhost:11434' : undefined,
    });
  };

  const handleModelChange = (model: string) => {
    onChange({ ...value, model });
  };

  const handleApiKeyChange = (apiKey: string) => {
    onChange({ ...value, apiKey });
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    onChange({ ...value, baseUrl });
  };

  return (
              <AnimatePresence>
                {enableLLM && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-left space-y-6 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest">AI Model Configuration</h4>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Provider</p>
                        <div className="flex flex-wrap gap-2">
                          {["Openrouter", "Openai", "Anthropic", "Gemini", "Ollama"].map((p) => (
                            <Button key={p} variant="outline" size="sm" className={`rounded-lg border-white/5 text-[10px] font-bold ${p === 'Openrouter' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/[0.02] text-white/40'}`}>
                              {p}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-white/20">Model</p>
                        <div className="relative">
                          <Input 
                            readOnly 
                            value="meta-llama/llama-3.3-70b-instruct:free" 
                            className="bg-white/[0.02] border-white/5 text-xs text-white/60 h-10 pr-10"
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex gap-3">
                        <span className="text-yellow-500">💡</span>
                        <p className="text-[10px] text-yellow-500/80 leading-relaxed font-medium">
                          <span className="font-bold">Note:</span> Free models available! API key configured on backend.
                        </p>
                      </div>
                    </div>
                    <ScanEstimate 
                      enableLLM={true}
                      provider={value.provider}
                      model={value.model}
                    />  
                  </motion.div>
                )}
              </AnimatePresence>
  );
}
