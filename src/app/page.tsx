import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Root safety net: real requests are redirected by middleware. The public
 * surface is /simulator, /faq, /tracking and /verify; there is no /accueil.
 */
export default function HomePage() {
  redirect("/login");
}
