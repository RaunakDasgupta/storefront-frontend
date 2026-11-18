import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { money } from "../../shared/lib/data";
import type { Address } from "../../shared/lib/orderlogic";
import { Icon, Field } from "../../shared/ui";
import { DLG_BODY, DLG_DEMO, DLG_HEAD, DLG_TITLE, DLG_WIDE } from "../ui";
import { useCart } from "../hooks/useCart";
import { useCustomer, type User } from "../hooks/useCustomer";
import { TEST_CARD, DECLINED_CARD } from "../../shared/api/mock";
import { messageOf } from "../../shared/store/errors";
import { payAndCheckout } from "../store/checkout";
import { addressEditing, addressSaved, checkoutClosed } from "../store/checkoutSlice";
import {
  EMPTY_ADDRESS, formatCardNumber, formatExpiry, validateAddress, validateCard,
  type AddressErrors, type Card, type CardErrors,
} from "../store/gateway";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";

/** A step in the "Address > Payment" line: every step after the first gets a › in front. */
const CO_STEP = "not-first:before:mr-1.5 not-first:before:content-['›']";

/** Renders the checkout popup (address, then payment, then "order placed") while the store says it is open. */
export function CheckoutDialogHost() {
  const open = useAppSelector((s) => s.checkout.stage !== "closed");
  const { user } = useCustomer();
  return open && user ? <CheckoutDialog user={user} /> : null;
}

function AddressStep({ initial, onDone }: { initial: Address; onDone: (a: Address) => void }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<AddressErrors>({});
  const bind = (k: keyof Address) => ({ id: `co-${k}`, value: v[k], error: errors[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateAddress(v);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (firstBad) return document.getElementById(`co-${firstBad}`)?.focus();
    onDone({ ...v, fullName: v.fullName.trim(), line1: v.line1.trim(), line2: v.line2.trim(), city: v.city.trim(), state: v.state.trim(), pin: v.pin.trim() });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={DLG_BODY}>
        <Field label="Full name" autoComplete="name" {...bind("fullName")} autoFocus />
        <Field label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel" {...bind("phone")} />
        <Field label="Address" autoComplete="address-line1" {...bind("line1")} />
        <Field label="Apartment, landmark (optional)" autoComplete="address-line2" {...bind("line2")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" autoComplete="address-level2" {...bind("city")} />
          <Field label="State" autoComplete="address-level1" {...bind("state")} />
        </div>
        <Field label="PIN code" inputMode="numeric" maxLength={6} autoComplete="postal-code" {...bind("pin")} />
        <button type="submit" className="btn btn-primary">Continue to payment</button>
      </div>
    </form>
  );
}

function PaymentStep({ total, busy, onPay, onBack, address, demoGateway }: {
  total: number; busy: boolean; address: Address; onBack: () => void; onPay: (card: Card) => Promise<string | null>; demoGateway: boolean;
}) {
  const [card, setCard] = useState<Card>({ number: "", name: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<CardErrors>({});
  const [failure, setFailure] = useState("");
  const set = (k: keyof Card, format: (s: string) => string = (s) => s) => ({
    id: `co-${k}`, value: card[k], error: errors[k], onChange: (e: { target: { value: string } }) => setCard({ ...card, [k]: format(e.target.value) }),
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateCard(card);
    setErrors(found);
    setFailure("");
    const firstBad = Object.keys(found)[0];
    if (firstBad) return document.getElementById(`co-${firstBad}`)?.focus();
    setFailure((await onPay(card)) ?? "");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={DLG_BODY}>
        <p className="mb-4 flex items-start gap-2 rounded-[10px] bg-soft px-3 py-2.5 text-[13.5px]">
          <Icon name="truck" className="mt-px size-[18px] shrink-0" />
          <span className="min-w-0 flex-1">Deliver to <strong>{address.fullName}</strong>, {address.line1}{address.line2 && `, ${address.line2}`}, {address.city} {address.pin}</span>
          <button type="button" className="linkbtn" onClick={onBack} disabled={busy}>Change</button>
        </p>
        <Field label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" {...set("number", formatCardNumber)} autoFocus />
        <Field label="Name on card" autoComplete="cc-name" {...set("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry (MM/YY)" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} {...set("expiry", formatExpiry)} />
          <Field label="Security code" inputMode="numeric" autoComplete="cc-csc" maxLength={4} type="password" {...set("cvc", (s) => s.replace(/\D/g, ""))} />
        </div>
        <p className="error" role="alert" hidden={!failure}>{failure}</p>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Processing payment…" : `Pay ${money(total)}`}</button>
        {demoGateway && (
          <p className={DLG_DEMO}>
            Dummy gateway, no real payment. Use <code>{TEST_CARD}</code>, any future expiry and any code.
            Use <code>{DECLINED_CARD}</code> to see a declined payment.{" "}
            <button type="button" className="linkbtn" disabled={busy} onClick={() => setCard({ number: TEST_CARD, name: card.name || "Test Customer", expiry: "12/39", cvc: "123" })}>Fill in test card</button>
          </p>
        )}
      </div>
    </form>
  );
}

function PlacedStep({ onClose }: { onClose: () => void }) {
  const receipt = useAppSelector((s) => s.checkout.receipt);
  const address = useAppSelector((s) => s.checkout.address);
  if (!receipt) return null;
  const many = receipt.orderIds.length > 1;
  return (
    <div className="flex flex-col items-stretch gap-2.5 px-[22px] pt-7 pb-[22px] text-center">
      <span className="grid size-14 place-items-center self-center rounded-full border border-brand-line bg-brand-tint text-brand"><Icon name="check" className="size-7" /></span>
      <h2 id="co-title" className="text-[22px] font-[750]">{many ? "Orders placed" : "Order placed"}</h2>
      <p className="text-muted">Thank you. We have received your payment and will start preparing {many ? "your orders" : "your order"}.</p>
      <dl className="my-1.5 rounded-xl border border-line px-3.5 py-1 text-left text-sm [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:py-[9px] [&>div+div]:border-t [&>div+div]:border-line [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dt]:text-muted">
        <div><dt>{many ? "Orders" : "Order"}</dt><dd>{receipt.orderIds.join(" and ")}</dd></div>
        <div><dt>Paid</dt><dd>{money(receipt.paid)}</dd></div>
        <div><dt>Payment reference</dt><dd>{receipt.paymentRef}</dd></div>
        {address && <div><dt>Delivering to</dt><dd>{address.city}, {address.state} {address.pin}</dd></div>}
      </dl>
      <Link to="/orders" className="btn btn-primary" onClick={onClose}>{many ? "View orders" : "View order"}</Link>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Continue shopping</button>
    </div>
  );
}

function CheckoutDialog({ user }: { user: User }) {
  const dispatch = useAppDispatch();
  const { total } = useCart();
  const demoGateway = useAppSelector((s) => s.meta.sources.payments === "mock");
  const stage = useAppSelector((s) => s.checkout.stage);
  const address = useAppSelector((s) => s.checkout.address);
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state (like the login popup), but never while a payment is in flight
  const onClose = () => { dispatch(checkoutClosed()); };
  const close = () => { if (busy) return; ref.current?.close(); onClose(); };

  /** Returns an error message to show, or null once the payment went through and the order is placed. */
  async function pay(card: Card) {
    setBusy(true);
    try { return await dispatch(payAndCheckout(user, address!, card)); } catch (e) { return messageOf(e); } finally { setBusy(false); }
  }

  const title = stage === "address" ? "Delivery address" : "Payment";
  return (
    <dialog
      ref={ref}
      className={DLG_WIDE}
      aria-labelledby="co-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      {stage === "placed" ? <PlacedStep onClose={close} /> : (
        <>
          <header className={DLG_HEAD}>
            <div>
              <h2 id="co-title" className={DLG_TITLE}>{title}</h2>
              <ol className="mt-2 flex gap-1.5 text-[13px] text-muted" aria-label="Checkout progress">
                <li className={`${CO_STEP} ${stage === "address" ? "font-[650] text-ink" : "text-brand"}`} aria-current={stage === "address" ? "step" : undefined}>Address</li>
                <li className={`${CO_STEP} ${stage === "payment" ? "font-[650] text-ink" : ""}`} aria-current={stage === "payment" ? "step" : undefined}>Payment</li>
              </ol>
            </div>
            <button type="button" className="dlg-x" aria-label="Close" onClick={close} disabled={busy}>×</button>
          </header>
          {stage === "address"
            ? <AddressStep initial={address ?? { ...EMPTY_ADDRESS, fullName: user.name }} onDone={(a) => { dispatch(addressSaved(a)); }} />
            : address && <PaymentStep total={total} busy={busy} address={address} onBack={() => { dispatch(addressEditing()); }} onPay={pay} demoGateway={demoGateway} />}
        </>
      )}
    </dialog>
  );
}
