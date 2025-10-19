const crypto = require('crypto');

/**
 * Generates a secure random temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and symbols
 * Example: "Xk9#mP2$qL5!"
 */
function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  // Ensure at least one character from each category
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill remaining characters randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < 12; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password to randomize character positions
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

module.exports = { generateTemporaryPassword };
