import { BorrowerRequestPortfolio } from "@/components/portail-client/borrower-request-portfolio";
import { listBorrowerRequests } from "@/server/queries/borrower-requests";

export const dynamic = "force-dynamic";

export default async function BorrowerRequestsPage() {
  const result = await listBorrowerRequests();
  return <BorrowerRequestPortfolio result={result} />;
}
