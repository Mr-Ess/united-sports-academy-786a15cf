import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Branch = { id: string; name: string; name_ar: string; active: boolean };

type BranchContextValue = {
  branches: Branch[];
  currentBranchId: string | null;
  setCurrentBranchId: (id: string | null) => void;
  currentBranch: Branch | null;
};

const BranchContext = createContext<BranchContextValue | null>(null);
const STORAGE_KEY = "academy.currentBranchId";

export function BranchProvider({
  branches,
  defaultBranchId,
  children,
}: {
  branches: Branch[];
  defaultBranchId?: string | null;
  children: ReactNode;
}) {
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return defaultBranchId ?? branches[0]?.id ?? null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && branches.some((b) => b.id === stored)) return stored;
    return defaultBranchId ?? branches[0]?.id ?? null;
  });

  useEffect(() => {
    if (currentBranchId) localStorage.setItem(STORAGE_KEY, currentBranchId);
    else localStorage.removeItem(STORAGE_KEY);
  }, [currentBranchId]);

  useEffect(() => {
    if (branches.length === 0 || branches.some((branch) => branch.id === currentBranchId)) return;
    const nextBranchId = defaultBranchId && branches.some((branch) => branch.id === defaultBranchId)
      ? defaultBranchId
      : branches[0]?.id ?? null;
    setCurrentBranchIdState(nextBranchId);
  }, [branches, currentBranchId, defaultBranchId]);

  const value = useMemo<BranchContextValue>(() => ({
    branches,
    currentBranchId,
    setCurrentBranchId: setCurrentBranchIdState,
    currentBranch: branches.find((b) => b.id === currentBranchId) ?? null,
  }), [branches, currentBranchId]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
