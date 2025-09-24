const fs = require('fs');
const { execSync } = require('child_process');

function loadEncryptedEnv() {
  try {
    const key = 'mysecretkey'; // Use a secure key, perhaps from another file or environment

    // Decrypt the data using openssl
    const decrypted = execSync(`openssl enc -aes-256-cbc -d -pbkdf2 -in .env.enc -k ${key}`, { encoding: 'utf8' });

    // Parse the decrypted data as env file
    const lines = decrypted.split('\n');
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes if present
        process.env[key.trim()] = value.trim();
      }
    });

    console.log('Environment variables loaded successfully');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
  } catch (error) {
    console.error('Error loading encrypted env:', error);
  }
}

module.exports = loadEncryptedEnv;
