#!/usr/bin/env node

/**
 * Production Performance Monitor
 * Monitors and analyzes application performance metrics
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');

class ProductionPerformanceMonitor {
  constructor() {
    this.metrics = {
      bundleSize: {},
      buildTime: 0,
      dependencies: {},
      performance: {}
    };
  }

  async monitor() {
    console.log('⚡ Starting Production Performance Monitor...');
    
    try {
      await this.analyzeBundleSize();
      await this.checkBuildPerformance();
      await this.analyzeDependencies();
      await this.checkRuntimePerformance();
      await this.generatePerformanceReport();
      
      return this.evaluatePerformance();
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error.message);
      return false;
    }
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Check if dist directory exists
      const distExists = await fs.access('./dist').then(() => true).catch(() => false);
      
      if (!distExists) {
        console.log('⚠️ No build output found - running build first...');
        execSync('npm run build', { stdio: 'inherit' });
      }
      
      // Analyze bundle files
      const distFiles = await this.getDirectorySize('./dist');
      
      this.metrics.bundleSize = {
        total: distFiles.totalSize,
        files: distFiles.files,
        gzippedEstimate: Math.round(distFiles.totalSize * 0.3) // Rough gzip estimate
      };
      
      // Check bundle size limits
      const totalSizeMB = distFiles.totalSize / (1024 * 1024);
      
      if (totalSizeMB > 10) {
        console.log(`⚠️ Large bundle size: ${totalSizeMB.toFixed(2)}MB`);
      } else {
        console.log(`✅ Bundle size OK: ${totalSizeMB.toFixed(2)}MB`);
      }
      
    } catch (error) {
      console.log('⚠️ Bundle analysis failed:', error.message);
    }
  }

  async checkBuildPerformance() {
    console.log('🏗️ Checking build performance...');
    
    try {
      const startTime = Date.now();
      
      // Run a test build to measure performance
      console.log('Building project for performance analysis...');
      execSync('npm run build', { stdio: 'pipe' });
      
      this.metrics.buildTime = Date.now() - startTime;
      
      const buildTimeSeconds = this.metrics.buildTime / 1000;
      
      if (buildTimeSeconds > 120) {
        console.log(`⚠️ Slow build time: ${buildTimeSeconds.toFixed(1)}s`);
      } else {
        console.log(`✅ Build time OK: ${buildTimeSeconds.toFixed(1)}s`);
      }
      
    } catch (error) {
      console.log('⚠️ Build performance check failed:', error.message);
    }
  }

  async analyzeDependencies() {
    console.log('📚 Analyzing dependencies...');
    
    try {
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
      
      const totalDeps = Object.keys(packageJson.dependencies || {}).length;
      const totalDevDeps = Object.keys(packageJson.devDependencies || {}).length;
      
      this.metrics.dependencies = {
        production: totalDeps,
        development: totalDevDeps,
        total: totalDeps + totalDevDeps
      };
      
      console.log(`📦 Dependencies: ${totalDeps} prod, ${totalDevDeps} dev`);
      
      // Check for heavy dependencies
      const heavyDeps = this.identifyHeavyDependencies(packageJson.dependencies || {});
      if (heavyDeps.length > 0) {
        console.log(`⚠️ Heavy dependencies detected: ${heavyDeps.join(', ')}`);
      }
      
    } catch (error) {
      console.log('⚠️ Dependency analysis failed:', error.message);
    }
  }

  async checkRuntimePerformance() {
    console.log('🚀 Checking runtime performance indicators...');
    
    // Check for performance-critical files
    const performanceCritical = {
      lazyLoading: await this.checkLazyLoading(),
      imageOptimization: await this.checkImageOptimization(),
      codesplitting: await this.checkCodeSplitting()
    };
    
    this.metrics.performance = performanceCritical;
    
    Object.entries(performanceCritical).forEach(([check, passed]) => {
      console.log(passed ? `✅ ${check}` : `⚠️ ${check} needs attention`);
    });
  }

  async checkLazyLoading() {
    try {
      const srcFiles = await this.getAllFiles('./src', ['.tsx', '.ts']);
      const lazyImports = srcFiles.some(async (file) => {
        const content = await fs.readFile(file, 'utf8');
        return content.includes('React.lazy') || content.includes('lazy(');
      });
      return lazyImports;
    } catch {
      return false;
    }
  }

  async checkImageOptimization() {
    try {
      // Check if there are image optimization utilities
      const srcFiles = await this.getAllFiles('./src', ['.tsx', '.ts']);
      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('ImageOptimizer') || content.includes('loading="lazy"')) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async checkCodeSplitting() {
    try {
      // Check for dynamic imports
      const srcFiles = await this.getAllFiles('./src', ['.tsx', '.ts']);
      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('import(') || content.includes('React.lazy')) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async getDirectorySize(dirPath) {
    const files = [];
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = `${dirPath}/${item.name}`;
        
        if (item.isDirectory()) {
          const subDirInfo = await this.getDirectorySize(fullPath);
          totalSize += subDirInfo.totalSize;
          files.push(...subDirInfo.files);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          files.push({
            name: fullPath,
            size: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
          });
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not analyze directory ${dirPath}:`, error.message);
    }
    
    return { totalSize, files };
  }

  async getAllFiles(dir, extensions) {
    const files = [];
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = `${dir}/${item.name}`;
        
        if (item.isDirectory() && !item.name.startsWith('.')) {
          files.push(...await this.getAllFiles(fullPath, extensions));
        } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or permission denied
    }
    
    return files;
  }

  identifyHeavyDependencies(dependencies) {
    const heavyDeps = [
      'lodash', 'moment', 'webpack', 'babel-core', 'typescript'
    ];
    
    return Object.keys(dependencies).filter(dep => 
      heavyDeps.some(heavy => dep.includes(heavy))
    );
  }

  async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.getPerformanceRecommendations(),
      thresholds: {
        bundleSizeLimit: '10MB',
        buildTimeLimit: '120s',
        dependencyWarning: '100+'
      }
    };
    
    await fs.writeFile('performance-report.json', JSON.stringify(report, null, 2));
    console.log('📋 Performance report generated: performance-report.json');
  }

  getPerformanceRecommendations() {
    const recommendations = [];
    
    if (this.metrics.bundleSize.total > 10 * 1024 * 1024) {
      recommendations.push('Consider code splitting to reduce bundle size');
      recommendations.push('Implement lazy loading for heavy components');
    }
    
    if (this.metrics.buildTime > 120000) {
      recommendations.push('Optimize build process - consider parallel builds');
    }
    
    if (this.metrics.dependencies.total > 100) {
      recommendations.push('Review and remove unused dependencies');
    }
    
    if (!this.metrics.performance.lazyLoading) {
      recommendations.push('Implement lazy loading for better performance');
    }
    
    if (!this.metrics.performance.imageOptimization) {
      recommendations.push('Add image optimization for better loading times');
    }
    
    return recommendations;
  }

  evaluatePerformance() {
    console.log('\n📊 Performance Summary:');
    console.log(`Bundle Size: ${(this.metrics.bundleSize.total / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`Build Time: ${(this.metrics.buildTime / 1000).toFixed(1)}s`);
    console.log(`Dependencies: ${this.metrics.dependencies.total}`);
    
    const issues = [];
    
    if (this.metrics.bundleSize.total > 15 * 1024 * 1024) {
      issues.push('Bundle size too large');
    }
    
    if (this.metrics.buildTime > 180000) {
      issues.push('Build time too slow');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️ Performance issues detected:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      return false;
    }
    
    console.log('\n✅ Performance checks passed');
    return true;
  }
}

// Run performance monitor
if (require.main === module) {
  const monitor = new ProductionPerformanceMonitor();
  monitor.monitor()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(error => {
      console.error('Fatal performance monitor error:', error);
      process.exit(1);
    });
}

module.exports = ProductionPerformanceMonitor;