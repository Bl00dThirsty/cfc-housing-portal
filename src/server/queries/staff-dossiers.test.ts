import { describe, expect, it } from "vitest";

import { mapStaffDossier } from "@/server/queries/staff-dossiers";

describe("mapStaffDossier", () => {
  it("uses the phase label configured by the database", () => {
    const dossier = mapStaffDossier(
      {
        id: "dossier-1",
        current_phase: "new_configured_phase",
      },
      new Map([["new_configured_phase", "Étape configurée dans Supabase"]]),
    );

    expect(dossier.phase).toBe("Étape configurée dans Supabase");
  });

  it("maps a database dossier and its persisted relationships into the staff view", () => {
    const dossier = mapStaffDossier({
      id: "dossier-1",
      duc_code: "DUC-0001",
      name: "Client réel",
      email: "client@example.cm",
      phone: "+237 600 000 001",
      region: "Centre",
      city: "Yaoundé",
      agency: "Agence Yaoundé Centre",
      advisor: "Conseillère affectée",
      profession: "Ingénieur",
      employer: "Employeur",
      project_type: "Construction",
      loan_amount: 8_000_000,
      savings_target: 2_000_000,
      savings_current: 500_000,
      savings_percent: 25,
      monthly_income: 900_000,
      monthly_payment: 85_000,
      debt_ratio: 9.4,
      land_title: "TF-42",
      duration_years: 15,
      rate: 5.5,
      account_number: null,
      notary_assigned: null,
      bet_assigned: "BET-1",
      officer: "Agent affecté",
      current_phase: "risk_bet",
      status: "open",
      completion_percent: 35,
      updated_at: "2026-11-18T10:00:00.000Z",
      agencies: { label: "Agence Yaoundé Centre", region: "Centre", city: "Yaoundé" },
      dossier_documents: [
        {
          id: "document-1",
          doc_type_code: "CNI_BIOMETRIQUE",
          original_filename: "cni.pdf",
          status: "uploaded",
          storage_path: "dossier-1/cni.pdf",
          size_bytes: 1024,
          uploaded_at: "2026-11-17T10:00:00.000Z",
          document_type: {
            label: "Carte Nationale d'identité",
            document_nature: { label: "Identité" },
          },
        },
      ],
      dossier_events: [
        {
          id: "event-1",
          event_type: "KYC_SUBMITTED",
          actor_role: "CITIZEN",
          occurred_at: "2026-11-17T09:00:00.000Z",
          payload: { note: "Dossier transmis." },
        },
      ],
      savings_accounts: [
        {
          id: "account-1",
          account_number: "CPT-0001",
          opening_date: "2026-10-01",
          balance: 500_000,
          target_amount: 2_000_000,
          interest_rate: 3.5,
          status: "active",
          savings_transactions: [
            {
              id: "transaction-1",
              transaction_type: "deposit",
              amount: 500_000,
              debit: null,
              credit: 500_000,
              balance_after: 500_000,
              channel: "agency",
              reference: "REF-1",
              description: "Versement initial",
              decision_state: "validated",
              receipt_ref: "REC-1",
              transaction_date: "2026-11-01",
              validated_by: null,
              validated_at: "2026-11-01T09:00:00.000Z",
            },
          ],
        },
      ],
    }, new Map([["risk_bet", "Risques & BET"]]));

    expect(dossier).toMatchObject({
      id: "dossier-1",
      ducId: "DUC-0001",
      name: "Client réel",
      agency: "Agence Yaoundé Centre",
      projectType: "Construction",
      loanAmount: "8 000 000 FCFA",
      savingsPercent: 25,
      phase: "Risques & BET",
      status: "Ouvert",
      completionPercent: 35,
      documents: [{
        name: "Carte Nationale d'identité",
        category: "Identité",
        status: "Téléversé",
        ref: "CNI_BIOMETRIQUE",
        fileSize: "1 Ko",
      }],
      visas: [{
        stage: "KYC soumis",
        actor: "CITIZEN",
        decision: "En attente",
        comment: "Dossier transmis.",
      }],
      savingsPassbook: {
        accountId: "account-1",
        accountNumber: "CPT-0001",
        currentBalance: 500_000,
        transactions: [{
          id: "transaction-1",
          amount: 500_000,
          type: "Dépôt",
          status: "validated",
          description: "Versement initial",
          channel: "Guichet CFC",
          credit: 500_000,
          balance: 500_000,
        }],
      },
    });
  });

  it("preserves unknown database statuses instead of inventing a status", () => {
    const dossier = mapStaffDossier({
      id: "dossier-2",
      duc_code: "DUC-0002",
      status: "awaiting_partner_response",
      current_phase: "unknown_phase",
      completion_percent: null,
      updated_at: null,
    });

    expect(dossier.status).toBe("awaiting_partner_response");
    expect(dossier.phase).toBe("unknown_phase");
    expect(dossier.completionPercent).toBe(0);
  });

  it("links a compensating entry to its source without changing the source state", () => {
    const dossier = mapStaffDossier({
      id: "dossier-3",
      savings_accounts: [{
        id: "account-3",
        balance: 0,
        savings_transactions: [
          {
            id: "source-transaction",
            transaction_type: "deposit",
            amount: 25_000,
            debit: null,
            credit: 25_000,
            balance_after: 25_000,
            channel: "agency",
            reference: "CFC-ORIGINAL",
            decision_state: "validated",
            transaction_date: "2026-11-17",
          },
          {
            id: "reversal-transaction",
            transaction_type: "withdrawal",
            amount: 25_000,
            debit: 25_000,
            credit: null,
            balance_after: 0,
            channel: "agency",
            reference: "CFC-REV-01",
            decision_state: "validated",
            reversal_of: "source-transaction",
            transaction_date: "2026-11-18",
          },
        ],
      }],
    });

    expect(dossier.savingsPassbook?.transactions).toMatchObject([
      { id: "source-transaction", status: "validated", reversedById: "reversal-transaction", reversedByReference: "CFC-REV-01" },
      { id: "reversal-transaction", status: "validated", reversalOfId: "source-transaction", reversalOfReference: "CFC-ORIGINAL" },
    ]);
  });
});
