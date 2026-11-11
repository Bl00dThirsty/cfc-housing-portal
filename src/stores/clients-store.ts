"use client";

import { create } from "zustand";

export type ClientSortKey =
  | "name"
  | "phase"
  | "status"
  | "loanAmount"
  | "savingsCurrent"
  | "completionPercent";

export type ClientFilters = {
  sortBy: ClientSortKey;
  phase: string;
  agency: string;
  status: string;
  search: string;
};

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  sortBy: "completionPercent",
  phase: "",
  agency: "",
  status: "",
  search: "",
};

export type ClientsState = ClientFilters & {
  selectedIds: string[];
  detailId: string | null;
  detailOpen: boolean;
  profileId: string | null;
  profileOpen: boolean;
  commandOpen: boolean;
  setSortBy: (sortBy: ClientSortKey) => void;
  setPhase: (phase: string) => void;
  setAgency: (agency: string) => void;
  setStatus: (status: string) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  toggleSelected: (id: string) => void;
  setSelected: (selectedIds: string[]) => void;
  clearSelection: () => void;
  openDetail: (detailId: string) => void;
  closeDetail: () => void;
  openProfile: (profileId: string) => void;
  closeProfile: () => void;
  setCommandOpen: (commandOpen: boolean) => void;
};

export const useClientsStore = create<ClientsState>((set) => ({
  ...DEFAULT_CLIENT_FILTERS,
  selectedIds: [],
  detailId: null,
  detailOpen: false,
  profileId: null,
  profileOpen: false,
  commandOpen: false,
  setSortBy: (sortBy) => set({ sortBy }),
  setPhase: (phase) => set({ phase }),
  setAgency: (agency) => set({ agency }),
  setStatus: (status) => set({ status }),
  setSearch: (search) => set({ search }),
  resetFilters: () => set({ ...DEFAULT_CLIENT_FILTERS }),
  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id],
    })),
  setSelected: (selectedIds) => set({ selectedIds }),
  clearSelection: () => set({ selectedIds: [] }),
  openDetail: (detailId) => set({ detailId, detailOpen: true, profileOpen: false }),
  closeDetail: () => set({ detailOpen: false }),
  openProfile: (profileId) => set({ profileId, profileOpen: true, detailOpen: false }),
  closeProfile: () => set({ profileOpen: false }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
