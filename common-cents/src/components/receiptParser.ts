import { Category } from '../types/expense';

export interface ParsedReceipt {
  title: string;      // merchant name
  amount: string;     // e.g. "23.47"
  category: Category;
}

// Find whole numbers with optional commas, followed by a decimal point and exactly two digits for cents
const AMOUNT_REGEX = /\$?\s*(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})\b/g;

// Line containing final total amount, but not lines containing subtotal, tax, or savings
const TOTAL_LINE = /\b(grand\s*total|total|amount\s*due|balance\s*due|total\s*due)\b/i;

// Ignore words like "subtotal", "tax", "savings", etc. when scanning for total amount
const NOT_TOTAL_LINE = /sub\s*-?\s*total|total\s*(savings|items?|tax|gst|pst|hst|discount)|tax\s*total|you\s*saved/i;

// Ignore addresses, phone numbers, and other metadata when scanning for merchant name
const SKIP_MERCHANT_LINE =
  /receipt|invoice|welcome|thank|tel\b|phone|www\.|\.com|gst|hst|pst|^\d|\d{3}[-.\s]\d{3,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|street|st\.|ave|avenue|blvd|road|rd\.|unit|suite|[A-Z]\d[A-Z]\s?\d[A-Z]\d/i;

  // Keywords to help guess category of receipt
const CATEGORY_KEYWORDS: { category: Category; words: string[] }[] = [
  {
    category: 'Transport',
    words: [
      'gas', 'fuel', 'petro', 'shell', 'esso', 'chevron', 'husky', 'parking',
      'translink', 'compass', 'transit', 'uber', 'lyft', 'taxi', 'cab',
    ],
  },
  {
    category: 'Groceries',
    words: [
      'grocery', 'groceries', 'supermarket', 'safeway', 'save-on', 'save on',
      'walmart', 'costco', 'superstore', 't&t', 'nesters', 'freshco', 'no frills',
      'produce', 'market', 'london drugs', 'shoppers',
    ],
  },
  {
    category: 'Food',
    words: [
      'restaurant', 'cafe', 'café', 'coffee', 'starbucks', 'tim hortons', 'pizza',
      'sushi', 'grill', 'bistro', 'kitchen', 'burger', 'mcdonald', 'subway',
      'a&w', 'bar', 'pub', 'bakery', 'ramen', 'noodle', 'tea', 'diner', 'tip',
    ],
  },
];

// Helper function to convert whole and cents strings into a number
const toNumber = (whole: string, cents: string) =>
  parseFloat(`${whole.replace(/,/g, '')}.${cents}`);

// Find all valid money in a line and convert to array of numbers. Returns empty if not valid
const amountsIn = (line: string): number[] => {
  const matches = line.matchAll(AMOUNT_REGEX);

  // Convert matches to numbers and return as array
  return Array.from(matches, (match) => {
    return toNumber(match[1], match[2]);
  });
};

// Scan receipt lines to find total amount
const findTotal = (lines: string[]): number | null => {
  const candidates: number[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if not total
    if (!TOTAL_LINE.test(line)) {
      continue;
    }

    // Skip if line match NOT_TOTAL_LINE (e.g., subtotal, tax, savings)
    if (NOT_TOTAL_LINE.test(line)) {
      continue;
    }

    let values = amountsIn(line);

    // If "Total" is found, but no amounts are found on that line, check the next line for amounts
    if (values.length === 0 && lines[i + 1]) {
      values = amountsIn(lines[i + 1]);
    }

    candidates.push(...values);
  }

  if (candidates.length > 0) {
    return Math.max(...candidates);
  }
  return null;
};

// Scan receipt lines to find merchant/store name
function findMerchant(lines: string[]): string {
  let merchantName = '';

  // Look only at the first 6 lines of the receipt
  const maxLinesToCheck = 6;
  
  for (let i = 0; i < lines.length && i < maxLinesToCheck; i++) {
    const currentLine = lines[i];
    
    // Count how many letters are in this line
    const lettersMatch = currentLine.match(/[a-z]/gi);
    const letterCount = lettersMatch ? lettersMatch.length : 0;
    
    // Calculate what percentage of the line is made of letters
    const letterPercentage = letterCount / currentLine.length;
    
    // Check if it looks like valid store name (mostly letters and not an address/phone number)
    const hasEnoughLetters = letterCount >= 3;
    const isMostlyText = letterPercentage > 0.5;
    const isNotMetadata = !SKIP_MERCHANT_LINE.test(currentLine);
    
    if (hasEnoughLetters && isMostlyText && isNotMetadata) {
      merchantName = currentLine;
      break; 
      // Stop searching when we find a valid merchant name
    }
  }

  // If no merchant/store name found, return empty string
  if (merchantName === '') {
    return '';
  }

  // Clean up the store name to make it look nice
  let cleanedName = merchantName.replace(/#\s*\d+.*$/, ''); // Remove store numbers like "#123"
  cleanedName = cleanedName.toLowerCase();                 // Make lowercase first
  cleanedName = cleanedName.trim();                        // Remove extra spaces
  
  return cleanedName;
}

// Guess category based on keywords in the first 10 lines of the receipt
const guessCategory = (lines: string[]): Category => {
  const text = lines.slice(0, 10).join(' ').toLowerCase();

  for (const item of CATEGORY_KEYWORDS) {
    for (const word of item.words) {
      if (text.includes(word)) {
        return item.category;
      }
    }
  }

  return 'Other';
};

// Main function to parse receipt text and extract merchant name, total amount, and category
export const parseReceiptText = (rawText: string): ParsedReceipt => {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const total = findTotal(lines);

  return {
    title: findMerchant(lines),
    amount: total !== null ? total.toFixed(2) : '',
    category: guessCategory(lines),
  };
};