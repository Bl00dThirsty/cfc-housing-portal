/**
 * Fournisseurs de messagerie.
 *
 * Le service d'e-mail ne connaît qu'une interface (`EmailProvider`) : deux
 * adaptateurs l'implémentent, `ResendProvider` (API HTTP) et `SmtpProvider`
 * (SMTP). Le choix se fait **par l'environnement**, jamais par code.
 *
 * Règle structurante : **l'absence de configuration n'est pas une erreur**.
 * `getEmailProvider()` renvoie alors `null` ; le pipeline journalise
 * l'envoi en `skipped`. Le portail doit se construire, se démarrer et
 * fonctionner sans aucun identifiant de messagerie.
 */

import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { hostname as osHostname } from "node:os";
import { connect as netConnect, type Socket } from "node:net";

import { getEmailEnv, type SmtpEnv } from "@/server/env";
import type { OutgoingEmail, ProviderResult } from "./types";

/** Fournisseur de messagerie abstrait. */
export interface EmailProvider {
  /** Identifiant du fournisseur (`resend`, `smtp`) — journalisé. */
  readonly name: string;
  /** Envoie un message. Ne lève jamais : l'échec est renvoyé dans le résultat. */
  send(message: OutgoingEmail): Promise<ProviderResult>;
}

/** ---------------------------------------------------------------------------
 * Resend
 * ------------------------------------------------------------------------- */

/** Configuration de l'adaptateur Resend. */
export interface ResendConfig {
  apiKey: string;
  /** Adresse d'expédition (`Nom <adresse>`). */
  from: string;
  /** Point d'entrée de l'API — surchargé en test. */
  endpoint?: string;
}

/** Adaptateur Resend (API HTTP). */
export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  private readonly apiKey: string;
  private readonly from: string;
  private readonly endpoint: string;

  constructor(config: ResendConfig) {
    this.apiKey = config.apiKey;
    this.from = config.from;
    this.endpoint = config.endpoint ?? "https://api.resend.com/emails";
  }

  async send(message: OutgoingEmail): Promise<ProviderResult> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        return {
          ok: false,
          messageId: null,
          error: payload?.message ?? `Resend a répondu HTTP ${response.status}.`,
        };
      }

      return { ok: true, messageId: payload?.id ?? null, error: null };
    } catch (caught) {
      return {
        ok: false,
        messageId: null,
        error: caught instanceof Error ? caught.message : "Erreur réseau Resend.",
      };
    }
  }
}

/** ---------------------------------------------------------------------------
 * SMTP
 * ------------------------------------------------------------------------- */

/** Réponse SMTP. */
interface SmtpReply {
  code: number;
  text: string;
}

/**
 * Session SMTP minimale, écrite en `net`/`tls` natifs.
 *
 * Le projet n'embarque pas de client SMTP : la conversation est donc
 * implémentée ici — dialogue en lignes, `STARTTLS`, `AUTH LOGIN`, `DATA`.
 * Elle est volontairement courte : le service n'a besoin que d'envoyer.
 */
class SmtpSession {
  private socket: Socket | TLSSocket;
  private buffer = "";
  private lines: string[] = [];
  private readonly replies: SmtpReply[] = [];
  private readonly waiters: Array<{
    resolve: (reply: SmtpReply) => void;
    reject: (error: Error) => void;
  }> = [];
  private failure: Error | null = null;

