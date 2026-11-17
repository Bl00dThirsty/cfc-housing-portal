import "server-only";

/**
 * Le référentiel déclarable, lu **par ses vues publiques**.
 *
 * Les tables du référentiel vivent dans le schéma `ref` : c'est le bon
 * endroit pour les écrire — versionnées, auditables, administrables. Mais
 * la plateforme hébergée n'expose à PostgREST que `public` et
 * `graphql_public` : lire `ref` depuis l'application y répond `406`, et le
 * catalogue devient invisible.
 *
 * Le référentiel est donc **exposé** par des vues en lecture dans `public`
 * (migration 034). Ce module est le **seul** endroit qui connaît la
 * correspondance entre une table du référentiel et sa vue : une table lue
 * par le mauvais nom est un catalogue entier qui disparaît, sans laisser
 * d'erreur à l'écran.
 *
 * Les vues sont `security invoker` : la lecture passe par les droits et la
 * RLS de l'appelant, exactement comme une lecture directe le ferait.
 */

/** La vue publique de chaque table du référentiel. */
export const REFERENCE_VIEWS = {
  service: "cfc_service",
  product: "cfc_product",
  product_rate: "cfc_product_rate",
  document_type: "cfc_document_type",
  document_nature: "cfc_document_nature",
  service_document_requirement: "cfc_service_document_requirement",
  email_template: "cfc_email_template",
  email_settings: "cfc_email_settings",
} as const;

/** Une table du référentiel. */
export type ReferenceTable = keyof typeof REFERENCE_VIEWS;

/** Le nom de la vue publique qui expose une table du référentiel. */
export function referenceView(table: ReferenceTable): string {
  return REFERENCE_VIEWS[table];
}
