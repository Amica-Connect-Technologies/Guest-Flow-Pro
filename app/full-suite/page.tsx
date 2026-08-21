import { redirect } from "next/navigation";

// Pretty marketing URL for the Full Suite plan — sends visitors
// straight into the real registration + Stripe checkout flow.
export default function FullSuiteRedirect() {
  redirect("/register?plan=full");
}
