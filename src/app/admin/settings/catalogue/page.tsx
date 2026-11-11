import { CatalogueEditor } from "@/components/settings/catalogue-editor";
import { hasCapability } from "@/domain/policies/permissions";
import { getServerProfile } from "@/server/auth/profile";

export default async function CatalogueSettingsPage() {
  const profile = await getServerProfile();

  if (!profile) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Session requise.</div>
    );
  }

  if (!hasCapability(profile.role, "catalogue:write")) {
    return (
      <div className="flex flex-col gap-1 p-6">
        <h1 className="text-base font-semibold text-foreground">
          Paramétrage du catalogue
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre habilitation ({profile.roleLabel}) ne permet pas de modifier le
          catalogue documentaire. Cette action est réservée à la Direction
          Générale et au DSI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-1">
        <span className="eyebrow-style font-normal text-cfc-gold">
          Paramétrage · Direction Générale
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Catalogue documentaire
        </h1>
        <p className="text-sm text-muted-foreground">
          Les pièces exigées, leur nature, leur émetteur et les jeux de pièces
          par service. Chaque modification est journalisée et versionnée.
        </p>
      </header>

      <CatalogueEditor />
    </div>
  );
}
