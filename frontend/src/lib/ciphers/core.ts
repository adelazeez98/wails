
export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

export const modInverse = (a: number, m: number): number => {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return -1;
};

export const isCoprime = (a: number, m: number) => gcd(a, m) === 1;

export const additiveCipher = (text: string, key: number, decrypt = false): string => {
  if (key < 0 || key > 25) {
    throw new Error("Key for Additive cipher must be between 0 and 25.");
  }
  const shift = decrypt ? mod(-key, 26) : mod(key, 26);
  const result = text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map(c => String.fromCharCode(mod(c.charCodeAt(0) - 65 + shift, 26) + 65))
    .join('');
  return decrypt ? result.toLowerCase() : result;
};

export const multiplicativeCipher = (text: string, key: number, decrypt = false): string => {
  if (key < 0 || key > 25) {
    throw new Error("Key for Multiplicative cipher must be between 0 and 25.");
  }
  if (!isCoprime(key, 26)) throw new Error("Key must be coprime to 26.");
  const multiplier = decrypt ? modInverse(key, 26) : mod(key, 26);
  const result = text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map(c => String.fromCharCode(mod((c.charCodeAt(0) - 65) * multiplier, 26) + 65))
    .join('');
  return decrypt ? result.toLowerCase() : result;
};

export const affineCipher = (text: string, a: number, b: number, decrypt = false): string => {
  if (a < 0 || a > 25 || b < 0 || b > 25) {
    throw new Error("Keys 'a' and 'b' for Affine cipher must be between 0 and 25.");
  }
  if (!isCoprime(a, 26)) throw new Error("Key 'a' must be coprime to 26.");
  let result;
  if (decrypt) {
    const aInv = modInverse(a, 26);
    result = text
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .split('')
      .map(c => String.fromCharCode(mod(aInv * (c.charCodeAt(0) - 65 - b), 26) + 65))
      .join('');
  } else {
    result = text
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .split('')
      .map(c => String.fromCharCode(mod(a * (c.charCodeAt(0) - 65) + b, 26) + 65))
      .join('');
  }
  return decrypt ? result.toLowerCase() : result;
};

export const vigenereCipher = (text: string, key: string, decrypt = false): string => {
  if (!/^[a-zA-Z]+$/.test(key)) {
    throw new Error("Key for Vigenere cipher must only contain letters.");
  }
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return cleanText;
  
  const result = cleanText
    .split('')
    .map((c, i) => {
      const p = c.charCodeAt(0) - 65;
      const k = cleanKey[i % cleanKey.length].charCodeAt(0) - 65;
      const shift = decrypt ? mod(p - k, 26) : mod(p + k, 26);
      return String.fromCharCode(shift + 65);
    })
    .join('');
  return decrypt ? result.toLowerCase() : result;
};

export const autokeyCipher = (text: string, key: string, decrypt = false): string => {
  if (!/^[a-zA-Z]+$/.test(key)) {
    throw new Error("Key for Autokey cipher must only contain letters.");
  }
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return cleanText;

  let result = '';
  if (decrypt) {
    let currentKey = cleanKey;
    for (let i = 0; i < cleanText.length; i++) {
      const p = cleanText[i].charCodeAt(0) - 65;
      const k = currentKey[i].charCodeAt(0) - 65;
      const decodedChar = String.fromCharCode(mod(p - k, 26) + 65);
      result += decodedChar;
      currentKey += decodedChar;
    }
  } else {
    const fullKey = (cleanKey + cleanText).substring(0, cleanText.length);
    for (let i = 0; i < cleanText.length; i++) {
      const p = cleanText[i].charCodeAt(0) - 65;
      const k = fullKey[i].charCodeAt(0) - 65;
      result += String.fromCharCode(mod(p + k, 26) + 65);
    }
  }
  return decrypt ? result.toLowerCase() : result;
};

export interface PlayfairTrace {
  output: string;
  matrix: string[][];
  cleanedKey: string;
  originalText: string;
  preparedText: string;
  processingSteps: {
    inputDigraph: string;
    outputDigraph: string;
    rule: 'row' | 'column' | 'rectangle';
    coords: {
      char1: string;
      pos1: [number, number];
      char2: string;
      pos2: [number, number];
      newChar1: string;
      newPos1: [number, number];
      newChar2: string;
      newPos2: [number, number];
    };
  }[];
}

