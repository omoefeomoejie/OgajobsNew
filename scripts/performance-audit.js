#!/usr/bin/env node

/**
 * Performance audit script for production readiness
 * Usage: npm run performance:audit
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  bundleSize: {
    initial: 500 * 1024, // 500KB
    chunk: 250 * 1024,   // 250KB
    css: 100 * 1024,     // 100KB
  },
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90,
  },
  webVitals: {
    lcp: 2500,  // Largest Contentful Paint (ms)
    fid: 100,   // First Input Delay (ms)
    cls: 0.1,   // Cumulative Layout Shift
  }
};

class PerformanceAuditor {
  constructor() {
    this.results = {
      bundleAnalysis: null,
      webVitals: null,
      accessibility: null,
      seo: null,
      recommendations: []
    };
  }

  async audit() {
    console.log('🔍 Starting performance audit...\n');

    try {
      // Run bundle analysis
      await this.auditBundleSize();
      
      // Check for performance optimizations
      await this.auditCodeSplitting();
      
      // Audit image optimization
      await this.auditImages();
      
      // Check accessibility
      await this.auditAccessibility();
      
      // SEO audit
      await this.auditSEO();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Performance audit failed:', error.message);
      process.exit(1);
    }
  }

  async auditBundleSize() {
    console.log('📦 Analyzing bundle size...');

    const buildDir = 'dist';
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build directory not found. Run npm run build first.');
    }

    const files = this.getAllFiles(buildDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));

    let totalSize = 0;
    let initialBundle = 0;

    jsFiles.forEach(file => {
      const size = fs.statSync(file).size;
      totalSize += size;
      
      if (path.basename(file).includes('index')) {
        initialBundle += size;
      }
    });

    const cssSize = cssFiles.reduce((sum, file) => {
      return sum + fs.statSync(file).size;
    }, 0);

    this.results.bundleAnalysis = {
      totalSize,
      initialBundle,
      cssSize,
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length
    };

    // Check thresholds
    if (initialBundle > THRESHOLDS.bundleSize.initial) {
      this.results.recommendations.push({
        type: 'bundle',
        severity: 'high',
        message: `Initial bundle size (${this.formatBytes(initialBundle)}) exceeds threshold (${this.formatBytes(THRESHOLDS.bundleSize.initial)})`,
        solution: 'Implement code splitting and lazy loading for non-critical components'
      });
    }

    if (cssSize > THRESHOLDS.bundleSize.css) {
      this.results.recommendations.push({
        type: 'css',
        severity: 'medium',
        message: `CSS bundle size (${this.formatBytes(cssSize)}) exceeds threshold`,
        solution: 'Consider CSS code splitting and unused style removal'
      });
    }

    console.log(`✅ Bundle analysis complete: ${this.formatBytes(totalSize)} total`);
  }

  async auditCodeSplitting() {
    console.log('🔧 Checking code splitting implementation...');

    const viteConcfigPath = 'vite.config.ts';
    if (fs.existsSync(viteConcfigPath)) {
      const config = fs.readFileSync(viteConcfigPath, 'utf8');
      
      if (!config.includes('manualChunks') && !config.includes('rollupOptions')) {
        this.results.recommendations.push({
          type: 'splitting',
          severity: 'medium',
          message: 'Code splitting not optimally configured',
          solution: 'Add manual chunk configuration in vite.config.ts for better bundle optimization'
        });
      }
    }

    // Check for lazy imports
    const srcFiles = this.getAllFiles('src', ['.tsx', '.ts']);
    const lazyImports = srcFiles.some(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('React.lazy') || content.includes('import(');
    });

    if (!lazyImports) {
      this.results.recommendations.push({
        type: 'lazy-loading',
        severity: 'low',
        message: 'No lazy loading detected in components',
        solution: 'Implement React.lazy for route-based components to reduce initial bundle size'
      });
    }
  }

  async auditImages() {
    console.log('🖼️  Auditing image optimization...');

    const publicDir = 'public';
    const srcAssets = 'src/assets';
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    let unoptimizedImages = [];

    // Check public directory
    if (fs.existsSync(publicDir)) {
      const publicImages = this.getAllFiles(publicDir, imageExtensions);
      publicImages.forEach(img => {
        const stats = fs.statSync(img);
        if (stats.size > 500 * 1024) { // > 500KB
          unoptimizedImages.push({
            path: img,
            size: stats.size,
            type: 'large'
          });
        }
      });
    }

    // Check src/assets
    if (fs.existsSync(srcAssets)) {
      const assetImages = this.getAllFiles(srcAssets, imageExtensions);
      assetImages.forEach(img => {
        const stats = fs.statSync(img);
        if (stats.size > 200 * 1024) { // > 200KB
          unoptimizedImages.push({
            path: img,
            size: stats.size,
            type: 'large'
          });
        }
      });
    }

    if (unoptimizedImages.length > 0) {
      this.results.recommendations.push({
        type: 'images',
        severity: 'medium',
        message: `${unoptimizedImages.length} large images detected`,
        solution: 'Compress images using tools like imagemin, or convert to modern formats (WebP, AVIF)'
      });
    }

    console.log(`✅ Image audit complete: ${unoptimizedImages.length} issues found`);
  }

  async auditAccessibility() {
    console.log('♿ Checking accessibility features...');

    const htmlFiles = this.getAllFiles('dist', ['.html']);
    let accessibilityIssues = [];

    htmlFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for basic accessibility features
      if (!content.includes('lang=')) {
        accessibilityIssues.push('Missing lang attribute');
      }
      
      if (!content.includes('role=')) {
        accessibilityIssues.push('No ARIA roles detected');
      }
      
      if (!content.includes('alt=') && content.includes('<img')) {
        accessibilityIssues.push('Images without alt attributes detected');
      }
    });

    if (accessibilityIssues.length > 0) {
      this.results.recommendations.push({
        type: 'accessibility',
        severity: 'high',
        message: `Accessibility issues: ${accessibilityIssues.join(', ')}`,
        solution: 'Add proper ARIA attributes, alt text for images, and semantic HTML elements'
      });
    }

    this.results.accessibility = {
      issues: accessibilityIssues.length,
      details: accessibilityIssues
    };

    console.log(`✅ Accessibility audit complete: ${accessibilityIssues.length} issues found`);
  }

  async auditSEO() {
    console.log('🔍 Checking SEO optimization...');

    const indexHtml = path.join('dist', 'index.html');
    let seoIssues = [];

    if (fs.existsSync(indexHtml)) {
      const content = fs.readFileSync(indexHtml, 'utf8');
      
      if (!content.includes('<title>')) {
        seoIssues.push('Missing title tag');
      }
      
      if (!content.includes('name="description"')) {
        seoIssues.push('Missing meta description');
      }
      
      if (!content.includes('name="viewport"')) {
        seoIssues.push('Missing viewport meta tag');
      }
      
      if (!content.includes('rel="canonical"')) {
        seoIssues.push('Missing canonical URL');
      }

      // Check for Open Graph tags
      if (!content.includes('property="og:')) {
        seoIssues.push('Missing Open Graph tags');
      }
    }

    if (seoIssues.length > 0) {
      this.results.recommendations.push({
        type: 'seo',
        severity: 'medium',
        message: `SEO issues: ${seoIssues.join(', ')}`,
        solution: 'Add proper meta tags, structured data, and Open Graph tags'
      });
    }

    this.results.seo = {
      issues: seoIssues.length,
      details: seoIssues
    };

    console.log(`✅ SEO audit complete: ${seoIssues.length} issues found`);
  }

  generateReport() {
    console.log('\n📊 Performance Audit Report');
    console.log('================================');

    // Bundle Analysis
    if (this.results.bundleAnalysis) {
      const ba = this.results.bundleAnalysis;
      console.log(`\n📦 Bundle Analysis:`);
      console.log(`   Total Size: ${this.formatBytes(ba.totalSize)}`);
      console.log(`   Initial Bundle: ${this.formatBytes(ba.initialBundle)}`);
      console.log(`   CSS Size: ${this.formatBytes(ba.cssSize)}`);
      console.log(`   JS Files: ${ba.jsFiles}`);
      console.log(`   CSS Files: ${ba.cssFiles}`);
    }

    // Performance Score
    const criticalIssues = this.results.recommendations.filter(r => r.severity === 'high').length;
    const mediumIssues = this.results.recommendations.filter(r => r.severity === 'medium').length;
    const lowIssues = this.results.recommendations.filter(r => r.severity === 'low').length;

    let score = 100;
    score -= criticalIssues * 20;
    score -= mediumIssues * 10;
    score -= lowIssues * 5;
    score = Math.max(0, score);

    console.log(`\n🎯 Performance Score: ${score}/100`);
    
    if (criticalIssues > 0) {
      console.log(`   ❌ Critical Issues: ${criticalIssues}`);
    }
    if (mediumIssues > 0) {
      console.log(`   ⚠️  Medium Issues: ${mediumIssues}`);
    }
    if (lowIssues > 0) {
      console.log(`   💡 Low Issues: ${lowIssues}`);
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach((rec, i) => {
        const icon = rec.severity === 'high' ? '❌' : rec.severity === 'medium' ? '⚠️' : '💡';
        console.log(`   ${i + 1}. ${icon} ${rec.message}`);
        console.log(`      Solution: ${rec.solution}`);
      });
    } else {
      console.log('\n✅ No performance issues found!');
    }

    // Production Readiness
    console.log(`\n🚀 Production Readiness:`);
    const isReady = score >= 80 && criticalIssues === 0;
    console.log(`   Status: ${isReady ? '✅ READY' : '❌ NEEDS WORK'}`);
    
    if (!isReady) {
      console.log(`   Action: Address critical issues before deployment`);
    }

    // Save detailed report
    const reportPath = 'performance-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      score,
      results: this.results,
      isProductionReady: isReady
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  getAllFiles(dir, extensions = []) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const scan = (currentDir) => {
      const entries = fs.readdirSync(currentDir);
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else {
          if (extensions.length === 0 || extensions.some(ext => entry.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      });
    };
    
    scan(dir);
    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run audit
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.audit();
}

module.exports = PerformanceAuditor;