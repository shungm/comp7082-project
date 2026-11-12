import { Category } from '../types/expense';

export interface ParsedReceipt {
  title: string;      // merchant name
  amount: string;     // e.g. "23.47" (string so it can prefill a TextInput)
  category: Category;
}

const AMOUNT_REGEX = /\$?\s*(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})\b/g;

const TOTAL_LINE = /\b(grand\s*total|total|amount\s*due|balance\s*due|total\s*due)\b/i;
const NOT_TOTAL_LINE = /sub\s*-?\s*total|total\s*(savings|items?|tax|gst|pst|hst|discount)|tax\s*total|you\s*saved/i;

const SKIP_MERCHANT_LINE =
  /receipt|invoice|welcome|thank|tel\b|phone|www\.|\.com|gst|hst|pst|^\d|\d{3}[-.\s]\d{3,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|street|st\.|ave|avenue|blvd|road|rd\.|unit|suite|[A-Z]\d[A-Z]\s?\d[A-Z]\d/i;

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

const toNumber = (whole: string, cents: string) =>
  parseFloat(`${whole.replace(/,/g, '')}.${cents}`);

const amountsIn = (line: string): number[] => {
  const found: number[] = [];
  for (const m of line.matchAll(AMOUNT_REGEX)) {
    found.push(toNumber(m[1], m[2]));
  }
  return found;
};

const findTotal = (lines: string[]): number | null => {
  const candidates: number[] = [];

  lines.forEach((line, i) => {
    if (!TOTAL_LINE.test(line) || NOT_TOTAL_LINE.test(line)) return;

    let values = amountsIn(line);
    // OCR often puts the amount on the next line
    if (values.length === 0 && lines[i + 1]) values = amountsIn(lines[i + 1]);
    candidates.push(...values);
  });

  if (candidates.length > 0) return Math.max(...candidates);

  // Fallback: the largest amount on the receipt
  const all = lines.flatMap(amountsIn);
  return all.length > 0 ? Math.max(...all) : null;
};

const findMerchant = (lines: string[]): string => {
  const topLines = lines.slice(0, 6);
  const match = topLines.find((line) => {
    const letters = (line.match(/[a-z]/gi) || []).length;
    return letters >= 3 && letters / line.length > 0.5 && !SKIP_MERCHANT_LINE.test(line);
  });
  if (!match) return '';

  // Tidy up shouting and stray symbols: "SAVE-ON-FOODS #123" -> "Save-On-Foods"
  return match
    .replace(/#\s*\d+.*$/, '')
    .replace(/[^\w\s&'’.\-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const guessCategory = (lines: string[]): Category => {
  const haystack = lines.slice(0, 10).join(' ').toLowerCase();
  for (const { category, words } of CATEGORY_KEYWORDS) {
    const hit = words.some((w) =>
      new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(haystack),
    );
    if (hit) return category;
  }
  return 'Other';
};

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