export const playfairCipher = (text: string, key: string, decrypt = false): PlayfairTrace => {
  if (!/^[a-zA-Z]*$/.test(key)) {
    throw new Error("Key for Playfair cipher must only contain letters.");
  }
  const originalTextClean = text.toUpperCase().replace(/[^A-Z]/g, '');

  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // No 'J'
  const uniqueKeyChars = (key.toUpperCase().replace(/J/g, 'I') + alphabet)
    .split('')
    .filter((v, i, a) => a.indexOf(v) === i);
  
  const matrix: string[][] = [];
  for (let i = 0; i < 5; i++) matrix.push(uniqueKeyChars.slice(i * 5, i * 5 + 5));

  let textToProcess = originalTextClean.replace(/J/g, 'I');
  let preparedText = "";

  if (!decrypt) {
    let tempText = textToProcess;
    while (tempText.length > 0) {
      const char1 = tempText[0];
      if (tempText.length === 1) {
        preparedText += char1 + 'X';
        break;
      }
      const char2 = tempText[1];
      if (char1 === char2) {
        preparedText += char1 + 'X';
        tempText = tempText.substring(1);
      } else {
        preparedText += char1 + char2;
        tempText = tempText.substring(2);
      }
    }
    if (preparedText.length % 2 !== 0) {
      preparedText += 'X';
    }
    textToProcess = preparedText;
  } else {
    preparedText = textToProcess; // For decrypt, prepared is just the clean input
  }


  const findPos = (char: string): [number, number] => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (matrix[r][c] === char) return [r, c];
      }
    }
    return [-1, -1]; // Should not happen with valid input
  };

  const processingSteps: PlayfairTrace['processingSteps'] = [];
  let output = "";

  for (let i = 0; i < textToProcess.length; i += 2) {
    if (i + 1 >= textToProcess.length) continue;
    
    const char1 = textToProcess[i];
    const char2 = textToProcess[i + 1];
    const [r1, c1] = findPos(char1);
    const [r2, c2] = findPos(char2);

    let newChar1, newChar2, newR1, newC1, newR2, newC2, rule;
    const shift = decrypt ? -1 : 1;

    if (r1 === r2) {
      rule = 'row' as const;
      newC1 = mod(c1 + shift, 5);
      newC2 = mod(c2 + shift, 5);
      newR1 = r1;
      newR2 = r2;
    } else if (c1 === c2) {
      rule = 'column' as const;
      newR1 = mod(r1 + shift, 5);
      newR2 = mod(r2 + shift, 5);
      newC1 = c1;
      newC2 = c2;
    } else {
      rule = 'rectangle' as const;
      newR1 = r1; newC1 = c2;
      newR2 = r2; newC2 = c1;
    }
    
    newChar1 = matrix[newR1][newC1];
    newChar2 = matrix[newR2][newC2];

    output += newChar1 + newChar2;
    processingSteps.push({
      inputDigraph: char1 + char2,
      outputDigraph: newChar1 + newChar2,
      rule,
      coords: {
        char1, pos1: [r1, c1],
        char2, pos2: [r2, c2],
        newChar1, newPos1: [newR1, newC1],
        newChar2, newPos2: [newR2, newC2],
      },
    });
  }
  
  const finalOutput = decrypt ? output.toLowerCase() : output;

  return {
    output: finalOutput,
    matrix,
    cleanedKey: (key.toUpperCase().replace(/J/g, 'I')).split('').filter((v, i, a) => a.indexOf(v) === i).join(''),
    originalText: originalTextClean,
    preparedText: textToProcess,
    processingSteps
  };
};

// --- Hill Cipher Helpers ---
const minor = (matrix: number[][], row: number, column: number): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < matrix.length; i++) {
    if (i === row) continue;
    const newRow: number[] = [];
    for (let j = 0; j < matrix[i].length; j++) {
      if (j === column) continue;
      newRow.push(matrix[i][j]);
    }
    result.push(newRow);
  }
  return result;
};

const determinantMat = (matrix: number[][]): number => {
  if (matrix.length === 0 || matrix.length !== matrix[0].length) {
    throw new Error("Matrix must be square to calculate determinant.");
  }
  if (matrix.length === 1) {
      return matrix[0][0];
  }
  if (matrix.length === 2) {
    return mod(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0], 26);
  }
  let det = 0;
  for (let i = 0; i < matrix[0].length; i++) {
    det += Math.pow(-1, i) * matrix[0][i] * determinantMat(minor(matrix, 0, i));
  }
  return mod(det, 26);
};

