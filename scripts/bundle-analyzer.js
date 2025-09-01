#!/usr/bin/env node

/**
 * Bundle analysis script for production builds
 * Usage: npm run analyze-bundle
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BUILD_DIR = 'dist';
const ANALYSIS_OUTPUT = 'bundle-analysis.json';
const REPORT_OUTPUT = 'bundle-report.html';

// Performance budgets (in bytes)
const BUDGETS = {
  initialBundle: 500 * 1024, // 500KB
  chunkSize: 250 * 1024,     // 250KB
  totalAssets: 2 * 1024 * 1024, // 2MB
  cssSize: 100 * 1024,       // 100KB
};

class BundleAnalyzer {
  constructor() {
    this.stats = null;
    this.warnings = [];
  }

  analyze() {
    console.log('🔍 Starting bundle analysis...\n');

    try {
      // Check if build directory exists
      if (!fs.existsSync(BUILD_DIR)) {
        throw new Error(`Build directory '${BUILD_DIR}' not found. Run 'npm run build' first.`);
      }

      // Analyze bundle structure
      this.analyzeBundleStructure();
      
      // Check performance budgets
      this.checkPerformanceBudgets();
      
      // Generate reports
      this.generateReports();
      
      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }

  analyzeBundleStructure() {
    console.log('📊 Analyzing bundle structure...');

    const buildFiles = this.getBuildFiles();
    
    this.stats = {
      totalSize: 0,
      initialBundle: 0,
      chunks: [],
      assets: this.categorizeAssets(buildFiles),
      timestamp: new Date().toISOString(),
    };

    // Calculate sizes
    buildFiles.forEach(file => {
      const size = this.getFileSize(file.path);
      this.stats.totalSize += size;

      if (file.name.includes('index') && file.name.endsWith('.js')) {
        this.stats.initialBundle += size;
      }

      if (file.name.endsWith('.js') || file.name.endsWith('.css')) {
        this.stats.chunks.push({
          name: file.name,
          size: size,
          type: file.name.endsWith('.js') ? 'js' : 'css',
          isInitial: file.name.includes('index'),
        });
      }
    });
  }

  getBuildFiles() {
    const files = [];
    
    const scanDirectory = (dir, baseDir = '') => {
      const entries = fs.readdirSync(dir);
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const relativePath = path.join(baseDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativePath);
        } else {
          files.push({
            name: entry,
            path: fullPath,
            relativePath: relativePath,
            size: stat.size,
          });
        }
      });
    };

    scanDirectory(BUILD_DIR);
    return files;
  }

  categorizeAssets(files) {
    const assets = {
      js: [],
      css: [],
      images: [],
      fonts: [],
      other: [],
    };

    files.forEach(file => {
      if (file.name.match(/\.(js|mjs)$/)) {
        assets.js.push(file);
      } else if (file.name.match(/\.css$/)) {
        assets.css.push(file);
      } else if (file.name.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
        assets.images.push(file);
      } else if (file.name.match(/\.(woff|woff2|ttf|eot)$/)) {
        assets.fonts.push(file);
      } else {
        assets.other.push(file);
      }
    });

    return assets;
  }

  getFileSize(filePath) {
    return fs.statSync(filePath).size;
  }

  checkPerformanceBudgets() {
    console.log('📏 Checking performance budgets...');

    const failures = [];

    // Check initial bundle size
    if (this.stats.initialBundle > BUDGETS.initialBundle) {
      failures.push({
        budget: 'Initial Bundle',
        actual: this.stats.initialBundle,
        limit: BUDGETS.initialBundle,
        percentage: ((this.stats.initialBundle / BUDGETS.initialBundle) * 100).toFixed(1),
      });
    }

    // Check individual chunk sizes
    this.stats.chunks.forEach(chunk => {
      if (chunk.size > BUDGETS.chunkSize) {
        failures.push({
          budget: `Chunk: ${chunk.name}`,
          actual: chunk.size,
          limit: BUDGETS.chunkSize,
          percentage: ((chunk.size / BUDGETS.chunkSize) * 100).toFixed(1),
        });
      }
    });

    // Check total CSS size
    const totalCssSize = this.stats.assets.css.reduce((sum, file) => sum + file.size, 0);
    if (totalCssSize > BUDGETS.cssSize) {
      failures.push({
        budget: 'Total CSS',
        actual: totalCssSize,
        limit: BUDGETS.cssSize,
        percentage: ((totalCssSize / BUDGETS.cssSize) * 100).toFixed(1),
      });
    }

    // Check total assets size
    if (this.stats.totalSize > BUDGETS.totalAssets) {
      failures.push({
        budget: 'Total Assets',
        actual: this.stats.totalSize,
        limit: BUDGETS.totalAssets,
        percentage: ((this.stats.totalSize / BUDGETS.totalAssets) * 100).toFixed(1),
      });
    }

    this.stats.budgetFailures = failures;
    
    if (failures.length > 0) {
      console.log('⚠️  Performance budget violations detected:');
      failures.forEach(failure => {
        console.log(`   ${failure.budget}: ${this.formatBytes(failure.actual)} (${failure.percentage}% over limit)`);
      });
    } else {
      console.log('✅ All performance budgets met!');
    }
  }

  generateReports() {
    console.log('📄 Generating reports...');

    // Save JSON analysis
    fs.writeFileSync(
      ANALYSIS_OUTPUT,
      JSON.stringify(this.stats, null, 2)
    );

    // Generate HTML report
    this.generateHtmlReport();
  }

  generateHtmlReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #0070f3; }
    .metric-label { font-size: 12px; color: #666; }
    .warning { color: #ff6b6b; font-weight: bold; }
    .success { color: #51cf66; font-weight: bold; }
    .chart { width: 100%; height: 300px; border: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
    th { background-color: #f8f9fa; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bundle Analysis Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Bundle Overview</h2>
    <div class="metric">
      <div class="metric-value">${this.formatBytes(this.stats.totalSize)}</div>
      <div class="metric-label">Total Size</div>
    </div>
    <div class="metric">
      <div class="metric-value">${this.formatBytes(this.stats.initialBundle)}</div>
      <div class="metric-label">Initial Bundle</div>
    </div>
    <div class="metric">
      <div class="metric-value">${this.stats.chunks.length}</div>
      <div class="metric-label">Chunks</div>
    </div>
  </div>

  <div class="section">
    <h2>Performance Budget Status</h2>
    ${this.stats.budgetFailures.length === 0 
      ? '<p class="success">✅ All performance budgets met!</p>'
      : this.stats.budgetFailures.map(failure => 
          `<p class="warning">❌ ${failure.budget}: ${this.formatBytes(failure.actual)} (${failure.percentage}% over limit)</p>`
        ).join('')
    }
  </div>

  <div class="section">
    <h2>Asset Breakdown</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Count</th>
        <th>Total Size</th>
        <th>Average Size</th>
      </tr>
      ${Object.entries(this.stats.assets).map(([type, files]) => {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const avgSize = files.length > 0 ? totalSize / files.length : 0;
        return `
        <tr>
          <td>${type.toUpperCase()}</td>
          <td>${files.length}</td>
          <td>${this.formatBytes(totalSize)}</td>
          <td>${this.formatBytes(avgSize)}</td>
        </tr>
        `;
      }).join('')}
    </table>
  </div>

  <div class="section">
    <h2>Largest Files</h2>
    <table>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Type</th>
      </tr>
      ${this.stats.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(chunk => `
          <tr>
            <td>${chunk.name}</td>
            <td>${this.formatBytes(chunk.size)}</td>
            <td>${chunk.type.toUpperCase()}</td>
          </tr>
        `).join('')}
    </table>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(REPORT_OUTPUT, html.trim());
  }

  printSummary() {
    console.log('\n📊 Bundle Analysis Summary');
    console.log('================================');
    console.log(`Total Size: ${this.formatBytes(this.stats.totalSize)}`);
    console.log(`Initial Bundle: ${this.formatBytes(this.stats.initialBundle)}`);
    console.log(`Chunks: ${this.stats.chunks.length}`);
    console.log(`Assets: JS=${this.stats.assets.js.length}, CSS=${this.stats.assets.css.length}, Images=${this.stats.assets.images.length}`);
    
    if (this.stats.budgetFailures.length > 0) {
      console.log(`\n⚠️  Budget Violations: ${this.stats.budgetFailures.length}`);
    } else {
      console.log('\n✅ All budgets met!');
    }

    console.log(`\n📄 Reports generated:`);
    console.log(`   JSON: ${ANALYSIS_OUTPUT}`);
    console.log(`   HTML: ${REPORT_OUTPUT}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run analysis
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze();
}

module.exports = BundleAnalyzer;