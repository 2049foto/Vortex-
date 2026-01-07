/**
 * Format .env.local for Vercel Environment Variables
 * Removes comments and formats for easy copy-paste
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
const outputFile = path.join(__dirname, '..', 'VERCEL_ENV_VARS.txt');

// Read .env.local
const envContent = fs.readFileSync(envFile, 'utf-8');

// Parse and format
const lines = envContent.split('\n');
const envVars = [];

for (const line of lines) {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) continue;
  
  // Skip lines without =
  if (!line.includes('=')) continue;
  
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  // Remove quotes if present
  const cleanValue = value.replace(/^["']|["']$/g, '');
  
  // Fix NEXT_PUBLIC_APP_URL to actual Vercel URL
  if (key.trim() === 'NEXT_PUBLIC_APP_URL') {
    envVars.push(`${key.trim()}=https://vortex-bice-two.vercel.app`);
  } else {
    envVars.push(`${key.trim()}=${cleanValue}`);
  }
}

// Write formatted output
const output = envVars.join('\n');
fs.writeFileSync(outputFile, output, 'utf-8');

console.log('✅ Formatted environment variables saved to VERCEL_ENV_VARS.txt');
console.log(`📋 Total variables: ${envVars.length}`);
console.log('\n📝 Instructions:');
console.log('1. Go to: https://vercel.com/derexeths-projects');
console.log('2. Select project: Vortex-');
console.log('3. Settings → Environment Variables');
console.log('4. Copy each line from VERCEL_ENV_VARS.txt');
console.log('5. Paste as: Key = Value');
console.log('6. Save and redeploy\n');

