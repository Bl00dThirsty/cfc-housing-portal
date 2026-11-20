import { REGISTER_KEYS, type RegisterKey } from "@/domain/entities/registers";

/** Valide une clé de registre issue d'une route dynamique. */
export function asRegisterKey(value: string): RegisterKey | null {
  return (REGISTER_KEYS as readonly string[]).includes(value) ? (value as RegisterKey) : null;
}
