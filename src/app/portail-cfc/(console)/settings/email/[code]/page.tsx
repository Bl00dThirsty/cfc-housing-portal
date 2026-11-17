import { notFound } from "next/navigation";

import { EMAIL_TEMPLATE_CODES } from "@/server/email/defaults";
import { getEmailTemplateAction } from "@/server/email/actions";
import { EmailTemplateEditor } from "../_components/email-template-editor";

export const dynamic = "force-dynamic";

/**
 * Éditeur d'un modèle d'e-mail.
 *
 * La page ne fait que charger la version courante et l'historique ; toute la
 * logique d'édition et d'aperçu vit dans le composant client, qui rend
 * l'aperçu avec le moteur de rendu réel.
 */
export default async function EmailTemplatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalised = code.trim().toUpperCase();

  if (!EMAIL_TEMPLATE_CODES.includes(normalised)) {
    notFound();
  }

  const { template, history, isFallback } = await getEmailTemplateAction(normalised);

  return (
    <EmailTemplateEditor template={template} history={history} isFallback={isFallback} />
  );
}