const inverseMat = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  if (n === 0 || n !== matrix[0].length) {
    throw new Error("Matrix must be square to be inverted.");
  }

  const det = determinantMat(matrix);
  if (gcd(det, 26) !== 1) {
    throw new Error(`The determinant of the matrix (${det}) is not coprime with 26. The matrix is not invertible.`);
  }

  const detInv = modInverse(det, 26);
  if (detInv === -1) { 
    throw new Error("Could not find modular inverse of the determinant.");
  }
  
  if (n === 1) {
      return [[detInv]];
  }

  const cofactorMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const minorDet = determinantMat(minor(matrix, i, j));
      cofactorMatrix[i][j] = mod(Math.pow(-1, i + j) * minorDet, 26);
    }
  }

  const adjugateMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      adjugateMatrix[i][j] = cofactorMatrix[j][i];
    }
  }

  const inverse: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      inverse[i][j] = mod(adjugateMatrix[i][j] * detInv, 26);
    }
  }

  return inverse;
};

const multiplyMat = (a: number[][], b: number[][]): number[][] => {
  if (a.length === 0 || b.length === 0 || a[0].length !== b.length) {
    throw new Error(`Invalid dimensions for matrix multiplication: ${a[0]?.length} != ${b.length}`);
  }

  const matrix: number[][] = Array.from({ length: a.length }, () => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      matrix[i][j] = mod(sum, 26);
    }
  }
  return matrix;
};

export const hillCipher = (
  text: string,
  keyMatrix: number[][],
  mode: 'standard' | 'book',
  decrypt = false
): string => {
  if (keyMatrix.length === 0 || keyMatrix.some(row => row.length !== keyMatrix.length)) {
    throw new Error("Hill cipher requires a non-empty square key matrix.");
  }
  const n = keyMatrix.length;

  const det = determinantMat(keyMatrix);
  if (gcd(det, 26) !== 1) {
    throw new Error(`The determinant of the key matrix (${det}) is not coprime with 26. The matrix is not invertible.`);
  }
  
  const characterToIndex = (char: string): number => char.charCodeAt(0) - 'a'.charCodeAt(0);
  const indexToCharacter = (index: number): string => String.fromCharCode(index + 'a'.charCodeAt(0));

  let cleanText = text.toLowerCase().replace(/[^a-z]/g, '');

  if (decrypt) {
    const invKey = inverseMat(keyMatrix);
    if (cleanText.length % n !== 0) {
      throw new Error("Ciphertext length must be a multiple of the matrix size.");
    }
    let result = '';

    if (mode === 'standard') {
      const columns = cleanText.length / n;
      const ciphertext: number[][] = Array.from({ length: n }, () => Array(columns).fill(0));
      let index = 0;
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < n; j++) {
          ciphertext[j][i] = characterToIndex(cleanText.charAt(index++));
        }
      }
      const plaintext = multiplyMat(invKey, ciphertext);
      
      for (let j = 0; j < plaintext[0].length; j++) {
        for (let i = 0; i < plaintext.length; i++) {
          result += indexToCharacter(plaintext[i][j]);
        }
      }
    } else { // 'book' mode
      const rows = cleanText.length / n;
      const ciphertext: number[][] = Array.from({ length: rows }, () => Array(n).fill(0));
      let index = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < n; j++) {
          ciphertext[i][j] = characterToIndex(cleanText.charAt(index++));
        }
      }
      const plaintext = multiplyMat(ciphertext, invKey);
      
      for (let i = 0; i < plaintext.length; i++) {
        for (let j = 0; j < plaintext[0].length; j++) {
          result += indexToCharacter(plaintext[i][j]);
        }
      }
    }
    return result;

  } else { // Encrypt
    const paddingChar = mode === 'standard' ? 'x' : 'z';
    while (cleanText.length % n !== 0) {
      cleanText += paddingChar;
    }
    let result = '';
    
    if (mode === 'standard') {
        const columns = cleanText.length / n;
        const plaintext: number[][] = Array.from({ length: n }, () => Array(columns).fill(0));
        let index = 0;
        for (let i = 0; i < columns; i++) {
          for (let j = 0; j < n; j++) {
            plaintext[j][i] = characterToIndex(cleanText.charAt(index++));
          }
        }
        const cipher = multiplyMat(keyMatrix, plaintext);

        for (let j = 0; j < cipher[0].length; j++) {
          for (let i = 0; i < cipher.length; i++) {
            result += indexToCharacter(cipher[i][j]);
          }
        }
    } else { // 'book' mode
      const rows = cleanText.length / n;
      const plaintext: number[][] = Array.from({ length: rows }, () => Array(n).fill(0));
      let index = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < n; j++) {
          plaintext[i][j] = characterToIndex(cleanText.charAt(index++));
        }
      }
      const cipher = multiplyMat(plaintext, keyMatrix);

      for (let i = 0; i < cipher.length; i++) {
        for (let j = 0; j < cipher[0].length; j++) {
          result += indexToCharacter(cipher[i][j]);
        }
      }
    }
    return result.toUpperCase();
  }
};
