import { redirect } from "next/navigation";

export default function FileManagerRedirectPage() {
  redirect("/admin/clients?tab=duc");
}
