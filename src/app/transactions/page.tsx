import { redirect } from "next/navigation";

export default function TransactionsRedirectPage() {
  redirect("/profile?tab=Transactions");
}
