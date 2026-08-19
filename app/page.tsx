import { redirect } from "next/navigation";

export default function Home() {
  // Root redirects to kiosk by default
  // Admin accesses /admin directly
  redirect("/kiosk");
}
