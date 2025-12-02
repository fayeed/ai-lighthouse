import { analyzeUrlWithRules } from './scanWithRules.js';

const result = await analyzeUrlWithRules('https://www.janus.com/', { maxChunkTokens: 1200 });
console.log(result.issues);
