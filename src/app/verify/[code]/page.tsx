import { VerificationStatus } from "@/components/verification/verification-status";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <VerificationStatus code={code} />;
}
