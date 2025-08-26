#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting build cleanup and optimization...\n');

// Function to safely remove directory
function safeRemoveDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`Removing ${dirPath}...`);
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
      }
      console.log(`✅ Removed ${dirPath}`);
    }
  } catch (error) {
    console.log(`⚠️ Warning: Could not remove ${dirPath} - ${error.message}`);
  }
}

// Function to clear npm cache
function clearNpmCache() {
  try {
    console.log('Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ npm cache cleared');
  } catch (error) {
    console.log(`⚠️ Warning: Could not clear npm cache - ${error.message}`);
  }
}

// Function to update browserslist
function updateBrowserslist() {
  try {
    console.log('Updating browserslist database...');
    execSync('npx update-browserslist-db@latest', { stdio: 'inherit' });
    console.log('✅ Browserslist database updated');
  } catch (error) {
    console.log(`⚠️ Warning: Could not update browserslist - ${error.message}`);
  }
}

// Main cleanup process
async function cleanup() {
  console.log('Phase 1: Removing build artifacts and dependencies...');
  safeRemoveDir('dist');
  safeRemoveDir('node_modules');
  safeRemoveDir('.vite');
  
  console.log('\nPhase 2: Clearing caches...');
  clearNpmCache();
  
  console.log('\nPhase 3: Updating browser data...');
  updateBrowserslist();
  
  console.log('\nPhase 4: Reinstalling dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies reinstalled successfully');
  } catch (error) {
    console.log(`❌ Error installing dependencies: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n🎉 Build cleanup completed successfully!');
  console.log('You can now run "npm run build" to create an optimized production build.');
}

// Run cleanup
cleanup().catch((error) => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});