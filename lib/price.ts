export function parsePrice(price: string): number {
  const digitsOnly = price.replace(/[^0-9.]/g, "");
  const num = parseFloat(digitsOnly);
  return isNaN(num) ? 0 : num;
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}
