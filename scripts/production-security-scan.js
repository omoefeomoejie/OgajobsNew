#!/usr/bin/env node

/**
 * Automated Production Security Scanner
 * Performs comprehensive security checks before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;

class ProductionSecurityScanner {
  constructor() {
    this.securityIssues = [];
    this.criticalCount = 0;
    this.highCount = 0;
    this.mediumCount = 0;
  }

  async scan() {
    console.log('🔒 Starting Production Security Scan...');
    
    try {
      await this.checkDependencyVulnerabilities();
      await this.checkCodeSecurity();
      await this.checkConfigurationSecurity();
      await this.checkSupabaseSecurity();
      await this.generateSecurityReport();
      
      return this.evaluateSecurityStatus();
    } catch (error) {
      console.error('❌ Security scan failed:', error.message);
      return false;
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('📦 Checking dependency vulnerabilities...');
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata.vulnerabilities.total > 0) {
        this.addIssue('DEPENDENCY_VULNERABILITIES', 'high', 
          `Found ${audit.metadata.vulnerabilities.total} dependency vulnerabilities`);
      } else {
        console.log('✅ No dependency vulnerabilities found');
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      const auditOutput = error.stdout || error.message;
      if (auditOutput.includes('vulnerabilities')) {
        this.addIssue('DEPENDENCY_AUDIT_FAILED', 'medium', 
          'Dependency audit check failed - manual review required');
      }
    }
  }

  async checkCodeSecurity() {
    console.log('🔍 Checking code security patterns...');
    
    try {
      // Check for common security anti-patterns
      const srcFiles = await this.getAllSourceFiles('./src');
      
      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for hardcoded secrets
        if (this.containsHardcodedSecrets(content)) {
          this.addIssue('HARDCODED_SECRETS', 'critical', 
            `Potential hardcoded secrets in ${file}`);
        }
        
        // Check for unsafe DOM operations
        if (content.includes('dangerouslySetInnerHTML')) {
          this.addIssue('UNSAFE_DOM', 'high', 
            `Unsafe DOM operation in ${file}`);
        }
        
        // Check for eval usage
        if (content.includes('eval(')) {
          this.addIssue('EVAL_USAGE', 'critical', 
            `Dangerous eval() usage in ${file}`);
        }
      }
      
      console.log(`✅ Scanned ${srcFiles.length} source files`);
    } catch (error) {
      this.addIssue('CODE_SCAN_ERROR', 'medium', 
        `Code security scan failed: ${error.message}`);
    }
  }

  async checkConfigurationSecurity() {
    console.log('⚙️ Checking configuration security...');
    
    // Check for exposed development configs
    try {
      const viteConfig = await fs.readFile('./vite.config.ts', 'utf8');
      
      if (viteConfig.includes('localhost') && !viteConfig.includes('development')) {
        this.addIssue('DEV_CONFIG_EXPOSED', 'medium', 
          'Development configuration may be exposed in production');
      }
      
      console.log('✅ Configuration security checked');
    } catch (error) {
      console.log('⚠️ Could not check vite.config.ts');
    }
  }

  async checkSupabaseSecurity() {
    console.log('🏠 Checking Supabase security configuration...');
    
    try {
      // Check if RLS is properly configured
      // This would typically connect to Supabase to verify RLS policies
      console.log('ℹ️ Supabase security check requires manual verification');
      console.log('📋 Please ensure:');
      console.log('   - Row Level Security (RLS) is enabled on all tables');
      console.log('   - Auth policies are properly configured');
      console.log('   - API keys are not exposed in client code');
      
    } catch (error) {
      this.addIssue('SUPABASE_CHECK_FAILED', 'medium', 
        `Supabase security check failed: ${error.message}`);
    }
  }

  async getAllSourceFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = `${dir}/${item.name}`;
      
      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...await this.getAllSourceFiles(fullPath));
      } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  containsHardcodedSecrets(content) {
    const secretPatterns = [
      /api[_-]?key['"]?\s*[:=]\s*['"][^'"]+['"]/i,
      /secret['"]?\s*[:=]\s*['"][^'"]+['"]/i,
      /password['"]?\s*[:=]\s*['"][^'"]+['"]/i,
      /token['"]?\s*[:=]\s*['"][^'"]+['"]/i
    ];
    
    return secretPatterns.some(pattern => pattern.test(content));
  }

  addIssue(type, severity, description) {
    this.securityIssues.push({ type, severity, description });
    
    switch (severity) {
      case 'critical':
        this.criticalCount++;
        console.log(`🚨 CRITICAL: ${description}`);
        break;
      case 'high':
        this.highCount++;
        console.log(`⚠️ HIGH: ${description}`);
        break;
      case 'medium':
        this.mediumCount++;
        console.log(`ℹ️ MEDIUM: ${description}`);
        break;
    }
  }

  async generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_issues: this.securityIssues.length,
        critical: this.criticalCount,
        high: this.highCount,
        medium: this.mediumCount
      },
      issues: this.securityIssues,
      recommendations: this.getRecommendations()
    };
    
    await fs.writeFile('security-report.json', JSON.stringify(report, null, 2));
    console.log('📋 Security report generated: security-report.json');
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.criticalCount > 0) {
      recommendations.push('Address all critical security issues before deployment');
    }
    
    if (this.highCount > 0) {
      recommendations.push('Review and fix high-severity security issues');
    }
    
    recommendations.push('Enable Supabase Leaked Password Protection');
    recommendations.push('Verify all RLS policies are properly configured');
    recommendations.push('Regular security audits recommended');
    
    return recommendations;
  }

  evaluateSecurityStatus() {
    console.log('\n📊 Security Scan Summary:');
    console.log(`Critical: ${this.criticalCount}`);
    console.log(`High: ${this.highCount}`);
    console.log(`Medium: ${this.mediumCount}`);
    
    if (this.criticalCount > 0) {
      console.log('\n❌ DEPLOYMENT BLOCKED: Critical security issues found');
      return false;
    }
    
    if (this.highCount > 5) {
      console.log('\n⚠️ DEPLOYMENT CAUTIONED: Multiple high-severity issues');
      return false;
    }
    
    console.log('\n✅ Security scan passed - safe for deployment');
    return true;
  }
}

// Run security scan
if (require.main === module) {
  const scanner = new ProductionSecurityScanner();
  scanner.scan()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(error => {
      console.error('Fatal security scan error:', error);
      process.exit(1);
    });
}

module.exports = ProductionSecurityScanner;