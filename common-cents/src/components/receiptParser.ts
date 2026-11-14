import { Category } from '../types/expense';

export interface ParsedReceipt {
  // Merchant/Store name
  title: string;
  amount: string; // Amount ex: "23.45"
  category: Category; // Category of expense
}

// Amount of food on receipt and the lines that contain it
interface Amount {
  value: number;
  line: number;
}

const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';
const isLetter = (ch: string): boolean => ch.toLowerCase() !== ch.toUpperCase();

// Check if a string is all digits
const isAllDigits = (text: string): boolean => {
  if (text.length === 0) {
    return false;
  }
  for (const ch of text) {
    if (!isDigit(ch)) {
      return false;
    }
  }
  return true;
};
 
// Count the number of letters in a string
const countLetters = (text: string): number => {
  let count = 0;
  
  for(const ch of text){
    if(isLetter(ch)){
      count++;
    }
  }
  
  return count;
};
 
// Count the number of digits in a string
const countDigits = (text: string): number => {
  let count = 0;
  
  for(const ch of text){
    if (isDigit(ch)){
      count++;
    }
  }
  
  return count;
};
 
// Sets text to lowercase, turns every symbol into a space, and returns the words.
// ex: "Save-On Foods #12" changed to array ["save", "on", "foods", "12"]
const toWords = (text: string): string[] => {
  let cleaned = '';
  
  for(const ch of text.toLowerCase()){
    if(isLetter(ch) || isDigit(ch)){
      cleaned += ch;
    }else{
      cleaned += ' ';
    }
  }
  
  return cleaned.split(' ').filter((w) => w !== '');
};
 
// Check if a phrase is contained in a string, ignoring case and symbols
const containsPhrase = (text: string, phrase: string): boolean => {
  const paddedText = ' ' + toWords(text).join(' ') + ' ';
  const paddedPhrase = ' ' + toWords(phrase).join(' ') + ' ';
  
  return paddedText.includes(paddedPhrase);
};
 
// Convert a string to title case, ignoring symbols
const toTitleCase = (text: string): string => {
  const words = text.split(' ');
  let result = '';
  
  for(const w of words){
    if(w === ''){
      continue; // Skip empty pieces
    }
    
    const titled = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    
    if(result !== ''){
      result += ' ';
    }
    result += titled;
  }
  return result;
};
 
// Parse and find amounts
export const parseAmount = (word: string): number | null => {
  let text = word;
  let isNegative = false;
 
  // (5.00) means negative
  if(text.startsWith('(') && text.endsWith(')')){
    isNegative = true;
    text = text.slice(1, -1);
  }
 
  // -5.00 means negative
  if(text.startsWith('-')){
    isNegative = true;
    text = text.slice(1);
  }
 
  // 5.00- means negative (common on thermal receipts)
  if(text.endsWith('-')){
    isNegative = true;
    text = text.slice(0, -1);
  }
 
  // Remove the dollar sign
  if(text.startsWith('$')) {
    text = text.slice(1);
  }
 
  // Handles "$-5.00"
  if(text.startsWith('-')) {
    isNegative = true;
    text = text.slice(1);
  }
 
  // Remove thousands commas: "1,234.56" -> "1234.56"
  text = text.split(',').join('');
 
  // A price must look like "digits.cents": one dot, exactly two digits after it
  const parts = text.split('.');
  if(parts.length !== 2) {
    return null;
  }
 
  const whole = parts[0];
  const cents = parts[1];
 
  // Reject if the whole part is empty or too long, or if the cents part is not exactly two digits
  if(whole.length === 0 || whole.length > 6){
    return null;
  }
  // Reject if the cents part is not exactly two digits
  if(cents.length !== 2){
    return null;
  }
  // Reject if either part contains non-digit characters
  if(!isAllDigits(whole) || !isAllDigits(cents)){
    return null;
  }

 const value = Number(text);
  
 if(isNegative){
    return -value;
  }
  
  return value;
};

// Split lines into words so that $ signs are treated to be separate words, and tabs are treated as spaces
// ex: "TOTAL$23.45" becomes "TOTAL $23.45".
const splitIntoWords = (line: string): string[] => {
  const spaced = line.split('$').join(' $').split('\t').join(' ');
  return spaced.split(' ').filter((w) => w !== '');
};
 
