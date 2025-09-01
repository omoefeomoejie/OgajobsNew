#!/usr/bin/env node

/**
 * Database Health Check Script
 * Monitors database performance, connections, and query optimization
 */

const fs = require('fs');
const path = require('path');

class DatabaseHealthChecker {
  constructor() {
    this.results = {};
    this.thresholds = {
      connectionUtilization: 80,  // percentage
      avgQueryTime: 1000,        // milliseconds
      slowQueryCount: 10,        // count
      indexUsage: 90,            // percentage
      cacheHitRatio: 95,         // percentage
      lockWaitTime: 5000,        // milliseconds
      diskUsage: 85              // percentage
    };
  }

  async checkHealth() {
    console.log('🔍 Starting Database Health Check...\n');

    try {
      await this.checkConnections();
      await this.checkQueryPerformance();
      await this.checkIndexUsage();
      await this.checkCachePerformance();
      await this.checkLockContention();
      await this.checkDiskUsage();
      await this.checkSecurityCompliance();
      await this.generateReport();
      await this.checkAlerts();
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      process.exit(1);
    }
  }

  async checkConnections() {
    console.log('🔗 Checking database connections...');

    // Simulated connection data
    // In production, this would query the actual database
    this.results.connections = {
      active: 25,
      idle: 15,
      waiting: 2,
      total: 42,
      max: 100,
      utilization: 42,
      topConnections: [
        { database: 'postgres', user: 'app_user', count: 20, state: 'active' },
        { database: 'postgres', user: 'read_only', count: 15, state: 'idle' },
        { database: 'postgres', user: 'analytics', count: 7, state: 'active' }
      ]
    };

    console.log(`  Active: ${this.results.connections.active}`);
    console.log(`  Idle: ${this.results.connections.idle}`);
    console.log(`  Waiting: ${this.results.connections.waiting}`);
    console.log(`  Utilization: ${this.results.connections.utilization}%`);

    if (this.results.connections.utilization > this.thresholds.connectionUtilization) {
      console.log('  ⚠️ High connection utilization detected');
    }
  }

  async checkQueryPerformance() {
    console.log('⚡ Checking query performance...');

    // Simulated query performance data
    this.results.queryPerformance = {
      avgQueryTime: 150,
      slowQueryCount: 5,
      totalQueries: 15420,
      queriesPerSecond: 45.2,
      slowQueries: [
        {
          query: 'SELECT * FROM bookings WHERE status = $1 ORDER BY created_at DESC',
          calls: 1250,
          totalTime: 15000,
          meanTime: 12,
          maxTime: 245
        },
        {
          query: 'SELECT a.*, AVG(ar.rating) FROM artisans a LEFT JOIN artisan_reviews ar...',
          calls: 890,
          totalTime: 12500,
          meanTime: 14,
          maxTime: 189
        }
      ],
      recommendations: []
    };

    console.log(`  Average Query Time: ${this.results.queryPerformance.avgQueryTime}ms`);
    console.log(`  Slow Queries: ${this.results.queryPerformance.slowQueryCount}`);
    console.log(`  Queries/Second: ${this.results.queryPerformance.queriesPerSecond}`);

    // Analyze slow queries
    this.results.queryPerformance.slowQueries.forEach((query, index) => {
      if (query.meanTime > 10) {
        this.results.queryPerformance.recommendations.push({
          query: query.query.substring(0, 50) + '...',
          issue: 'High average execution time',
          suggestion: 'Consider adding indexes or optimizing query structure'
        });
      }
    });

    if (this.results.queryPerformance.recommendations.length > 0) {
      console.log(`  ⚠️ ${this.results.queryPerformance.recommendations.length} optimization opportunities found`);
    }
  }

  async checkIndexUsage() {
    console.log('📊 Checking index usage...');

    // Simulated index usage data
    this.results.indexUsage = {
      totalIndexes: 45,
      usedIndexes: 41,
      unusedIndexes: 4,
      usagePercentage: 91.1,
      topIndexes: [
        { name: 'idx_bookings_status_date', scans: 12450, tuplesRead: 89230 },
        { name: 'idx_artisans_city_category', scans: 8900, tuplesRead: 45600 },
        { name: 'idx_profiles_role', scans: 5600, tuplesRead: 12800 }
      ],
      unusedIndexes: [
        { name: 'idx_old_migration_temp', size: '125 MB', lastUsed: null },
        { name: 'idx_backup_temp', size: '45 MB', lastUsed: null }
      ],
      missingIndexes: [
        {
          table: 'bookings',
          columns: ['artisan_id', 'status'],
          reason: 'Frequent filtering by artisan and status together'
        }
      ]
    };

    console.log(`  Index Usage: ${this.results.indexUsage.usagePercentage}%`);
    console.log(`  Used Indexes: ${this.results.indexUsage.usedIndexes}/${this.results.indexUsage.totalIndexes}`);
    console.log(`  Unused Indexes: ${this.results.indexUsage.unusedIndexes.length}`);

    if (this.results.indexUsage.unusedIndexes.length > 0) {
      console.log('  📝 Unused indexes detected - consider removal');
    }

    if (this.results.indexUsage.missingIndexes.length > 0) {
      console.log('  📝 Missing indexes detected - consider creation');
    }
  }

