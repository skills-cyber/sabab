const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) parts.push(r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? `-${ONES[r % 10]}` : ''}`);
  return parts.join(' ');
}

/** Bangladeshi numbering (lakh / crore): 1,25,500 → "One lakh twenty-five thousand five hundred taka only". */
export function amountInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return 'Zero taka only';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${below1000(crore)} crore`);
  if (lakh) parts.push(`${below1000(lakh)} lakh`);
  if (thousand) parts.push(`${below1000(thousand)} thousand`);
  if (n) parts.push(below1000(n));
  const s = `${parts.join(' ')} taka only`;
  return s[0].toUpperCase() + s.slice(1);
}