// Finds every price in one line
const amountsIn = (line: string): number[] => {
  const amounts: number[] = [];
  for(const word of splitIntoWords(line)){
    const amount = parseAmount(word);
    if (amount !== null) {
      amounts.push(amount);
    }
  }
  return amounts;
};
 

//Find total amount in receipt text
const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.011;
 
// Detect typos in TOTAL (ex: "T0TAL" or "TOTAl" or "TOTL" or "TOTALL")
const editDistance = (a: string, b: string): number => {
  // table[i][j] = distance between first i letters of a and first j letters of b
  const table: number[][] = [];
  
  // Initialize the table with base cases
  for (let i = 0; i <= a.length; i++) {
    table.push([]);
    // Fill in the first row and first column
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) {
        table[i].push(j);
      } 
      else if (j === 0) {
        table[i].push(i);
      } 
      // Fill in the rest of the table using the recurrence relation
      else {
        let cost = 1;
        
        if(a[i - 1] === b[j - 1]){
          cost = 0;
        }
    
        table[i].push(Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + cost,),);
      }
    }
  }
  return table[a.length][b.length];
};
 
// Lines that contain the word "total" but are NOT the final total
const NOT_TOTAL_PHRASES = [
  'subtotal', 'sub total', 'total savings', 'total items', 'total item',
  'total tax', 'tax total', 'total gst', 'total pst', 'total hst',
  'total discount', 'you saved',
];
 
// Words that indicate a line is a payment line, not the total
const PAYMENT_WORDS = ['cash', 'tender', 'tendered', 'change'];
 
const hasTotalLabel = (line: string): boolean => {
  const lower = line.toLowerCase();

  // If the line contains any of the NOT_TOTAL_PHRASES, it cannot be the total
  for (const phrase of NOT_TOTAL_PHRASES) {
    if (lower.includes(phrase)) {
      return false;
    }
  }
 
  // If the line contains "total" (with typos allowed), it is likely the total
  for (const word of toWords(line)) {
    // OCR often reads "o" as 0 and "l" as 1
    const fixed = word.split('0').join('o').split('1').join('l');
    // If the word is "total" or a close variant, it is likely the total
    if (fixed.length >= 4 && editDistance(fixed, 'total') <= 1) {
      return true;
    }
  }
  return lower.includes('amount due') || lower.includes('balance due');
};
 
// Lines that contain words like "cash" or "tender" are usually payment lines, not the total
const hasPaymentWord = (line: string): boolean => {
  const words = toWords(line);

  // If any of the words in the line are in PAYMENT_WORDS, it is likely a payment line
  for (const w of PAYMENT_WORDS) {
    // If the line contains any of the PAYMENT_WORDS, it is likely a payment line
    if (words.includes(w)) {
      return true;
    }
  }
  return false;
};
 
// Check if number above line adds up to target number to make sure the total is correct
// ex: subtotal + tax = total, or subtotal - discount + tax = total
const isExplained = (target: number, firstLine: number, all: Amount[]): boolean => {
  // Collect all amount that appears above the first line of total
  const above: number[] = [];
  
  for(const a of all){
    if(a.line < firstLine){
      above.push(a.value);
    }
  }
  
  const recent = above.slice(-25); // keep only last 25
 
    // Check all combinations of 1, 2, or 3 amounts above the total to see if they add up to the total
  for (let i = 0; i < recent.length; i++) {
    // Check combinations of 1 amount above the total
    for (let j = i + 1; j < recent.length; j++) {
      // Check combinations of 2 amounts above the total
      if (near(recent[i] + recent[j], target)) {
        return true;
      }
      // Check combinations of 3 amounts above the total
      for (let k = j + 1; k < recent.length; k++) {
        // Check combinations of 3 amounts above the total
        if (near(recent[i] + recente[j] + recent[k], target)) {
          return true;
        }
      }
    }
  }
  return false;
};
 
