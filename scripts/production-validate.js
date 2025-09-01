#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive production validation script
 */
class ProductionValidator {
  constructor() {
    this.validationResults = [];
    this.criticalFailures = [];
  }

  async validate() {
    console.log('✅ Starting production validation...\n');

    try {
      await this.validateLinting();
      await this.validateSecurity();
      await this.validatePerformance();
      await this.validateBuild();
      await this.validateConfiguration();
      
      this.generateValidationReport();
      
      if (this.criticalFailures.length > 0) {
        console.error('❌ Critical validation failures detected!');
        process.exit(1);
      }
      
      console.log('✅ All production validations passed!');
      
    } catch (error) {
      console.error('❌ Production validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateLinting() {
    console.log('🔍 Validating code quality (linting)...');
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.addResult('linting', 'success', 'Code quality checks passed');
    } catch (error) {
      this.addResult('linting', 'critical', 'Linting errors detected');
      this.criticalFailures.push('Linting must pass before production deployment');
    }
  }

  async validateSecurity() {
    console.log('🔒 Validating security configuration...');
    try {
      execSync('node scripts/security-scan.js --validate', { stdio: 'pipe' });
      this.addResult('security', 'success', 'Security validation passed');
    } catch (error) {
      this.addResult('security', 'warning', 'Security warnings detected');
    }
  }

  async validatePerformance() {
    console.log('⚡ Validating performance requirements...');
    try {
      execSync('node scripts/performance-audit.js --validate', { stdio: 'pipe' });
      this.addResult('performance', 'success', 'Performance requirements met');
    } catch (error) {
      this.addResult('performance', 'warning', 'Performance optimization recommended');
    }
  }

  async validateBuild() {
    console.log('🏗️  Validating build configuration...');
    
    // Check if dist directory exists and has content
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      this.addResult('build', 'critical', 'Build output directory missing');
      this.criticalFailures.push('Production build required');
      return;
    }

    const distContents = fs.readdirSync(distPath);
    if (distContents.length === 0) {
      this.addResult('build', 'critical', 'Build output directory empty');
      this.criticalFailures.push('Production build output is empty');
      return;
    }

    // Check for required files
    const requiredFiles = ['index.html'];
    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(distPath, file))
    );

    if (missingFiles.length > 0) {
      this.addResult('build', 'critical', `Missing required files: ${missingFiles.join(', ')}`);
      this.criticalFailures.push('Required build files are missing');
      return;
    }

    this.addResult('build', 'success', 'Build output validated successfully');
  }

  async validateConfiguration() {
    console.log('⚙️  Validating configuration files...');
    
    const configValidations = [
      this.validatePackageJson(),
      this.validateTsConfig(),
      this.validateViteConfig(),
      this.validateTailwindConfig()
    ];

    const results = await Promise.all(configValidations);
    const failed = results.filter(result => !result.success);

    if (failed.length > 0) {
      this.addResult('configuration', 'warning', `Configuration issues: ${failed.length} files`);
    } else {
      this.addResult('configuration', 'success', 'All configuration files validated');
    }
  }

  validatePackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for required scripts
      const requiredScripts = ['build', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        return { success: false, file: 'package.json', issue: `Missing scripts: ${missingScripts.join(', ')}` };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, file: 'package.json', issue: 'File not found or invalid JSON' };
    }
  }

  validateTsConfig() {
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        return { success: false, file: 'tsconfig.json', issue: 'File not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, file: 'tsconfig.json', issue: 'Configuration error' };
    }
  }

  validateViteConfig() {
    try {
      const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
      if (!fs.existsSync(viteConfigPath)) {
        return { success: false, file: 'vite.config.ts', issue: 'File not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, file: 'vite.config.ts', issue: 'Configuration error' };
    }
  }

  validateTailwindConfig() {
    try {
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
      if (!fs.existsSync(tailwindConfigPath)) {
        return { success: false, file: 'tailwind.config.ts', issue: 'File not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, file: 'tailwind.config.ts', issue: 'Configuration error' };
    }
  }

  addResult(category, status, message) {
    this.validationResults.push({
      category,
      status,
      message,
      timestamp: new Date().toISOString()
    });
    
    const statusIcon = {
      success: '✅',
      warning: '⚠️ ',
      critical: '❌'
    }[status];
    
    console.log(`${statusIcon} ${category}: ${message}`);
  }

  generateValidationReport() {
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.criticalFailures.length === 0 ? 'passed' : 'failed',
      criticalFailures: this.criticalFailures,
      results: this.validationResults,
      summary: this.generateSummary()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📋 Validation report generated:', reportPath);
    this.printSummary();
  }

  generateSummary() {
    const total = this.validationResults.length;
    const success = this.validationResults.filter(r => r.status === 'success').length;
    const warnings = this.validationResults.filter(r => r.status === 'warning').length;
    const critical = this.validationResults.filter(r => r.status === 'critical').length;
    
    return { total, success, warnings, critical };
  }

  printSummary() {
    const summary = this.generateSummary();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('━'.repeat(50));
    console.log(`Overall Status: ${this.criticalFailures.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Checks: ${summary.total}`);
    console.log(`✅ Successful: ${summary.success}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`❌ Critical: ${summary.critical}`);
    
    if (this.criticalFailures.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.criticalFailures.forEach(failure => {
        console.log(`  - ${failure}`);
      });
    }
    
    console.log('━'.repeat(50));
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.validate();
}

module.exports = ProductionValidator;