  async checkCachePerformance() {
    console.log('💾 Checking cache performance...');

    // Simulated cache performance data
    this.results.cachePerformance = {
      hitRatio: 96.8,
      missRatio: 3.2,
      bufferHits: 1245600,
      bufferReads: 41200,
      effectiveCacheSize: '2GB',
      sharedBuffers: '512MB',
      workMem: '16MB'
    };

    console.log(`  Cache Hit Ratio: ${this.results.cachePerformance.hitRatio}%`);
    console.log(`  Cache Miss Ratio: ${this.results.cachePerformance.missRatio}%`);
    console.log(`  Effective Cache Size: ${this.results.cachePerformance.effectiveCacheSize}`);

    if (this.results.cachePerformance.hitRatio < this.thresholds.cacheHitRatio) {
      console.log('  ⚠️ Low cache hit ratio - consider increasing shared_buffers');
    }
  }

  async checkLockContention() {
    console.log('🔒 Checking lock contention...');

    // Simulated lock data
    this.results.lockContention = {
      activeLocks: 25,
      waitingLocks: 0,
      blockedQueries: [],
      lockTypes: {
        AccessShareLock: 15,
        RowShareLock: 8,
        RowExclusiveLock: 2
      },
      deadlocks: 0,
      avgLockWaitTime: 0
    };

    console.log(`  Active Locks: ${this.results.lockContention.activeLocks}`);
    console.log(`  Waiting Locks: ${this.results.lockContention.waitingLocks}`);
    console.log(`  Deadlocks: ${this.results.lockContention.deadlocks}`);

    if (this.results.lockContention.waitingLocks > 0) {
      console.log('  ⚠️ Lock contention detected');
    }
  }

  async checkDiskUsage() {
    console.log('💿 Checking disk usage...');

    // Simulated disk usage data
    this.results.diskUsage = {
      totalSize: '50GB',
      usedSize: '28GB',
      availableSize: '22GB',
      usagePercentage: 56,
      tablesSizes: [
        { name: 'bookings', size: '2.5GB', percentage: 5.0 },
        { name: 'artisan_reviews', size: '1.8GB', percentage: 3.6 },
        { name: 'audit_logs', size: '3.2GB', percentage: 6.4 }
      ],
      indexSizes: [
        { name: 'idx_bookings_status_date', size: '256MB' },
        { name: 'idx_artisans_city_category', size: '128MB' }
      ],
      walSize: '1.2GB'
    };

    console.log(`  Disk Usage: ${this.results.diskUsage.usagePercentage}%`);
    console.log(`  Used: ${this.results.diskUsage.usedSize} / ${this.results.diskUsage.totalSize}`);
    console.log(`  Available: ${this.results.diskUsage.availableSize}`);

    if (this.results.diskUsage.usagePercentage > this.thresholds.diskUsage) {
      console.log('  ⚠️ High disk usage - consider cleanup or expansion');
    }
  }

  async checkSecurityCompliance() {
    console.log('🔐 Checking security compliance...');

    // Simulated security check data
    this.results.security = {
      rlsEnabled: true,
      tablesWithRLS: 15,
      tablesWithoutRLS: 2,
      policies: {
        total: 45,
        active: 43,
        inactive: 2
      },
      sensitiveDataAccess: {
        recentAccess: 25,
        unauthorizedAttempts: 0
      },
      auditLogging: true,
      encryptionAtRest: true,
      sslConnections: 100,
      vulnerabilities: []
    };

    console.log(`  RLS Enabled: ${this.results.security.rlsEnabled ? '✅' : '❌'}`);
    console.log(`  Tables with RLS: ${this.results.security.tablesWithRLS}`);
    console.log(`  Active Policies: ${this.results.security.policies.active}/${this.results.security.policies.total}`);
    console.log(`  SSL Connections: ${this.results.security.sslConnections}%`);

    if (this.results.security.tablesWithoutRLS > 0) {
      console.log(`  ⚠️ ${this.results.security.tablesWithoutRLS} tables without RLS protection`);
    }
  }

  async generateReport() {
    console.log('\n📊 Generating Database Health Report...');

    const healthScore = this.calculateHealthScore();
    
    const report = {
      timestamp: new Date().toISOString(),
      healthScore: healthScore,
      status: this.getHealthStatus(healthScore),
      checks: {
        connections: this.results.connections,
        queryPerformance: this.results.queryPerformance,
        indexUsage: this.results.indexUsage,
        cachePerformance: this.results.cachePerformance,
        lockContention: this.results.lockContention,
        diskUsage: this.results.diskUsage,
        security: this.results.security
      },
      recommendations: this.generateRecommendations(),
      thresholds: this.thresholds
    };

    // Save report
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(reportsDir, `db-health-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📄 Report saved: ${reportFile}`);
    console.log(`🎯 Health Score: ${healthScore}/100`);
    console.log(`📊 Status: ${report.status}`);

    return report;
  }