// Find total amount in receipt text
export const findTotal = (lines: string[]): number | null => {
  const all: Amount[] = [];

  // Find all amounts in the receipt and record which line they are on
  for (let line = 0; line < lines.length; line++) {
    // Find all amounts in the line and record which line they are on
    for (const value of amountsIn(lines[line])) {
      all.push({ value, line });
    }
  }
 
  // Negative amounts are discounts, so they can never be the total
  const positives = all.filter((a) => a.value > 0);

  // If there are no positive amounts, there is no total
  if (positives.length === 0) {
    return null;
  }
 
  // Look at each different value once
  const uniqueValues: number[] = [];

  // If the same amount appears multiple times, it is more likely to be the total
  for (const a of positives) {
    // If the amount is not already in uniqueValues (allowing for small rounding errors), add it to uniqueValues
    if (!uniqueValues.some((v) => near(v, a.value))) {
      uniqueValues.push(a.value);
    }
  }
 
  let best: { value: number; score: number; lastLine: number } | null = null;
 
  // Scoring system to determine which amount is most likely the total
  for (const value of uniqueValues) {
    const hits = positives.filter((a) => near(a.value, value));
    const firstLine = Math.min(...hits.map((h) => h.line));
    const lastLine = Math.max(...hits.map((h) => h.line));
 
    let score = 0;
 
    // "Total" appears on the line (2 points)
    if (hits.some((h) => hasTotalLabel(lines[h.line]))) {
      score += 2;
    }
 
    // Same amount appears multiple times (1 point for each extra appearance)
    if (hits.length >= 2) {
      score += 2;
    }
 
    // Amount above the total adds up to the total (3 points)
    if (isExplained(value, firstLine, all)) {
      score += 3;
    }
 
    // The total is near the bottom of the receipt (2 points)
    score += (lastLine / lines.length) * 2;
 
    // Subtract point for lines that contain payment words like "cash" or "tender" (these are usually not the total)
    if (hits.every((h) => hasPaymentWord(lines[h.line]))) {
      score -= 3;
    }
 
    const isBetter =
      best === null ||
      score > best.score ||
      (score === best.score && lastLine > best.lastLine);
 
      // If this amount is better than the previous best, update best
    if (isBetter) {
      best = { value, score, lastLine };
    }
  }
 
  if(best){
    return best.value;
  }
  
  return null;
};
 
// Determine merchant/store name
// Words that show a line is address / contact info / receipt boilerplate
const NOT_MERCHANT_WORDS = [
  'receipt', 'invoice', 'welcome', 'thank', 'thanks', 'tel', 'phone', 'fax',
  'www', 'gst', 'hst', 'pst', 'street', 'st', 'ave', 'avenue', 'blvd',
  'road', 'rd', 'unit', 'suite', 'customer', 'copy',
];
 
const MAX_MERCHANT_LINES = 8;
const MIN_MERCHANT_SCORE = 3;
 
const scoreMerchantLine = (line: string, index: number): number => {
  const letters = countLetters(line);
  const digits = countDigits(line);
 
  // Too few letters to be a name
  if (letters < 3) {
    return -100;
  }
 
  let score = 0;
 
  // Mostly letters
  if (letters / line.length > 0.5) {
    score += 2;
  }
 
  // Few digits (addresses and phone numbers have many)
  if (digits === 0) {
    score += 2;
  } else if (digits >= 4) {
    score -= 2;
  }
 
  // Names are often printed in capitals
  if (line === line.toUpperCase()) {
    score += 1;
  }
 
  // Names are usually at the very top
  if (index === 0) {
    score += 2;
  } else if (index < 3) {
    score += 1;
  }
 
  // Reasonable length for a name
  if (line.length >= 3 && line.length <= 30) {
    score += 1;
  }
 
  // Web addresses and emails
  const lower = line.toLowerCase();
  if (lower.includes('@') || lower.includes('www.') || lower.includes('.com')) {
    score -= 3;
  }
 
  // Address words like "street" or "avenue" are not part of the merchant name
  const words = toWords(line);
  for (const bad of NOT_MERCHANT_WORDS) {
    if (words.includes(bad)) {
      score -= 3;
      break;
    }
  }
 
  // A line with a price on it is an item, not a name
  if (amountsIn(line).length > 0) {
    score -= 3;
  }
 
  return score;
};
 
