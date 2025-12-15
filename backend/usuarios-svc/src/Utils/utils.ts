/**
 * Genera un código de acceso alfanumérico único.
 * @param {number} length - Longitud del código.
 * @returns {string} - El código generado.
 */
export const generarCodigoAcceso = (length = 8) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = upper + lower + numbers;

  let result = '';
  // Ensure strict requirements
  result += upper.charAt(Math.floor(Math.random() * upper.length));
  result += lower.charAt(Math.floor(Math.random() * lower.length));
  result += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Fill the rest
  for (let i = 3; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle to avoid predictable patterns
  return result
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};
