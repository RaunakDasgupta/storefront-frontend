// A dummy payment gateway: checks the form fields and pretends to charge a card. No network, no real money.
// Plain functions with no React, so the tests can run under `node --test`.
import type { Address } from "../../shared/lib/orderlogic.ts";

export type { Address };
export type AddressErrors = Partial<Record<keyof Address, string>>;
export type Card = { number: string; name: string; expiry: string; cvc: string };
export type CardErrors = Partial<Record<keyof Card, string>>;
export type PaymentResult = { ok: true; ref: string } | { ok: false; message: string };

export const EMPTY_ADDRESS: Address = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "" };

/** Test cards for the demo: the first is approved, the second is declined on purpose. */
export const TEST_CARD = "4242 4242 4242 4242";
export const DECLINED_CARD = "4000 0000 0000 0002";
const DECLINES: Record<string, string> = {
  "4000000000000002": "Your card was declined. Try a different card.",
  "4000000000009995": "Your card has insufficient funds. Try a different card.",
};

const digits = (s: string) => s.replace(/\D/g, "");

export function validateAddress(a: Address): AddressErrors {
  const errors: AddressErrors = {};
  const phone = digits(a.phone);
  if (!a.fullName.trim()) errors.fullName = "Enter the recipient's full name.";
  if (!(phone.length === 10 || (phone.length === 12 && phone.startsWith("91")))) errors.phone = "Enter a 10-digit mobile number.";
  if (!a.line1.trim()) errors.line1 = "Enter the street address.";
  if (!a.city.trim()) errors.city = "Enter the city.";
  if (!a.state.trim()) errors.state = "Enter the state.";
  if (!/^[1-9]\d{5}$/.test(a.pin.trim())) errors.pin = "Enter a 6-digit PIN code.";
  return errors;
}

/** Luhn checksum: catches mistyped card numbers. */
export function luhnValid(number: string): boolean {
  const d = digits(number);
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1 && (n *= 2) > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function validateCard(c: Card, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!luhnValid(c.number)) errors.number = "Enter a valid card number.";
  if (!c.name.trim()) errors.name = "Enter the name on the card.";
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(c.expiry.trim());
  const month = m ? Number(m[1]) : 0, year = m ? 2000 + Number(m[2]) : 0;
  if (!m || month < 1 || month > 12) errors.expiry = "Enter the expiry as MM/YY.";
  // a card works until the end of its expiry month
  else if (new Date(year, month, 1) <= now) errors.expiry = "This card has expired.";
  if (!/^\d{3,4}$/.test(c.cvc)) errors.cvc = "Enter the 3 or 4 digit security code.";
  return errors;
}

/** Groups a card number as "4242 4242 4242 4242" while typing. */
export const formatCardNumber = (s: string) => digits(s).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
/** "1228" becomes "12/28" while typing. */
export const formatExpiry = (s: string) => { const d = digits(s).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

/** Pretends to charge the card. Takes a moment, like a real gateway, then approves or declines. */
export async function payWithCard(card: Card, delayMs = 1500): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const declined = DECLINES[digits(card.number)];
  return declined ? { ok: false, message: declined } : { ok: true, ref: `PAY_${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
}
