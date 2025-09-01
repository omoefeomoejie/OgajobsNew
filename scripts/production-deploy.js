#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Production deployment script with comprehensive validation
 */
class ProductionDeployment {
  constructor() {
    this.distPath = path.join(process.cwd(), 'dist');
    this.exitCode = 0;
  }

  async deploy() {
    console.log('🚀 Starting production deployment process...\n');

    try {
      // Step 1: Clean previous build
      await this.cleanPreviousBuild();
      
      // Step 2: Run linting
      await this.runLinting();
      
      // Step 3: Build for production
      await this.buildProduction();
      
      // Step 4: Run bundle analysis
      await this.analyzBundle();
      
      // Step 5: Run performance audit
      await this.auditPerformance();
      
      // Step 6: Run security checks
      await this.checkSecurity();
      
      // Step 7: Validate deployment readiness
      await this.validateDeployment();
      
      console.log('✅ Production deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Production deployment failed:', error.message);
      this.exitCode = 1;
    }

    process.exit(this.exitCode);
  }

  async cleanPreviousBuild() {
    console.log('🧹 Cleaning previous build...');
    try {
      execSync('node scripts/clean-build.js', { stdio: 'inherit' });
      console.log('✅ Build cleaned successfully\n');
    } catch (error) {
      throw new Error(`Build cleaning failed: ${error.message}`);
    }
  }

  async runLinting() {
    console.log('🔍 Running linting checks...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed\n');
    } catch (error) {
      throw new Error(`Linting failed: ${error.message}`);
    }
  }

  async buildProduction() {
    console.log('🏗️  Building for production...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      
      // Verify build output
      if (!fs.existsSync(this.distPath)) {
        throw new Error('Build output directory not found');
      }
      
      const buildFiles = fs.readdirSync(this.distPath);
      if (buildFiles.length === 0) {
        throw new Error('Build output is empty');
      }
      
      console.log('✅ Production build completed\n');
    } catch (error) {
      throw new Error(`Production build failed: ${error.message}`);
    }
  }

  async analyzBundle() {
    console.log('📊 Analyzing bundle size...');
    try {
      execSync('node scripts/bundle-analyzer.js --ci', { stdio: 'inherit' });
      console.log('✅ Bundle analysis completed\n');
    } catch (error) {
      console.warn('⚠️  Bundle analysis had warnings, continuing...\n');
    }
  }

  async auditPerformance() {
    console.log('⚡ Running performance audit...');
    try {
      execSync('node scripts/performance-audit.js --ci', { stdio: 'inherit' });
      console.log('✅ Performance audit completed\n');
    } catch (error) {
      console.warn('⚠️  Performance audit had warnings, continuing...\n');
    }
  }

  async checkSecurity() {
    console.log('🔒 Running security checks...');
    try {
      execSync('node scripts/security-scan.js', { stdio: 'inherit' });
      console.log('✅ Security checks completed\n');
    } catch (error) {
      console.warn('⚠️  Security scan had warnings, continuing...\n');
    }
  }

  async validateDeployment() {
    console.log('✅ Validating deployment readiness...');
    
    const validations = [
      this.validateBuildSize(),
      this.validateRequiredFiles(),
      this.validateAssetOptimization()
    ];

    const results = await Promise.all(validations);
    const failedValidations = results.filter(result => !result.success);

    if (failedValidations.length > 0) {
      console.error('❌ Deployment validation failed:');
      failedValidations.forEach(failure => {
        console.error(`  - ${failure.message}`);
      });
      throw new Error('Deployment validation failed');
    }

    console.log('✅ All validations passed - ready for deployment!\n');
  }

  validateBuildSize() {
    try {
      const stats = this.getBuildStats();
      const maxSizeKB = 5000; // 5MB total
      
      if (stats.totalSize > maxSizeKB * 1024) {
        return {
          success: false,
          message: `Build size (${(stats.totalSize / 1024).toFixed(2)}KB) exceeds limit (${maxSizeKB}KB)`
        };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, message: `Build size validation failed: ${error.message}` };
    }
  }

  validateRequiredFiles() {
    const requiredFiles = ['index.html', 'manifest.json'];
    const missingFiles = [];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(path.join(this.distPath, file))) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      return {
        success: false,
        message: `Missing required files: ${missingFiles.join(', ')}`
      };
    }

    return { success: true };
  }

  validateAssetOptimization() {
    try {
      const assetsPath = path.join(this.distPath, 'assets');
      if (!fs.existsSync(assetsPath)) {
        return { success: true }; // No assets to validate
      }

      const assets = fs.readdirSync(assetsPath);
      const largeAssets = [];

      assets.forEach(asset => {
        const assetPath = path.join(assetsPath, asset);
        const stats = fs.statSync(assetPath);
        
        // Check for large JS chunks (>1MB)
        if (asset.endsWith('.js') && stats.size > 1024 * 1024) {
          largeAssets.push(`${asset}: ${(stats.size / 1024).toFixed(2)}KB`);
        }
      });

      if (largeAssets.length > 0) {
        return {
          success: false,
          message: `Large assets detected (consider splitting): ${largeAssets.join(', ')}`
        };
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: `Asset optimization validation failed: ${error.message}` };
    }
  }

  getBuildStats() {
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const items = fs.readdirSync(dirPath);

      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      });

      return totalSize;
    };

    return {
      totalSize: getDirectorySize(this.distPath),
      path: this.distPath
    };
  }
}

// Run if called directly
if (require.main === module) {
  const deployment = new ProductionDeployment();
  deployment.deploy();
}

module.exports = ProductionDeployment;