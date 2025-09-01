// Bundle analysis and monitoring utilities
import { logger } from '@/lib/logger';

export interface BundleAnalysis {
  totalSize: number;
  chunkSizes: Array<{ name: string; size: number }>;
  recommendations: string[];
}

export const analyzeBundleSize = async (): Promise<BundleAnalysis> => {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return { totalSize: 0, chunkSizes: [], recommendations: [] };
  }

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsEntries = entries.filter(entry => 
    entry.name.includes('.js') && 
    (entry.name.includes('/assets/') || entry.name.includes('/js/'))
  );

  const chunkSizes = jsEntries.map(entry => ({
    name: entry.name.split('/').pop() || 'unknown',
    size: entry.transferSize || 0
  }));

  const totalSize = chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0);

  const recommendations: string[] = [];
  
  // Add recommendations based on analysis
  if (totalSize > 1000000) { // 1MB
    recommendations.push('Consider implementing more aggressive code splitting');
  }
  
  const largeChunks = chunkSizes.filter(chunk => chunk.size > 500000); // 500KB
  if (largeChunks.length > 0) {
    recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}`);
  }

  if (chunkSizes.length > 20) {
    recommendations.push('Consider consolidating some smaller chunks');
  }

  return { totalSize, chunkSizes, recommendations };
};

export const logBundleAnalysis = async () => {
  const analysis = await analyzeBundleSize();
  
  console.group('📦 Bundle Analysis');
  // Bundle analysis completed
  logger.info(`Total JS Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
  logger.info('Chunk Breakdown:', analysis.chunkSizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(chunk => `${chunk.name}: ${(chunk.size / 1024).toFixed(2)} KB`)
  );
  
  if (analysis.recommendations.length > 0) {
    console.warn('Recommendations:', analysis.recommendations);
  }
  
  console.groupEnd();
};

// Monitor bundle size in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(logBundleAnalysis, 2000);
  });
}