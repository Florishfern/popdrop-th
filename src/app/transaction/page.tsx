import { redirect } from "next/navigation";

export default function TransactionRedirectPage() {
  redirect("/profile?tab=Transactions");
}
