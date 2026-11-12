import { redirect } from "next/navigation";

export default function SellerProfileRedirect() {
  redirect("/profile?tab=Verification");
}
