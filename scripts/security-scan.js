#!/usr/bin/env node

/**
 * Security scanning script for production deployment
 * Usage: npm run security:scan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.findings = {
      dependencies: [],
      code: [],
      configuration: [],
      secrets: []
    };
  }

  async scan() {
    console.log('🔒 Starting security scan...\n');

    try {
      // Dependency vulnerabilities
      await this.scanDependencies();
      
      // Code analysis
      await this.scanCode();
      
      // Configuration security
      await this.scanConfiguration();
      
      // Secret detection
      await this.scanSecrets();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Security scan failed:', error.message);
      process.exit(1);
    }
  }

  async scanDependencies() {
    console.log('📦 Scanning dependencies for vulnerabilities...');

    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --audit-level=moderate --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] 
      });
      
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
          this.findings.dependencies.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.via[0]?.title || 'Unknown vulnerability',
            range: vuln.range,
            fixAvailable: vuln.fixAvailable
          });
        });
      }

    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.vulnerabilities) {
            Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
              this.findings.dependencies.push({
                package: pkg,
                severity: vuln.severity,
                title: vuln.via[0]?.title || 'Unknown vulnerability',
                range: vuln.range,
                fixAvailable: vuln.fixAvailable
              });
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse npm audit output');
        }
      }
    }

    console.log(`✅ Dependency scan complete: ${this.findings.dependencies.length} vulnerabilities found`);
  }

  async scanCode() {
    console.log('🔍 Scanning code for security issues...');

    const sourceFiles = this.getAllFiles('src', ['.ts', '.tsx', '.js', '.jsx']);
    
    sourceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for dangerous patterns
      this.checkDangerousPatterns(file, content);
      
      // Check for hardcoded secrets
      this.checkHardcodedSecrets(file, content);
      
      // Check for XSS vulnerabilities
      this.checkXSSVulns(file, content);
      
      // Check for SQL injection patterns
      this.checkSQLInjection(file, content);
    });

    console.log(`✅ Code scan complete: ${this.findings.code.length} issues found`);
  }

  checkDangerousPatterns(file, content) {
    const dangerousPatterns = [
      {
        pattern: /eval\(/g,
        message: 'Use of eval() detected - potential code injection vulnerability'
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Use of innerHTML detected - potential XSS vulnerability'
      },
      {
        pattern: /document\.write\(/g,
        message: 'Use of document.write() detected - potential XSS vulnerability'
      },
      {
        pattern: /dangerouslySetInnerHTML/g,
        message: 'Use of dangerouslySetInnerHTML - ensure content is sanitized'
      }
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.findings.code.push({
          file: path.relative(process.cwd(), file),
          type: 'dangerous-pattern',
          severity: 'high',
          message,
          occurrences: matches.length
        });
      }
    });
  }

  checkHardcodedSecrets(file, content) {
    const secretPatterns = [
      {
        pattern: /(?:api[_-]?key|apikey|api_key)\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Potential API key found in code'
      },
      {
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Potential hardcoded password found'
      },
      {
        pattern: /(?:secret|token)\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Potential hardcoded secret/token found'
      },
      {
        pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*['"][^'"]+['"]/gi,
        message: 'Potential private key found in code'
      }
    ];

    secretPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out obvious false positives
        const realMatches = matches.filter(match => 
          !match.includes('process.env') &&
          !match.includes('YOUR_API_KEY') &&
          !match.includes('example') &&
          !match.includes('placeholder')
        );
        
        if (realMatches.length > 0) {
          this.findings.secrets.push({
            file: path.relative(process.cwd(), file),
            type: 'hardcoded-secret',
            severity: 'critical',
            message,
            occurrences: realMatches.length
          });
        }
      }
    });
  }

  checkXSSVulns(file, content) {
    // Check for potential XSS in React components
    const xssPatterns = [
      {
        pattern: /\{[^}]*\+[^}]*\}/g, // String concatenation in JSX
        message: 'String concatenation in JSX - potential XSS if user input involved'
      }
    ];

    xssPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.findings.code.push({
          file: path.relative(process.cwd(), file),
          type: 'xss-risk',
          severity: 'medium',
          message,
          occurrences: matches.length
        });
      }
    });
  }

  checkSQLInjection(file, content) {
    // Check for potential SQL injection patterns
    const sqlPatterns = [
      {
        pattern: /sql\s*\+\s*['"]/gi,
        message: 'String concatenation in SQL query - potential SQL injection'
      },
      {
        pattern: /query\s*\+\s*['"]/gi,
        message: 'String concatenation in query - potential injection vulnerability'
      }
    ];

    sqlPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.findings.code.push({
          file: path.relative(process.cwd(), file),
          type: 'sql-injection-risk',
          severity: 'high',
          message,
          occurrences: matches.length
        });
      }
    });
  }

  async scanConfiguration() {
    console.log('⚙️ Scanning configuration files...');

    const configFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      '.env.example',
      'vercel.json',
      'netlify.toml'
    ];

    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        this.checkConfigSecurity(file, content);
      }
    });

    console.log(`✅ Configuration scan complete: ${this.findings.configuration.length} issues found`);
  }

  checkConfigSecurity(file, content) {
    // Check package.json for security issues
    if (file === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        
        // Check for postinstall scripts (potential security risk)
        if (pkg.scripts?.postinstall) {
          this.findings.configuration.push({
            file,
            type: 'postinstall-script',
            severity: 'medium',
            message: 'postinstall script detected - review for security implications'
          });
        }

        // Check for dev dependencies in production
        if (pkg.dependencies && pkg.devDependencies) {
          const devInProd = Object.keys(pkg.dependencies).filter(dep => 
            Object.keys(pkg.devDependencies).includes(dep)
          );
          
          if (devInProd.length > 0) {
            this.findings.configuration.push({
              file,
              type: 'dev-deps-in-prod',
              severity: 'low',
              message: `Dev dependencies in production: ${devInProd.join(', ')}`
            });
          }
        }
      } catch (error) {
        // Invalid JSON
      }
    }

    // Check for exposed sensitive config
    const sensitivePatterns = [
      /password\s*[:=]/gi,
      /secret\s*[:=]/gi,
      /token\s*[:=]/gi,
      /key\s*[:=]/gi
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(content) && !file.includes('.example')) {
        this.findings.configuration.push({
          file,
          type: 'sensitive-config',
          severity: 'medium',
          message: 'Potentially sensitive configuration detected'
        });
      }
    });
  }

  async scanSecrets() {
    console.log('🔐 Scanning for exposed secrets...');

    // Check if .env files are in version control
    if (fs.existsSync('.env')) {
      this.findings.secrets.push({
        file: '.env',
        type: 'env-in-vcs',
        severity: 'critical',
        message: '.env file should not be in version control'
      });
    }

    // Check .gitignore for proper secret exclusions
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      
      const requiredIgnores = ['.env', '*.env', '.env.local', '.env.*.local'];
      const missingIgnores = requiredIgnores.filter(pattern => 
        !gitignore.includes(pattern)
      );
      
      if (missingIgnores.length > 0) {
        this.findings.configuration.push({
          file: '.gitignore',
          type: 'missing-secret-ignore',
          severity: 'medium',
          message: `Missing .gitignore patterns: ${missingIgnores.join(', ')}`
        });
      }
    }

    console.log(`✅ Secret scan complete: ${this.findings.secrets.length} issues found`);
  }

  generateReport() {
    console.log('\n🔒 Security Scan Report');
    console.log('================================');

    // Calculate risk score
    let riskScore = 0;
    const allFindings = [
      ...this.findings.dependencies,
      ...this.findings.code,
      ...this.findings.configuration,
      ...this.findings.secrets
    ];

    allFindings.forEach(finding => {
      switch (finding.severity) {
        case 'critical': riskScore += 10; break;
        case 'high': riskScore += 7; break;
        case 'medium': riskScore += 4; break;
        case 'low': riskScore += 1; break;
      }
    });

    // Security score (inverse of risk)
    const securityScore = Math.max(0, 100 - riskScore);

    console.log(`\n🛡️ Security Score: ${securityScore}/100`);
    console.log(`   Risk Level: ${this.getRiskLevel(riskScore)}`);

    // Summary by category
    console.log(`\n📊 Findings Summary:`);
    console.log(`   Dependencies: ${this.findings.dependencies.length}`);
    console.log(`   Code Issues: ${this.findings.code.length}`);
    console.log(`   Configuration: ${this.findings.configuration.length}`);
    console.log(`   Secrets: ${this.findings.secrets.length}`);

    // Critical issues first
    const criticalIssues = allFindings.filter(f => f.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues (${criticalIssues.length}):`);
      criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.message} (${issue.file || issue.package})`);
      });
    }

    // High severity issues
    const highIssues = allFindings.filter(f => f.severity === 'high');
    if (highIssues.length > 0) {
      console.log(`\n⚠️ High Severity Issues (${highIssues.length}):`);
      highIssues.slice(0, 5).forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.message} (${issue.file || issue.package})`);
      });
      if (highIssues.length > 5) {
        console.log(`   ... and ${highIssues.length - 5} more`);
      }
    }

    // Recommendations
    console.log(`\n💡 Security Recommendations:`);
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    // Production readiness
    const isSecure = criticalIssues.length === 0 && securityScore >= 70;
    console.log(`\n🚀 Security Status:`);
    console.log(`   Status: ${isSecure ? '✅ SECURE' : '❌ NEEDS ATTENTION'}`);
    
    if (!isSecure) {
      console.log(`   Action: Address critical and high severity issues before deployment`);
    }

    // Save detailed report
    const reportPath = 'security-scan-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      securityScore,
      riskScore,
      findings: this.findings,
      isSecure,
      recommendations
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with error code if critical issues found
    if (criticalIssues.length > 0) {
      process.exit(1);
    }
  }

  getRiskLevel(score) {
    if (score >= 50) return '🔴 Critical';
    if (score >= 25) return '🟠 High';
    if (score >= 10) return '🟡 Medium';
    return '🟢 Low';
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.findings.dependencies.length > 0) {
      recommendations.push('Run "npm audit fix" to address dependency vulnerabilities');
    }

    if (this.findings.secrets.length > 0) {
      recommendations.push('Remove hardcoded secrets and use environment variables');
    }

    if (this.findings.code.some(f => f.type === 'dangerous-pattern')) {
      recommendations.push('Replace dangerous functions with safer alternatives');
    }

    recommendations.push('Enable Content Security Policy (CSP) headers');
    recommendations.push('Implement proper input validation and sanitization');
    recommendations.push('Set up automated security scanning in CI/CD pipeline');

    return recommendations;
  }

  getAllFiles(dir, extensions = []) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const scan = (currentDir) => {
      const entries = fs.readdirSync(currentDir);
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile()) {
          if (extensions.length === 0 || extensions.some(ext => entry.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      });
    };
    
    scan(dir);
    return files;
  }
}

// Run scan
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.scan();
}

module.exports = SecurityScanner;