  calculateHealthScore() {
    let score = 100;

    // Connection utilization penalty
    if (this.results.connections.utilization > this.thresholds.connectionUtilization) {
      score -= Math.min(20, (this.results.connections.utilization - this.thresholds.connectionUtilization) / 2);
    }

    // Query performance penalty
    if (this.results.queryPerformance.avgQueryTime > this.thresholds.avgQueryTime) {
      score -= Math.min(15, (this.results.queryPerformance.avgQueryTime - this.thresholds.avgQueryTime) / 100);
    }

    // Slow queries penalty
    if (this.results.queryPerformance.slowQueryCount > this.thresholds.slowQueryCount) {
      score -= Math.min(10, this.results.queryPerformance.slowQueryCount - this.thresholds.slowQueryCount);
    }

    // Index usage penalty
    if (this.results.indexUsage.usagePercentage < this.thresholds.indexUsage) {
      score -= Math.min(15, this.thresholds.indexUsage - this.results.indexUsage.usagePercentage);
    }

    // Cache hit ratio penalty
    if (this.results.cachePerformance.hitRatio < this.thresholds.cacheHitRatio) {
      score -= Math.min(10, this.thresholds.cacheHitRatio - this.results.cachePerformance.hitRatio);
    }

    // Disk usage penalty
    if (this.results.diskUsage.usagePercentage > this.thresholds.diskUsage) {
      score -= Math.min(10, (this.results.diskUsage.usagePercentage - this.thresholds.diskUsage) / 2);
    }

    // Security penalties
    if (this.results.security.tablesWithoutRLS > 0) {
      score -= this.results.security.tablesWithoutRLS * 5;
    }

    return Math.max(0, Math.round(score));
  }

  getHealthStatus(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'FAIR';
    if (score >= 60) return 'POOR';
    return 'CRITICAL';
  }

  generateRecommendations() {
    const recommendations = [];

    // Connection recommendations
    if (this.results.connections.utilization > this.thresholds.connectionUtilization) {
      recommendations.push({
        category: 'Connections',
        priority: 'High',
        issue: 'High connection utilization',
        action: 'Implement connection pooling and review connection timeout settings'
      });
    }

    // Query performance recommendations
    if (this.results.queryPerformance.slowQueryCount > this.thresholds.slowQueryCount) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Multiple slow queries detected',
        action: 'Review and optimize slow queries, consider adding indexes'
      });
    }

    // Index recommendations
    if (this.results.indexUsage.unusedIndexes.length > 0) {
      recommendations.push({
        category: 'Indexes',
        priority: 'Medium',
        issue: 'Unused indexes consuming space',
        action: 'Remove unused indexes to improve write performance and reduce storage'
      });
    }

    if (this.results.indexUsage.missingIndexes.length > 0) {
      recommendations.push({
        category: 'Indexes',
        priority: 'Medium',
        issue: 'Missing indexes for common queries',
        action: 'Create indexes for frequently filtered columns'
      });
    }

    // Cache recommendations
    if (this.results.cachePerformance.hitRatio < this.thresholds.cacheHitRatio) {
      recommendations.push({
        category: 'Cache',
        priority: 'Medium',
        issue: 'Low cache hit ratio',
        action: 'Increase shared_buffers or optimize queries to be more cache-friendly'
      });
    }

    // Security recommendations
    if (this.results.security.tablesWithoutRLS > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        issue: 'Tables without Row Level Security',
        action: 'Enable RLS and create appropriate policies for all public tables'
      });
    }

    return recommendations;
  }

  async checkAlerts() {
    console.log('\n🚨 Checking Alert Conditions...');

    const alerts = [];

    // Critical connection usage
    if (this.results.connections.utilization > 90) {
      alerts.push({
        level: 'CRITICAL',
        category: 'Connections',
        message: `Connection utilization (${this.results.connections.utilization}%) is critically high`
      });
    }

    // Long running queries
    if (this.results.queryPerformance.slowQueryCount > 20) {
      alerts.push({
        level: 'WARNING',
        category: 'Performance',
        message: `High number of slow queries (${this.results.queryPerformance.slowQueryCount})`
      });
    }

    // Security issues
    if (this.results.security.tablesWithoutRLS > 0) {
      alerts.push({
        level: 'CRITICAL',
        category: 'Security',
        message: `${this.results.security.tablesWithoutRLS} tables without RLS protection`
      });
    }

    // Disk space
    if (this.results.diskUsage.usagePercentage > this.thresholds.diskUsage) {
      alerts.push({
        level: 'WARNING',
        category: 'Storage',
        message: `Disk usage (${this.results.diskUsage.usagePercentage}%) exceeds threshold`
      });
    }

    if (alerts.length === 0) {
      console.log('✅ No critical alerts - database health is within acceptable ranges');
    } else {
      console.log(`⚠️ ${alerts.length} alert(s) found:`);
      alerts.forEach(alert => {
        console.log(`  ${alert.level}: ${alert.category} - ${alert.message}`);
      });
    }

    return alerts;
  }
}

// CLI execution
if (require.main === module) {
  const checker = new DatabaseHealthChecker();
  checker.checkHealth().catch(error => {
    console.error('Database health check failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseHealthChecker;