import { redirect } from "next/navigation";

// Pretty marketing URL for the Digital Concierge plan — sends visitors
// straight into the real registration + Stripe checkout flow.
export default function DigitalConciergeRedirect() {
  redirect("/register?plan=concierge");
}
