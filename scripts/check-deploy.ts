#!/usr/bin/env bun

import { stat, readFile, readdir } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface CheckResult {
  passed: boolean;
  message: string;
  details?: string;
}

// Check build size
async function checkBuildSize(): Promise<CheckResult> {
  const distPath = join(process.cwd(), 'dist');
  
  try {
    await stat(distPath);
  } catch {
    return {
      passed: false,
      message: 'Build directory not found',
      details: 'Run "bun run build" first'
    };
  }
  
  try {
    const { stdout } = await execAsync(`du -sh ${distPath}`);
    const sizeStr = stdout.trim().split('\t')[0];
    
    // Parse size (rough conversion to MB)
    let sizeInMB = 0;
    if (sizeStr.includes('M')) {
      sizeInMB = parseFloat(sizeStr);
    } else if (sizeStr.includes('K')) {
      sizeInMB = parseFloat(sizeStr) / 1024;
    } else if (sizeStr.includes('G')) {
      sizeInMB = parseFloat(sizeStr) * 1024;
    }
    
    const passed = sizeInMB < 25; // Cloudflare Pages limit
    
    return {
      passed,
      message: `Build size: ${sizeStr} (${passed ? 'under' : 'over'} 25MB limit)`,
      details: passed ? undefined : 'Consider optimizing your assets or using a CDN'
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to check build size',
      details: String(error)
    };
  }
}

// Check functions size
async function checkFunctionsSize(): Promise<CheckResult> {
  const functionsPath = join(process.cwd(), 'functions');
  
  try {
    await stat(functionsPath);
  } catch {
    return {
      passed: true,
      message: 'No functions directory',
      details: 'Cloudflare Functions not in use'
    };
  }
  
  try {
    const { stdout } = await execAsync(`du -sh ${functionsPath}`);
    const sizeStr = stdout.trim().split('\t')[0];
    
    // Parse size to KB
    let sizeInKB = 0;
    if (sizeStr.includes('K')) {
      sizeInKB = parseFloat(sizeStr);
    } else if (sizeStr.includes('M')) {
      sizeInKB = parseFloat(sizeStr) * 1024;
    }
    
    const passed = sizeInKB < 1024; // 1MB limit for functions
    
    return {
      passed,
      message: `Functions size: ${sizeStr} (${passed ? 'under' : 'over'} 1MB limit)`,
      details: passed ? undefined : 'Consider optimizing your function code'
    };
  } catch (error) {
    return {
      passed: false,
      message: 'Failed to check functions size',
      details: String(error)
    };
  }
}

// Check environment variables
async function checkEnvVars(): Promise<CheckResult> {
  const requiredVars = [
    'VITE_RESEND_API_KEY',
    'VITE_EMAIL_TO',
    'VITE_EMAIL_FROM'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    return {
      passed: false,
      message: 'Missing environment variables',
      details: `Required: ${missing.join(', ')}`
    };
  }
  
  return {
    passed: true,
    message: 'All environment variables present'
  };
}

// Check headers file
async function checkHeadersFile(): Promise<CheckResult> {
  const headersPath = join(process.cwd(), 'functions', '_headers.ts');
  
  try {
    const content = await readFile(headersPath, 'utf-8');
    
    // Basic validation
    if (!content.includes('export function onRequest')) {
      return {
        passed: false,
        message: 'Invalid headers file',
        details: 'Missing onRequest export'
      };
    }
    
    return {
      passed: true,
      message: 'Headers file valid'
    };
  } catch {
    return {
      passed: true,
      message: 'No custom headers file',
      details: 'Using default Cloudflare Pages headers'
    };
  }
}

