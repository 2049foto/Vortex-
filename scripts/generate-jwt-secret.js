/**
 * Generate JWT Secret for Vortex Protocol
 * Run: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║  🔐 VORTEX PROTOCOL - JWT SECRET GENERATOR           ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Generate 32-byte random secret
const secret = crypto.randomBytes(32).toString('base64');

console.log('Your JWT Secret (copy to .env.local and Vercel):');
console.log('\x1b[32m%s\x1b[0m', secret);
console.log('\nAdd to your environment variables:');
console.log('\x1b[36m%s\x1b[0m', `JWT_SECRET=${secret}`);
console.log('\n✅ Keep this secret safe! Never commit to git.\n');

