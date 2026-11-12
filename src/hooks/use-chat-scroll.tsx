import { useCallback, useRef } from "react";

export function useChatScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // `scrollTo` n'existe pas dans tous les environnements d'exécution
    // (jsdom en est dépourvu) : sans cette garde, l'effet lève une TypeError
    // et le fil reste vide au lieu d'afficher les messages.
    if (typeof container.scrollTo !== "function") return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  return { containerRef, scrollToBottom };
}