  constructor(socket: Socket | TLSSocket) {
    this.socket = socket;
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => this.handleData(chunk));
    this.socket.on("error", (error: Error) => this.handleFailure(error));
    this.socket.on("close", () =>
      this.handleFailure(new Error("Connexion SMTP fermée avant la fin de la conversation.")),
    );
  }

  private handleData(chunk: string): void {
    this.buffer += chunk;

    let index = this.buffer.indexOf("\n");
    while (index !== -1) {
      const line = this.buffer.slice(0, index).replace(/\r$/, "");
      this.buffer = this.buffer.slice(index + 1);
      this.lines.push(line);

      // Une réponse est complète lorsque la ligne porte un code suivi d'une
      // espace (`250 OK`) ; `250-DATA` annonce une suite.
      if (/^\d{3} /.test(line)) {
        const reply: SmtpReply = {
          code: Number(line.slice(0, 3)),
          text: this.lines.join("\n"),
        };
        this.lines = [];
        const waiter = this.waiters.shift();
        if (waiter) waiter.resolve(reply);
        else this.replies.push(reply);
      }

      index = this.buffer.indexOf("\n");
    }
  }

  private handleFailure(error: Error): void {
    if (this.failure) return;
    this.failure = error;
    while (this.waiters.length > 0) {
      const waiter = this.waiters.shift();
      waiter?.reject(error);
    }
  }

  /** Attend la prochaine réponse du serveur. */
  read(): Promise<SmtpReply> {
    const buffered = this.replies.shift();
    if (buffered) return Promise.resolve(buffered);
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  /** Écrit une commande (terminée par CRLF). */
  write(line: string): void {
    this.socket.write(`${line}\r\n`);
  }

  /** Écrit une commande et attend sa réponse. */
  async command(line: string): Promise<SmtpReply> {
    this.write(line);
    return this.read();
  }

  /** Bascule la connexion en TLS (après `STARTTLS`). */
  async upgrade(host: string, rejectUnauthorized: boolean): Promise<void> {
    const raw = this.socket as Socket;
    raw.removeAllListeners("data");
    raw.removeAllListeners("error");
    raw.removeAllListeners("close");

    const secure = tlsConnect({ socket: raw, servername: host, rejectUnauthorized });
    this.socket = secure;
    secure.setEncoding("utf8");
    secure.on("data", (chunk: string) => this.handleData(chunk));
    secure.on("error", (error: Error) => this.handleFailure(error));
    secure.on("close", () =>
      this.handleFailure(new Error("Connexion TLS SMTP fermée avant la fin de la conversation.")),
    );

    await new Promise<void>((resolve, reject) => {
      secure.once("secureConnect", () => resolve());
      secure.once("error", reject);
    });
  }

  /** Ferme la session sans laisser remonter d'erreur. */
  close(): void {
    try {
      this.socket.destroy();
    } catch {
      // La connexion est déjà morte : rien à faire.
    }
  }
}

/** Extrait l'adresse pure d'un en-tête `Nom <adresse@domaine>`. */
export function extractAddress(value: string): string {
  const match = /<([^>]+)>/.exec(value);
  const address = (match ? match[1] : value).trim();
  return address.includes("@") ? address : "no-reply@cfchousing.cm";
}

/** Encode un en-tête non-ASCII (RFC 2047). */
function encodeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Découpe une chaîne en lignes de 76 caractères (RFC 5322). */
function foldBody(value: string): string {
  return value.replace(/\r?\n/g, "\r\n");
}

/** Construit le message MIME `multipart/alternative` complet. */
function buildRawMessage(
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo: string | null,
): { raw: string; messageId: string } {
  const boundary = `----CFC_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const domain = extractAddress(from).split("@")[1] ?? "cfchousing.cm";
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@${domain}>`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
  ];

  const textPart = Buffer.from(foldBody(text), "utf8").toString("base64");
  const htmlPart = Buffer.from(foldBody(html), "utf8").toString("base64");

  const raw = [
    ...headers,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textPart,
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    htmlPart,
    `--${boundary}--`,
    ".",
  ].join("\r\n");

  return { raw, messageId };
}

