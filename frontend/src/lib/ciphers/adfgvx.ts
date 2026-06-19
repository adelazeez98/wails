import { mod } from './core';

export const adfgvxCipher = (
  text: string,
  square: string,
  transpositionKey: string,
  decrypt = false,
  paddingChar?: string
): { 
  output: string; 
  fullSquare: string;
  cleanedText?: string;
  fractionated?: string;
  fractionationDetails?: { char: string; coord: string }[];
  transpositionGrid?: string[][];
  transpositionKeySorted: string;
  decryptionColumns?: { header: string; column: string; originalIndex: number }[];
  reconstructedGrid?: string[][];
 } => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let cleanInput = square.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let matrixArr = Array.from(new Set(cleanInput.split('')));
  
  for (const char of alphabet) {
    if (!matrixArr.includes(char)) {
      matrixArr.push(char);
    }
    if (matrixArr.length === 36) break;
  }
  
  const matrix = matrixArr;
  const fullSquare = matrix.join('');
  const headers = "ADFGVX";
  
  const cleanTransKey = transpositionKey.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanTransKey) throw new Error("Transposition key is required for ADFGVX.");
  
  const sortedKey = cleanTransKey.split('').map((c, i) => ({ c, i })).sort((a, b) => {
    if (a.c < b.c) return -1;
    if (a.c > b.c) return 1;
    return a.i - b.i; // Stable sort
  });
  const transpositionKeySorted = sortedKey.map(k => k.c).join('');

  if (!decrypt) {
    // ENCRYPTION (Untouched)
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let fractionated = "";
    const fractionationDetails: { char: string; coord: string }[] = [];
    for (const char of cleanText) {
      const idx = matrix.indexOf(char);
      if (idx === -1) continue; // Should not happen with cleanText
      const coord = headers[Math.floor(idx / 6)] + headers[idx % 6];
      fractionated += coord;
      fractionationDetails.push({ char, coord });
    }

    const cols = cleanTransKey.length;
    let textToGrid = fractionated;
    if (paddingChar && textToGrid.length % cols !== 0) {
        textToGrid += paddingChar.repeat(cols - (textToGrid.length % cols));
    }
    const rows = Math.ceil(fractionated.length / cols);
    const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
    
    let charIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (charIdx < textToGrid.length) {
          grid[r][c] = textToGrid[charIdx++];
        } else {
          grid[r][c] = paddingChar || '';
        }
      }
    }

    let result = "";
    for (const { i } of sortedKey) {
      for (let r = 0; r < rows; r++) {
        if(grid[r]?.[i]) {
          result += grid[r][i];
        }
      }
    }
    return { 
      output: result.trim(), 
      fullSquare,
      cleanedText: cleanText,
      fractionated,
      fractionationDetails,
      transpositionGrid: grid,
      transpositionKeySorted
    };

  } else { 
    // DECRYPTION (Re-written to strictly match Java logic)
    const encryptedText = text.toUpperCase();
    
    // Check if the entered text has adfgvx characters only
    if (/[^ADFGVX]/.test(encryptedText)) {
      throw new Error("Decryption text must contain only ADFGVX characters");
    }

    const numCols = cleanTransKey.length;
    let numRows: number;

    // Calculate the number of rows based on the length of the encrypted text and the number of columns
    if (encryptedText.length % numCols === 0) {
        numRows = Math.floor(encryptedText.length / numCols);
    } else {
        numRows = Math.floor(encryptedText.length / numCols) + 1;
    }

    // Create grids to store the characters of the decrypted text
    const grid: string[][] = Array.from({ length: numCols }, () => Array(numRows).fill(''));
    const sortedGrid: string[][] = Array.from({ length: numCols }, () => Array(numRows).fill(''));

    // Calculate the remainder of the encrypted text length divided by the number of columns
    const remainder = encryptedText.length % numCols;
    let currentIndex = 0;
    let resultBuilder = "";

    // Fill the grid with the characters from the encrypted text
    for (let i = 0; i < numCols; i++) {
        const rowIndex = sortedKey[i].i; // equivalent to this.key2Arr[i]
        let colIndex: number;

        // Handle the special case when there is a remainder
        if (remainder > 0) {
            colIndex = (rowIndex < remainder) ? numRows : numRows - 1;

            // Fill the remaining cell with a space character
            if (colIndex < numRows) {
                grid[i][colIndex] = ' ';
            }
        } else {
            colIndex = numRows;
        }

        // Fill the cells of the grid with characters from the encrypted text
        for (let j = 0; j < colIndex; j++) {
            grid[i][j] = encryptedText.charAt(currentIndex);
            currentIndex++;
        }
    }

    // Rearrange the rows of the grid based on the original order of the key
    for (let i = 0; i < numCols; i++) {
        const originalRowIndex = sortedKey[i].i;
        sortedGrid[originalRowIndex] = grid[i];
    }

    // Build the decrypted text by traversing the sorted grid
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            resultBuilder += sortedGrid[j][i];
        }
    }

    // Convert the result to a string and remove any spaces (Equivalent to key2Decipher return)
    const decipheredTextUsingKey2 = resultBuilder.replace(/ /g, "");

    // Key 1 Decipher Logic
    let resultText = "";
    let textLength = decipheredTextUsingKey2.length;
    
    // If we added odd number of padding to adfgvx text, decrease length of text by 1
    if (textLength % 2 === 1) {
        textLength -= 1;
    }

    for (let i = 0; i < textLength; i += 2) {
        // split input into pairs
        const pair = decipheredTextUsingKey2.substring(i, i + 2);
        const firstCharacter = pair.charAt(0);
        const secondCharacter = pair.charAt(1);

        const row = headers.indexOf(firstCharacter);
        const col = headers.indexOf(secondCharacter);

        if (row === -1 || col === -1) {
            throw new Error("Decryption text must contain only ADFGVX characters");
        }
        
        resultText += matrix[row * 6 + col];
    }

    return { 
      output: resultText.toLowerCase(), 
      fullSquare,
      transpositionKeySorted,
      fractionated: decipheredTextUsingKey2,
      // Map sortedGrid back into row-major format for TS response compatibility
      reconstructedGrid: sortedGrid[0].map((_, colIndex) => sortedGrid.map(row => row[colIndex])),
    };
  }
};