// Check for common issues
async function checkCommonIssues(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // Check for large images
  try {
    const imagesPath = join(process.cwd(), 'public', 'generated');
    const files = await readdir(imagesPath);
    const largeImages: string[] = [];
    
    for (const file of files) {
      const filePath = join(imagesPath, file);
      const stats = await stat(filePath);
      if (stats.size > 500 * 1024) { // 500KB
        largeImages.push(`${file} (${Math.round(stats.size / 1024)}KB)`);
      }
    }
    
    if (largeImages.length > 0) {
      results.push({
        passed: false,
        message: 'Large image files detected',
        details: `Consider optimizing: ${largeImages.slice(0, 3).join(', ')}${largeImages.length > 3 ? ` and ${largeImages.length - 3} more` : ''}`
      });
    }
  } catch {
    // Images directory doesn't exist, that's fine
  }
  
  // Check node_modules in dist
  try {
    const distModules = join(process.cwd(), 'dist', 'node_modules');
    await stat(distModules);
    results.push({
      passed: false,
      message: 'node_modules found in dist',
      details: 'This will significantly increase deployment size'
    });
  } catch {
    // Good, node_modules not in dist
  }
  
  // Check for .env files in dist
  try {
    const distEnv = join(process.cwd(), 'dist', '.env');
    await stat(distEnv);
    results.push({
      passed: false,
      message: '.env file found in dist',
      details: 'Never deploy environment files!'
    });
  } catch {
    // Good, no .env in dist
  }
  
  return results;
}

// Check Cloudflare configuration
async function checkCloudflareConfig(): Promise<CheckResult> {
  try {
    // Check if wrangler.toml exists
    const wranglerPath = join(process.cwd(), 'wrangler.toml');
    await stat(wranglerPath);
    
    const content = await readFile(wranglerPath, 'utf-8');
    if (!content.includes('name =') || !content.includes('compatibility_date =')) {
      return {
        passed: false,
        message: 'Invalid wrangler.toml',
        details: 'Missing required fields'
      };
    }
    
    return {
      passed: true,
      message: 'Cloudflare configuration valid'
    };
  } catch {
    // No wrangler.toml, using default Pages config
    return {
      passed: true,
      message: 'Using default Cloudflare Pages configuration'
    };
  }
}

// Main deployment check
async function checkDeployment() {
  console.log(chalk.blue('🔍 Checking deployment readiness...\n'));
  
  const checks: Array<{ name: string; check: () => Promise<CheckResult | CheckResult[]> }> = [
    { name: 'Build Size', check: checkBuildSize },
    { name: 'Functions Size', check: checkFunctionsSize },
    { name: 'Environment Variables', check: checkEnvVars },
    { name: 'Headers Configuration', check: checkHeadersFile },
    { name: 'Cloudflare Config', check: checkCloudflareConfig },
    { name: 'Common Issues', check: checkCommonIssues }
  ];
  
  let allPassed = true;
  const results: Array<{ name: string; results: CheckResult[] }> = [];
  
  for (const { name, check } of checks) {
    const result = await check();
    const resultsArray = Array.isArray(result) ? result : [result];
    results.push({ name, results: resultsArray });
    
    if (resultsArray.some(r => !r.passed)) {
      allPassed = false;
    }
  }
  
  // Display results
  for (const { name, results: checkResults } of results) {
    if (checkResults.length === 0) continue;
    
    console.log(chalk.bold(`${name}:`));
    
    for (const result of checkResults) {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? chalk.green : chalk.red;
      
      console.log(`${icon} ${color(result.message)}`);
      if (result.details) {
        console.log(chalk.gray(`   ${result.details}`));
      }
    }
    
    console.log();
  }
  
  // Summary
  if (allPassed) {
    console.log(chalk.green.bold('✨ All checks passed! Your deployment should succeed.'));
    console.log(chalk.gray('\nDeploy with: git push'));
  } else {
    console.log(chalk.red.bold('⚠️  Some checks failed. Review the issues above.'));
    console.log(chalk.yellow('\nYou can still deploy, but you may encounter issues.'));
  }
  
  // Additional tips
  console.log(chalk.cyan('\n💡 Pro tips:'));
  console.log(chalk.gray('   - Test locally with: wrangler pages dev ./dist'));
  console.log(chalk.gray('   - Check deployment logs at: https://dash.cloudflare.com'));
  console.log(chalk.gray('   - Monitor performance with Web Analytics'));
}

// Run deployment check
checkDeployment().catch(console.error);