/** Adaptateur SMTP. */
export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";

  private readonly config: SmtpEnv;
  private readonly from: string;
  private readonly clientHostname: string;
  private readonly rejectUnauthorized: boolean;

  constructor(
    config: SmtpEnv,
    options: { from?: string; hostname?: string; rejectUnauthorized?: boolean } = {},
  ) {
    this.config = config;
    this.from = options.from ?? "no-reply@cfchousing.cm";
    this.clientHostname = options.hostname ?? osHostname() ?? "localhost";
    this.rejectUnauthorized = options.rejectUnauthorized ?? true;
  }

  private connect(): Promise<SmtpSession> {
    return new Promise((resolve, reject) => {
      const socket = this.config.secure
        ? tlsConnect({
            host: this.config.host,
            port: this.config.port,
            servername: this.config.host,
            rejectUnauthorized: this.rejectUnauthorized,
          })
        : netConnect({ host: this.config.host, port: this.config.port });

      const onError = (error: Error) => {
        socket.destroy();
        reject(error);
      };

      if (this.config.secure) {
        (socket as TLSSocket).once("secureConnect", () => {
          socket.removeListener("error", onError);
          resolve(new SmtpSession(socket));
        });
      } else {
        (socket as Socket).once("connect", () => {
          socket.removeListener("error", onError);
          resolve(new SmtpSession(socket));
        });
      }

      socket.once("error", onError);
    });
  }

  async send(message: OutgoingEmail): Promise<ProviderResult> {
    let session: SmtpSession | null = null;
    let messageId: string | null = null;

    try {
      session = await this.connect();

      const greeting = await session.read();
      if (greeting.code !== 220) {
        throw new Error(`SMTP : accueil inattendu (code ${greeting.code}).`);
      }

      let ehlo = await session.command(`EHLO ${this.clientHostname}`);
      if (ehlo.code !== 250) {
        ehlo = await session.command(`HELO ${this.clientHostname}`);
        if (ehlo.code !== 250) {
          throw new Error(`SMTP : présentation refusée (code ${ehlo.code}).`);
        }
      }

      const capabilities = ehlo.text.toUpperCase();

      if (!this.config.secure && capabilities.includes("STARTTLS")) {
        const ready = await session.command("STARTTLS");
        if (ready.code === 220) {
          await session.upgrade(this.config.host, this.rejectUnauthorized);
          const reEhlo = await session.command(`EHLO ${this.clientHostname}`);
          if (reEhlo.code !== 250) {
            throw new Error(`SMTP : présentation TLS refusée (code ${reEhlo.code}).`);
          }
        }
      }

      if (this.config.user && this.config.password) {
        const auth = await session.command("AUTH LOGIN");
        if (auth.code === 334) {
          const userStep = await session.command(
            Buffer.from(this.config.user, "utf8").toString("base64"),
          );
          if (userStep.code === 334) {
            const passStep = await session.command(
              Buffer.from(this.config.password, "utf8").toString("base64"),
            );
            if (passStep.code !== 235) {
              throw new Error("SMTP : authentification refusée.");
            }
          } else if (userStep.code !== 235) {
            throw new Error(`SMTP : authentification refusée (code ${userStep.code}).`);
          }
        } else if (auth.code !== 235) {
          throw new Error(`SMTP : authentification non supportée (code ${auth.code}).`);
        }
      }

      const mailFrom = await session.command(`MAIL FROM:<${extractAddress(this.from)}>`);
      if (mailFrom.code !== 250) {
        throw new Error(`SMTP : MAIL FROM refusé (code ${mailFrom.code}).`);
      }

      const rcpt = await session.command(`RCPT TO:<${extractAddress(message.to)}>`);
      if (rcpt.code !== 250 && rcpt.code !== 251) {
        throw new Error(`SMTP : destinataire refusé (code ${rcpt.code}).`);
      }

      const data = await session.command("DATA");
      if (data.code !== 354) {
        throw new Error(`SMTP : DATA refusé (code ${data.code}).`);
      }

      const built = buildRawMessage(
        this.from,
        message.to,
        message.subject,
        message.html,
        message.text,
        message.replyTo ?? null,
      );
      messageId = built.messageId;

      session.write(built.raw);
      const accepted = await session.read();
      if (accepted.code !== 250) {
        throw new Error(`SMTP : message refusé (code ${accepted.code}).`);
      }

      await session.command("QUIT");
      return { ok: true, messageId, error: null };
    } catch (caught) {
      return {
        ok: false,
        messageId,
        error: caught instanceof Error ? caught.message : "Erreur SMTP inconnue.",
      };
    } finally {
      session?.close();
    }
  }
}

/** ---------------------------------------------------------------------------
 * Sélection du fournisseur
 * ------------------------------------------------------------------------- */

/**
 * Fournisseur retenu, ou `null` si aucune configuration n'est présente.
 *
 * `null` n'est pas une erreur : le pipeline journalise alors l'envoi en
 * `skipped` et rend la main à l'appelant.
 */
export function getEmailProvider(): EmailProvider | null {
  const env = getEmailEnv();

  if (env.provider === "resend" && env.resendApiKey) {
    return new ResendProvider({ apiKey: env.resendApiKey, from: env.from });
  }

  if (env.provider === "smtp" && env.smtp) {
    return new SmtpProvider(env.smtp, {
      from: env.from,
      rejectUnauthorized: env.smtpRejectUnauthorized,
    });
  }

  return null;
}