// Extract a name out of a web address like "www.joescafe.com" as a fallback
const merchantFromWebsite = (lines: string[]): string => {
  // Look for a line that contains ".com" and extract the part before it
  for (const line of lines.slice(0, 12)) {
    // If the line contains ".com", extract the part before it and return it as a title-cased name
    for (const word of line.toLowerCase().split(' ')) {
      const dotCom = word.indexOf('.com');
      // If the word does not contain ".com", skip it
      if (dotCom <= 0) {
        continue;
      }

      let name = word.slice(0, dotCom);
      // If the name contains "//", take the part after it (ex: "https://www.starbucks.com" -> "starbucks")
      if (name.includes('//')) {
        name = name.split('//')[1];
      }
      // If the name starts with "www.", remove it (ex: "www.starbucks" -> "starbucks")
      if (name.startsWith('www.')) {
        name = name.slice(4);
      }
      // If the name is at least 2 characters long, return it as a title-cased name
      if (name.length >= 2) {
        return toTitleCase(name);
      }
    }
  }
  return '';
};
 
// Remove store numbers like "#123" and tidy the capitalization
const cleanMerchantName = (name: string): string => {
  let cleaned = name;
 
  const hashIndex = cleaned.indexOf('#');
  // If there is a "#" in the name, remove it and everything after it (ex "Save-On Foods #12" -> "Save-On Foods")
  if (hashIndex !== -1) {
    cleaned = cleaned.slice(0, hashIndex);
  }
  cleaned = cleaned.trim();
 
  // Change all capital names to title case (ex: "STARBUCKS" -> "Starbucks")
  if (cleaned === cleaned.toUpperCase()) {
    cleaned = toTitleCase(cleaned);
  }
  return cleaned;
};
 
const findMerchant = (lines: string[]): string => {
  let bestLine = '';
  let bestScore = -Infinity;
 
  // Look at the first few lines of the receipt to find the merchant name
  for (let i = 0; i < lines.length && i < MAX_MERCHANT_LINES; i++) {
    const score = scoreMerchantLine(lines[i], i);
    if (score > bestScore) {
      bestScore = score;
      bestLine = lines[i];
    }
  }
 
  if (bestScore >= MIN_MERCHANT_SCORE) {
    return cleanMerchantName(bestLine);
  }
  return merchantFromWebsite(lines);
};
 
// Extract category from receipt text
const CATEGORY_KEYWORDS: { category: Category; words: string[] }[] = [
  {
    category: 'Transport',
    words: [
      'gas', 'fuel', 'petro', 'petrol', 'shell', 'esso', 'chevron', 'husky',
      'parking', 'translink', 'compass', 'transit', 'uber', 'lyft', 'taxi', 'cab',
    ],
  },
  {
    category: 'Groceries',
    words: [
      'grocery', 'groceries', 'supermarket', 'safeway', 'save-on', 'walmart',
      'costco', 'superstore', 't&t', 'nesters', 'freshco', 'no frills',
      'produce', 'market', 'london drugs', 'shoppers',
    ],
  },
  {
    category: 'Food',
    words: [
      'restaurant', 'cafe', 'café', 'coffee', 'starbucks', 'tim hortons', 'pizza',
      'sushi', 'grill', 'bistro', 'kitchen', 'burger', 'burgers', 'mcdonald',
      'mcdonalds', 'subway', 'a&w', 'bar', 'pub', 'bakery', 'ramen', 'noodle',
      'noodles', 'tea', 'diner', 'tip',
    ],
  },
];
 
// Guess the category from the first 10 lines. Defaults to "Other" category is none found
const guessCategory = (
  lines: string[],
  merchant: string,
  savedCategories: Record<string, Category>,
): Category => {
  const saved = savedCategories[merchant.toLowerCase()];

  // If the merchant has a saved category, return it
  if (saved) {
    return saved;
  }

  const text = lines.slice(0, 10).join(' ');
 
  // Check if any of the keywords for each category are in the text
  for (const item of CATEGORY_KEYWORDS) {
    // Check if any of the keywords for this category are in the text
    for (const word of item.words) {
      // If the keyword is in the text, return the category
      if (containsPhrase(text, word)) {
        return item.category;
      }
    }
  }
 
  return 'Other';
};
 
// Parse receipt text into title, amount, and category
export const parseReceiptText = (
  rawText: string,
  savedCategories: Record<string, Category> = {},
): ParsedReceipt => {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
 
  const total = findTotal(lines);
  const title = findMerchant(lines);

  let amount = '';
  if(total !== null){
    amount = total.toFixed(2);
  }

  return {title,amount,category: guessCategory(lines, title, savedCategories),
  };
};
