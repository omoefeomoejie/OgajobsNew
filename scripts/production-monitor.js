#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Production monitoring script for ongoing performance and health checks
 */
class ProductionMonitor {
  constructor() {
    this.monitoringResults = {
      performance: null,
      health: null,
      security: null,
      timestamp: new Date().toISOString()
    };
  }

  async monitor() {
    console.log('📊 Starting production monitoring...\n');

    try {
      await this.monitorPerformance();
      await this.checkHealth();
      await this.runSecurityScan();
      
      this.generateMonitoringReport();
      
      console.log('✅ Production monitoring completed successfully!');
      
    } catch (error) {
      console.error('❌ Production monitoring failed:', error.message);
      process.exit(1);
    }
  }

  async monitorPerformance() {
    console.log('⚡ Monitoring performance metrics...');
    try {
      execSync('node scripts/performance-monitor.js', { stdio: 'inherit' });
      this.monitoringResults.performance = { status: 'success', timestamp: new Date().toISOString() };
      console.log('✅ Performance monitoring completed\n');
    } catch (error) {
      this.monitoringResults.performance = { status: 'error', error: error.message, timestamp: new Date().toISOString() };
      console.warn('⚠️  Performance monitoring had issues, continuing...\n');
    }
  }

  async checkHealth() {
    console.log('🏥 Checking system health...');
    try {
      execSync('node scripts/db-health-check.js', { stdio: 'inherit' });
      this.monitoringResults.health = { status: 'success', timestamp: new Date().toISOString() };
      console.log('✅ Health check completed\n');
    } catch (error) {
      this.monitoringResults.health = { status: 'error', error: error.message, timestamp: new Date().toISOString() };
      console.warn('⚠️  Health check had issues, continuing...\n');
    }
  }

  async runSecurityScan() {
    console.log('🔒 Running security scan...');
    try {
      execSync('node scripts/security-scan.js --monitor', { stdio: 'inherit' });
      this.monitoringResults.security = { status: 'success', timestamp: new Date().toISOString() };
      console.log('✅ Security scan completed\n');
    } catch (error) {
      this.monitoringResults.security = { status: 'error', error: error.message, timestamp: new Date().toISOString() };
      console.warn('⚠️  Security scan had issues, continuing...\n');
    }
  }

  generateMonitoringReport() {
    const reportPath = path.join(process.cwd(), 'monitoring-report.json');
    
    const report = {
      ...this.monitoringResults,
      summary: this.generateSummary()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Monitoring report generated:', reportPath);
    this.printSummary();
  }

  generateSummary() {
    const results = this.monitoringResults;
    const totalChecks = Object.keys(results).filter(key => key !== 'timestamp').length;
    const successfulChecks = Object.values(results)
      .filter(result => result && typeof result === 'object' && result.status === 'success').length;
    
    return {
      totalChecks,
      successfulChecks,
      failedChecks: totalChecks - successfulChecks,
      overallStatus: successfulChecks === totalChecks ? 'healthy' : 'needs_attention'
    };
  }

  printSummary() {
    const summary = this.generateSummary();
    
    console.log('\n📊 MONITORING SUMMARY');
    console.log('━'.repeat(40));
    console.log(`Overall Status: ${summary.overallStatus.toUpperCase()}`);
    console.log(`Successful Checks: ${summary.successfulChecks}/${summary.totalChecks}`);
    console.log(`Failed Checks: ${summary.failedChecks}`);
    console.log(`Timestamp: ${this.monitoringResults.timestamp}`);
    
    if (summary.overallStatus !== 'healthy') {
      console.log('\n⚠️  ATTENTION REQUIRED:');
      Object.entries(this.monitoringResults).forEach(([check, result]) => {
        if (result && typeof result === 'object' && result.status === 'error') {
          console.log(`  - ${check}: ${result.error}`);
        }
      });
    }
    
    console.log('━'.repeat(40));
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new ProductionMonitor();
  monitor.monitor();
}

module.exports = ProductionMonitor;