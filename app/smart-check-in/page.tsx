import { redirect } from "next/navigation";

// Pretty marketing URL for the Smart Check-in plan — sends visitors
// straight into the real registration + Stripe checkout flow.
export default function SmartCheckinRedirect() {
  redirect("/register?plan=checkin");
}
