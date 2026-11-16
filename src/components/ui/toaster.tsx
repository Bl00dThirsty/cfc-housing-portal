"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Le toaster — **unique**, monté à la racine.
 *
 * Il thème les toasts avec les jetons de la charte CFC : le brun de la
 * marque, l'or, et les tons de succès et de danger déjà déclarés dans
 * `globals.css`. Un seul montage : deux toasters se doublent à l'écran.
 */
export function CfcToaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: "group rounded-lg border border-line-strong font-sans shadow-overlay",
          description: "text-muted-foreground",
          actionButton: "bg-cfc-brown text-white",
          cancelButton: "bg-muted text-foreground",
        },
      }}
    />
  );
}

export default CfcToaster;
