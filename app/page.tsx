import { redirect } from "next/navigation";
import { DEFAULT_MALL_ID } from "@/lib/malls";

// Pilot has one mall; the bare domain goes straight to it.
export default function Home() {
  redirect(`/m/${DEFAULT_MALL_ID}`);
}
