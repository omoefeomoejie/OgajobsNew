#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CleanupReport {
  unusedImports: string[];
  unusedFiles: string[];
  todoComments: string[];
  duplicateCode: string[];
  deprecatedFunctions: string[];
}

class CodeCleanupTool {
  private srcDir: string;
  private report: CleanupReport;

  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.report = {
      unusedImports: [],
      unusedFiles: [],
      todoComments: [],
      duplicateCode: [],
      deprecatedFunctions: []
    };
  }

  async cleanup(): Promise<CleanupReport> {
    console.log('🧹 Starting code cleanup...');
    
    await this.findUnusedImports();
    await this.findUnusedFiles();
    await this.findTodoComments();
    await this.findDeprecatedFunctions();
    
    console.log('✅ Code cleanup analysis complete');
    return this.report;
  }

  private async findUnusedImports(): Promise<void> {
    console.log('🔍 Scanning for unused imports...');
    
    const files = await this.getAllTsFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Find import statements
      const imports = lines
        .filter(line => line.trim().startsWith('import'))
        .map(line => line.trim());
      
      for (const importLine of imports) {
        // Extract imported names
        const match = importLine.match(/import\s+{([^}]+)}/);
        if (match) {
          const importedNames = match[1]
            .split(',')
            .map(name => name.trim());
          
          for (const name of importedNames) {
            // Check if imported name is used in the file
            const isUsed = content.includes(name) && 
              content.split(name).length > 2; // More than just the import
            
            if (!isUsed) {
              this.report.unusedImports.push(`${file}: ${name}`);
            }
          }
        }
      }
    }
  }

  private async findUnusedFiles(): Promise<void> {
    console.log('🔍 Scanning for unused files...');
    
    const allFiles = await this.getAllTsFiles();
    const usedFiles = new Set<string>();
    
    // Find all import statements to see which files are referenced
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      
      if (importMatches) {
        for (const importMatch of importMatches) {
          const pathMatch = importMatch.match(/['"]([^'"]+)['"]/);
          if (pathMatch) {
            const importPath = pathMatch[1];
            if (importPath.startsWith('./') || importPath.startsWith('../')) {
              // Resolve relative path
              const resolvedPath = path.resolve(path.dirname(file), importPath);
              usedFiles.add(resolvedPath + '.tsx');
              usedFiles.add(resolvedPath + '.ts');
              usedFiles.add(resolvedPath + '/index.tsx');
              usedFiles.add(resolvedPath + '/index.ts');
            }
          }
        }
      }
    }
    
    // Check for files that aren't imported
    for (const file of allFiles) {
      if (!usedFiles.has(file) && 
          !file.includes('main.tsx') && 
          !file.includes('App.tsx') &&
          !file.includes('.test.') &&
          !file.includes('.spec.')) {
        this.report.unusedFiles.push(file);
      }
    }
  }

  private async findTodoComments(): Promise<void> {
    console.log('🔍 Scanning for TODO comments...');
    
    const files = await this.getAllTsFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const todoMatch = line.match(/(TODO|FIXME|XXX|HACK):\s*(.+)/i);
        if (todoMatch) {
          this.report.todoComments.push(
            `${file}:${index + 1} - ${todoMatch[1]}: ${todoMatch[2]}`
          );
        }
      });
    }
  }

  private async findDeprecatedFunctions(): Promise<void> {
    console.log('🔍 Scanning for deprecated functions...');
    
    const files = await this.getAllTsFiles();
    const deprecatedPatterns = [
      'ReactDOM.render', // Use createRoot instead
      'componentWillMount',
      'componentWillUpdate',
      'componentWillReceiveProps',
      'findDOMNode',
      'String.prototype.substr', // Use substring instead
      'new Date().getYear()' // Use getFullYear instead
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of deprecatedPatterns) {
        if (content.includes(pattern)) {
          this.report.deprecatedFunctions.push(`${file}: ${pattern}`);
        }
      }
    }
  }

  private async getAllTsFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          scanDir(fullPath);
        } else if (
          entry.isFile() && 
          (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
        ) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(this.srcDir);
    return files;
  }

  generateReport(): string {
    let report = '# Code Cleanup Report\n\n';
    
    if (this.report.unusedImports.length > 0) {
      report += '## 🚫 Unused Imports\n';
      this.report.unusedImports.forEach(item => {
        report += `- ${item}\n`;
      });
      report += '\n';
    }
    
    if (this.report.unusedFiles.length > 0) {
      report += '## 📁 Potentially Unused Files\n';
      this.report.unusedFiles.forEach(file => {
        report += `- ${file}\n`;
      });
      report += '\n';
    }
    
    if (this.report.todoComments.length > 0) {
      report += '## 📝 TODO Comments\n';
      this.report.todoComments.forEach(todo => {
        report += `- ${todo}\n`;
      });
      report += '\n';
    }
    
    if (this.report.deprecatedFunctions.length > 0) {
      report += '## ⚠️ Deprecated Functions\n';
      this.report.deprecatedFunctions.forEach(func => {
        report += `- ${func}\n`;
      });
      report += '\n';
    }
    
    report += '## 📊 Summary\n';
    report += `- Unused imports: ${this.report.unusedImports.length}\n`;
    report += `- Unused files: ${this.report.unusedFiles.length}\n`;
    report += `- TODO comments: ${this.report.todoComments.length}\n`;
    report += `- Deprecated functions: ${this.report.deprecatedFunctions.length}\n`;
    
    return report;
  }
}

// Run the cleanup tool
if (import.meta.url === `file://${process.argv[1]}`) {
  const tool = new CodeCleanupTool();
  tool.cleanup().then((report) => {
    const reportContent = tool.generateReport();
    console.log(reportContent);
    
    // Save report to file
    fs.writeFileSync('cleanup-report.md', reportContent);
    console.log('📄 Report saved to cleanup-report.md');
  });
}

export default CodeCleanupTool;