#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Analysis Report\n');

// Check if bundle analysis file exists
const analysisFile = path.join(process.cwd(), 'dist', 'bundle-analysis.html');

if (fs.existsSync(analysisFile)) {
  console.log('✅ Bundle analysis generated successfully!');
  console.log(`📁 Location: ${analysisFile}`);
  console.log('🌐 Open the file in your browser to view the interactive analysis.');
  
  // Try to get file size information
  try {
    const distDir = path.join(process.cwd(), 'dist');
    const files = fs.readdirSync(distDir, { withFileTypes: true });
    
    console.log('\n📦 Build Output Summary:');
    console.log('─'.repeat(50));
    
    let totalSize = 0;
    const jsFiles = [];
    const cssFiles = [];
    const assetFiles = [];
    
    files.forEach(file => {
      if (file.isFile()) {
        const filePath = path.join(distDir, file.name);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        
        if (file.name.endsWith('.js')) {
          jsFiles.push({ name: file.name, size: sizeKB });
        } else if (file.name.endsWith('.css')) {
          cssFiles.push({ name: file.name, size: sizeKB });
        } else if (!file.name.endsWith('.html')) {
          assetFiles.push({ name: file.name, size: sizeKB });
        }
      }
    });
    
    // Sort by size (largest first)
    jsFiles.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    cssFiles.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    assetFiles.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    
    console.log(`📋 JavaScript Files (${jsFiles.length}):`);
    jsFiles.forEach(file => {
      console.log(`  • ${file.name}: ${file.size} KB`);
    });
    
    if (cssFiles.length > 0) {
      console.log(`\n🎨 CSS Files (${cssFiles.length}):`);
      cssFiles.forEach(file => {
        console.log(`  • ${file.name}: ${file.size} KB`);
      });
    }
    
    if (assetFiles.length > 0) {
      console.log(`\n🖼️ Assets (${assetFiles.length}):`);
      assetFiles.forEach(file => {
        console.log(`  • ${file.name}: ${file.size} KB`);
      });
    }
    
    console.log('─'.repeat(50));
    console.log(`📊 Total Build Size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total Build Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    const largeJSFiles = jsFiles.filter(file => parseFloat(file.size) > 500);
    if (largeJSFiles.length > 0) {
      console.log('⚠️  Large JS chunks detected (>500KB):');
      largeJSFiles.forEach(file => {
        console.log(`   • Consider code splitting for: ${file.name}`);
      });
    } else {
      console.log('✅ All JS chunks are reasonably sized (<500KB)');
    }
    
    if (totalSize > 5 * 1024 * 1024) { // 5MB
      console.log('⚠️  Total bundle size is large (>5MB). Consider:');
      console.log('   • Lazy loading non-critical components');
      console.log('   • Tree shaking unused dependencies');
      console.log('   • Image optimization');
    } else {
      console.log('✅ Total bundle size is reasonable');
    }
    
  } catch (error) {
    console.log('⚠️ Could not analyze build files:', error.message);
  }
  
} else {
  console.log('❌ Bundle analysis file not found.');
  console.log('Make sure to run "npm run build" first to generate the analysis.');
}

console.log('\n🔍 For detailed analysis, open dist/bundle-analysis.html in your browser.');