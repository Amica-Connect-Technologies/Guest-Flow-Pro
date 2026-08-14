import { redirect } from "next/navigation";

// Pretty marketing URL for the Guest Experience Pro plan — sends visitors
// straight into the real registration + Stripe checkout flow.
export default function GuestExperienceProRedirect() {
  redirect("/register?plan=concierge_checkin");
}
