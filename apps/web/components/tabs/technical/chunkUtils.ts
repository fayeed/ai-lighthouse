export interface ChunkQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
  color: string;
  emoji: string;
}

export const getTokenHeatColor = (tokenCount: number, avgTokens: number): string => {
  const ratio = tokenCount / avgTokens;
  if (ratio > 1.5) return 'bg-red-500';
  if (ratio > 1.2) return 'bg-orange-500';
  if (ratio > 0.8) return 'bg-green-500';
  if (ratio > 0.5) return 'bg-yellow-500';
  return 'bg-blue-500';
};

export const getChunkQuality = (chunk: any): ChunkQuality => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check token count
  if (chunk.tokenCount > 1000) {
    issues.push('Very large chunk (>1000 tokens)');
    recommendations.push('Consider splitting into smaller sections with subheadings');
  } else if (chunk.tokenCount < 50) {
    issues.push('Very small chunk (<50 tokens)');
    recommendations.push('Could be merged with adjacent chunks for better context');
  }
  
  // Check noise ratio
  if (chunk.noiseRatio > 0.5) {
    issues.push('High noise ratio (>50%)');
    recommendations.push('Remove excessive whitespace or non-content elements');
  }
  
  // Check heading
  if (!chunk.heading) {
    issues.push('No clear heading');
    recommendations.push('Add a descriptive heading to improve context');
  }
  
  // Determine quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  let color: string;
  let emoji: string;
  
  if (issues.length === 0) {
    quality = 'excellent';
    color = 'text-green-600';
    emoji = '✓';
  } else if (issues.length === 1) {
    quality = 'good';
    color = 'text-blue-600';
    emoji = '✓';
  } else if (issues.length === 2) {
    quality = 'fair';
    color = 'text-yellow-600';
    emoji = '⚠';
  } else {
    quality = 'poor';
    color = 'text-red-600';
    emoji = '✗';
  }
  
  return { quality, issues, recommendations, color, emoji };
};
