import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AGENTS, CATEGORIES, COACHES, COACH_COLORS, DAY_GROUPS, LEAD_SOURCES, LEAD_STATUSES, LEVELS,
  OFFERS, PAYMENT_METHODS, SERVICES, SESSION_COUNTS, SESSION_TYPES, TIME_SLOTS,
  sessionsForCount, MAX_CAPACITY,
  type Booking, type CoachProfile, type CoachShifts, type GroupTypeDef, type Lead, type Receipt,
  type CoachEvaluation, type LaneCapacities, type TraineeEvaluation,
} from "./academy-types";

const STORAGE_KEY = "swim-academy-v2";

interface State {
  leads: Lead[];
  receipts: Receipt[];
  shifts: CoachShifts;
  coachProfiles: CoachProfile[];
  groupTypes: GroupTypeDef[];
  bookings: Booking[];
  coachEvaluations: CoachEvaluation[];
  laneCapacities: LaneCapacities;
}

interface Store extends State {
  addLead: (l: Omit<Lead, "id">) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addReceipt: (r: Omit<Receipt, "id" | "sessionsUsed" | "totalSessions" | "clientId"> & { sessionsUsed?: number; clientId?: string }) => Receipt;
  updateReceipt: (id: string, patch: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;
  toggleSession: (id: string, index: number) => void;
  setShift: (key: string, hours: number) => void;
  addCoachProfile: (c: Omit<CoachProfile, "id">) => void;
  updateCoachProfile: (id: string, patch: Partial<CoachProfile>) => void;
  deleteCoachProfile: (id: string) => void;
  addGroupType: (g: Omit<GroupTypeDef, "id">) => void;
  updateGroupType: (id: string, patch: Partial<GroupTypeDef>) => void;
  deleteGroupType: (id: string) => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt">) => { ok: boolean; reason?: string };
  deleteBooking: (id: string) => void;
  checkBookingSlot: (input: { coachId: string; dayGroup: string; timeSlot: string; groupTypeId: string }) => { ok: boolean; reason?: string };
  setLaneCapacity: (key: string, capacity: number) => void;
  getLaneCapacity: (dayGroup: string, timeSlot: string) => number;
  addTraineeEvaluation: (receiptId: string, evalData: Omit<TraineeEvaluation, "id">) => void;
  addCoachEvaluation: (c: Omit<CoachEvaluation, "id">) => void;
  deleteCoachEvaluation: (id: string) => void;
  findByClientId: (clientId: string) => Receipt[];
  resetData: () => void;
}

const Ctx = createContext<Store | null>(null);

function uid() { return Math.random().toString(36).slice(2, 10); }
function makeClientId() { return "CL-" + Math.random().toString(36).slice(2, 8).toUpperCase(); }

function seed(): State {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dayOffset = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  const leads: Lead[] = [
    { id: uid(), name: "Sara Hassan", contact: "01001234567", service: "Kids", source: "Social media", assessmentDate: dayOffset(-2), assessmentAttended: true, subscriptionType: "8 Sessions", offer: "10%", status: "Interested", agent: "Mero", comments: "Wants weekend slots" },
    { id: uid(), name: "Ahmed Tarek", contact: "01112345678", service: "Adults", source: "WhatsApp", assessmentDate: dayOffset(1), assessmentAttended: false, subscriptionType: "Monthly", offer: "None", status: "Pending Follow-up", agent: "Nada", comments: "Prefers evenings" },
    { id: uid(), name: "Mona Adel", contact: "01223456789", service: "Ladies only", source: "Referral", assessmentDate: dayOffset(-1), assessmentAttended: true, subscriptionType: "12 Sessions", offer: "20%", status: "Long-time customer", agent: "Abdelkader", comments: "Loyal member" },
    { id: uid(), name: "Yara Kamel", contact: "01509876543", service: "Baby", source: "Call", assessmentDate: dayOffset(3), assessmentAttended: false, subscriptionType: "Tageezy", offer: "None", status: "Interested", agent: "Youssef", comments: "Baby 18mo" },
    { id: uid(), name: "Karim Nabil", contact: "01098765432", service: "Diving", source: "Social media", assessmentDate: dayOffset(-3), assessmentAttended: true, subscriptionType: "Drop-in", offer: "None", status: "Refused", agent: "Mostafa", comments: "Price too high" },
  ];

  const SPECIALIZATIONS: Record<string, string> = {
    "Coach Hager Shaheen": "Kids · Levels 1-3",
    "Coach Hager Ismail": "Kids · Beginner",
    "Coach Shahd Ashraf": "Kids · Intermediate",
    "Coach Ayman El-Maadawy": "Adults · Private",
    "Coach Mohamed El-Sayed": "Diving",
    "Coach Nada": "Ladies Only",
    "Coach Yasmine Ghanam": "Adults",
    "Coach Eyman El-Sadek": "Hydrotherapy / Para",
    "Coach Mohamed Essam": "Baby & Toddler",
  };

  const coachProfiles: CoachProfile[] = COACHES.map((name, i) => {
    const assignedDayGroups =
      name === "Coach Nada" ? ["Mon-Wed Ladies"]
      : name === "Coach Mohamed Essam" ? ["Sat-Wed Aqua Baby"]
      : name === "Coach Ayman El-Maadawy" ? ["Sun-Tue", "Mon-Wed"]
      : ["Sat-Thu", "Sun-Tue"];
    const availability: string[] = [];
    for (const dg of assignedDayGroups) {
      for (const ts of TIME_SLOTS.slice(0, 6)) availability.push(`${dg}__${ts}`);
    }
    return {
      id: uid(), name,
      specialization: SPECIALIZATIONS[name] ?? "General",
      assignedDayGroups, availability,
      color: COACH_COLORS[i % COACH_COLORS.length],
    };
  });

  const mk = (over: Partial<Receipt>): Receipt => ({
    id: uid(),
    clientId: makeClientId(),
    studentName: "Student",
    membershipId: "M" + Math.floor(Math.random() * 9000 + 1000),
    phone: "0100" + Math.floor(Math.random() * 9000000),
    category: "Kids",
    age: 8,
    level: "Level 1",
    type: "Group",
    sessionsCount: "8",
    totalSessions: 8,
    sessionsUsed: 0,
    receiptNumber: "R-" + Math.floor(Math.random() * 90000 + 10000),
    amountPaid: 1500,
    paymentDate: iso(today),
    paymentMethod: "Cash",
    dayGroup: "Sat-Thu",
    timeSlot: "5:00 PM",
    coachId: coachProfiles[0]?.id,
    skillRating: 5,
    evaluations: [],
    ...over,
  });

  const receipts: Receipt[] = [
    mk({ studentName: "Layla Mostafa", category: "Kids", level: "Level 2", sessionsUsed: 3, dayGroup: "Sat-Thu", timeSlot: "4:00 PM", amountPaid: 1800, coachId: coachProfiles[0]?.id, skillRating: 6 }),
    mk({ studentName: "Omar Sherif", category: "Kids", level: "Level 1", sessionsUsed: 1, dayGroup: "Sat-Thu", timeSlot: "5:00 PM", amountPaid: 1500, paymentMethod: "InstaPay", coachId: coachProfiles[0]?.id, skillRating: 4 }),
    mk({ studentName: "Hana Reda", category: "Ladies Only", level: "Level 3", type: "Group", sessionsUsed: 7, dayGroup: "Mon-Wed Ladies", timeSlot: "8:00 PM", amountPaid: 2200, paymentMethod: "Wallet", age: 28, coachId: coachProfiles[5]?.id, skillRating: 7 }),
    mk({ studentName: "Yousef Adel", category: "Adults", level: "Level 4", type: "Private", sessionsCount: "12 Sessions", totalSessions: 12, sessionsUsed: 5, dayGroup: "Sun-Tue", timeSlot: "9:00 PM", amountPaid: 4500, age: 32, coachId: coachProfiles[3]?.id, skillRating: 8 }),
    mk({ studentName: "Nour Hany", category: "Kids", level: "Advanced", sessionsUsed: 8, dayGroup: "Sat-Thu", timeSlot: "6:00 PM", amountPaid: 2000, paymentMethod: "InstaPay", coachId: coachProfiles[2]?.id, skillRating: 9 }),
    mk({ studentName: "Mariam Saleh", category: "Open Access", level: "Level 5", type: "Drop-in", sessionsCount: "1", totalSessions: 1, sessionsUsed: 0, dayGroup: "Mon-Wed", timeSlot: "7:00 PM", amountPaid: 250, age: 24, skillRating: 6 }),
    mk({ studentName: "Adam Khaled", category: "Kids", level: "Level 1", sessionsCount: "Tageezy", totalSessions: 14, sessionsUsed: 4, dayGroup: "Sat-Wed Aqua Baby", timeSlot: "4:00 PM", amountPaid: 2800, coachId: coachProfiles[8]?.id, skillRating: 3 }),
    mk({ studentName: "Tia Wael", category: "Kids", level: "Level 2", sessionsUsed: 6, dayGroup: "Sat-Thu", timeSlot: "5:00 PM", amountPaid: 1500, coachId: coachProfiles[0]?.id, skillRating: 5 }),
    mk({ studentName: "Hassan Ali", category: "Adults", level: "Level 3", type: "Group", sessionsUsed: 2, dayGroup: "Sun-Tue", timeSlot: "10:00 PM", amountPaid: 1800, age: 35, paymentMethod: "Wallet", coachId: coachProfiles[6]?.id, skillRating: 7 }),
  ];

  const shifts: CoachShifts = {
    [`Coach Hager Shaheen__Sat-Thu__4:00 PM`]: 2,
    [`Coach Hager Shaheen__Sat-Thu__5:00 PM`]: 2,
    [`Coach Nada__Mon-Wed Ladies__8:00 PM`]: 2,
    [`Coach Ayman El-Maadawy__Sun-Tue__9:00 PM`]: 2,
    [`Coach Mohamed Essam__Sat-Wed Aqua Baby__4:00 PM`]: 2,
  };

  const groupTypes: GroupTypeDef[] = [
    { id: uid(), name: "Private", capacity: 1 },
    { id: uid(), name: "Group of 3", capacity: 3 },
    { id: uid(), name: "Group of 5", capacity: 5 },
    { id: uid(), name: "Group of 8", capacity: 8 },
  ];

  const c0 = coachProfiles[0];
  const gt5 = groupTypes[2];
  const bookings: Booking[] = [
    { id: uid(), coachId: c0.id, dayGroup: "Sat-Thu", timeSlot: "4:00 PM", groupTypeId: gt5.id, studentName: "Layla Mostafa", createdAt: iso(today) },
    { id: uid(), coachId: c0.id, dayGroup: "Sat-Thu", timeSlot: "4:00 PM", groupTypeId: gt5.id, studentName: "Omar Sherif", createdAt: iso(today) },
    { id: uid(), coachId: c0.id, dayGroup: "Sat-Thu", timeSlot: "5:00 PM", groupTypeId: gt5.id, studentName: "Tia Wael", createdAt: iso(today) },
  ];

  const coachEvaluations: CoachEvaluation[] = [
    { id: uid(), coachId: coachProfiles[0].id, date: iso(today), punctuality: 5, communication: 4, technique: 5, studentFeedback: 5, notes: "Excellent rapport with kids" },
    { id: uid(), coachId: coachProfiles[3].id, date: iso(today), punctuality: 4, communication: 5, technique: 5, studentFeedback: 4, notes: "Strong technical depth" },
  ];

  return { leads, receipts, shifts, coachProfiles, groupTypes, bookings, coachEvaluations, laneCapacities: {} };
}

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) { const s = seed(); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); return s; }
    const parsed = JSON.parse(raw) as Partial<State>;
    const fresh = seed();
    const receipts = (parsed.receipts ?? fresh.receipts).map(r => ({
      ...r,
      clientId: r.clientId ?? makeClientId(),
      evaluations: r.evaluations ?? [],
    }));
    return {
      leads: parsed.leads ?? fresh.leads,
      receipts,
      shifts: parsed.shifts ?? fresh.shifts,
      coachProfiles: parsed.coachProfiles?.length ? parsed.coachProfiles : fresh.coachProfiles,
      groupTypes: parsed.groupTypes?.length ? parsed.groupTypes : fresh.groupTypes,
      bookings: parsed.bookings ?? fresh.bookings,
      coachEvaluations: parsed.coachEvaluations ?? fresh.coachEvaluations,
      laneCapacities: parsed.laneCapacities ?? {},
    };
  } catch { return seed(); }
}

export function AcademyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => ({
    leads: [], receipts: [], shifts: {}, coachProfiles: [], groupTypes: [], bookings: [],
    coachEvaluations: [], laneCapacities: {},
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => { setState(load()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state, ready]);

  const stateRef = useMemo(() => ({ current: state }), []);
  stateRef.current = state;

  const addLead = useCallback((l: Omit<Lead, "id">) =>
    setState(s => ({ ...s, leads: [{ ...l, id: uid() }, ...s.leads] })), []);
  const updateLead = useCallback((id: string, patch: Partial<Lead>) =>
    setState(s => ({ ...s, leads: s.leads.map(x => x.id === id ? { ...x, ...patch } : x) })), []);
  const deleteLead = useCallback((id: string) =>
    setState(s => ({ ...s, leads: s.leads.filter(x => x.id !== id) })), []);

  const addReceipt = useCallback((r: Omit<Receipt, "id" | "sessionsUsed" | "totalSessions" | "clientId"> & { sessionsUsed?: number; clientId?: string }) => {
    const created: Receipt = {
      ...r,
      id: uid(),
      clientId: r.clientId?.trim() ? r.clientId : makeClientId(),
      sessionsUsed: r.sessionsUsed ?? 0,
      totalSessions: sessionsForCount(r.sessionsCount),
      evaluations: r.evaluations ?? [],
    };
    setState(s => ({ ...s, receipts: [created, ...s.receipts] }));
    return created;
  }, []);
  const updateReceipt = useCallback((id: string, patch: Partial<Receipt>) =>
    setState(s => ({ ...s, receipts: s.receipts.map(x => {
      if (x.id !== id) return x;
      const merged = { ...x, ...patch };
      if (patch.sessionsCount) merged.totalSessions = sessionsForCount(patch.sessionsCount);
      return merged;
    }) })), []);
  const deleteReceipt = useCallback((id: string) =>
    setState(s => ({ ...s, receipts: s.receipts.filter(x => x.id !== id) })), []);

  const toggleSession = useCallback((id: string, index: number) =>
    setState(s => ({ ...s, receipts: s.receipts.map(x => {
      if (x.id !== id) return x;
      const newUsed = index < x.sessionsUsed ? index : Math.min(x.totalSessions, index + 1);
      return { ...x, sessionsUsed: newUsed };
    }) })), []);

  const setShift = useCallback((key: string, hours: number) =>
    setState(s => {
      const shifts = { ...s.shifts };
      if (hours <= 0) delete shifts[key]; else shifts[key] = hours;
      return { ...s, shifts };
    }), []);

  const addCoachProfile = useCallback((c: Omit<CoachProfile, "id">) =>
    setState(s => ({ ...s, coachProfiles: [...s.coachProfiles, { ...c, id: uid() }] })), []);
  const updateCoachProfile = useCallback((id: string, patch: Partial<CoachProfile>) =>
    setState(s => ({ ...s, coachProfiles: s.coachProfiles.map(x => x.id === id ? { ...x, ...patch } : x) })), []);
  const deleteCoachProfile = useCallback((id: string) =>
    setState(s => ({
      ...s,
      coachProfiles: s.coachProfiles.filter(x => x.id !== id),
      bookings: s.bookings.filter(b => b.coachId !== id),
    })), []);

  const addGroupType = useCallback((g: Omit<GroupTypeDef, "id">) =>
    setState(s => ({ ...s, groupTypes: [...s.groupTypes, { ...g, id: uid() }] })), []);
  const updateGroupType = useCallback((id: string, patch: Partial<GroupTypeDef>) =>
    setState(s => ({ ...s, groupTypes: s.groupTypes.map(x => x.id === id ? { ...x, ...patch } : x) })), []);
  const deleteGroupType = useCallback((id: string) =>
    setState(s => ({
      ...s,
      groupTypes: s.groupTypes.filter(x => x.id !== id),
      bookings: s.bookings.filter(b => b.groupTypeId !== id),
    })), []);

  const checkSlotAgainst = (
    s: State,
    input: { coachId: string; dayGroup: string; timeSlot: string; groupTypeId: string },
    ignoreBookingId?: string,
  ): { ok: boolean; reason?: string } => {
    const coach = s.coachProfiles.find(c => c.id === input.coachId);
    if (!coach) return { ok: false, reason: "Coach not found." };
    const gt = s.groupTypes.find(g => g.id === input.groupTypeId);
    if (!gt) return { ok: false, reason: "Group type not found." };
    const availKey = `${input.dayGroup}__${input.timeSlot}`;
    if (!coach.availability.includes(availKey)) {
      return { ok: false, reason: `${coach.name} is not available on ${input.dayGroup} at ${input.timeSlot}.` };
    }
    const existing = s.bookings.filter(b =>
      b.id !== ignoreBookingId &&
      b.coachId === input.coachId &&
      b.dayGroup === input.dayGroup &&
      b.timeSlot === input.timeSlot,
    );
    const conflictType = existing.find(b => b.groupTypeId !== input.groupTypeId);
    if (conflictType) {
      const other = s.groupTypes.find(g => g.id === conflictType.groupTypeId)?.name ?? "another group";
      return { ok: false, reason: `Slot already runs as "${other}". Cannot mix group types.` };
    }
    if (existing.length >= gt.capacity) {
      return { ok: false, reason: `Slot is full — ${gt.name} capacity (${gt.capacity}) reached.` };
    }
    return { ok: true };
  };

  const checkBookingSlot = useCallback((input: { coachId: string; dayGroup: string; timeSlot: string; groupTypeId: string }) =>
    checkSlotAgainst(stateRef.current, input), []);

  const addBooking = useCallback((b: Omit<Booking, "id" | "createdAt">) => {
    let result: { ok: boolean; reason?: string } = { ok: true };
    setState(s => {
      result = checkSlotAgainst(s, b);
      if (!result.ok) return s;
      return { ...s, bookings: [...s.bookings, { ...b, id: uid(), createdAt: new Date().toISOString() }] };
    });
    return result;
  }, []);

  const deleteBooking = useCallback((id: string) =>
    setState(s => ({ ...s, bookings: s.bookings.filter(b => b.id !== id) })), []);

  const setLaneCapacity = useCallback((key: string, capacity: number) =>
    setState(s => {
      const laneCapacities = { ...s.laneCapacities };
      if (!capacity || capacity === MAX_CAPACITY) delete laneCapacities[key];
      else laneCapacities[key] = capacity;
      return { ...s, laneCapacities };
    }), []);
  const getLaneCapacity = useCallback((dayGroup: string, timeSlot: string) =>
    stateRef.current.laneCapacities[`${dayGroup}__${timeSlot}`] ?? MAX_CAPACITY, []);

  const addTraineeEvaluation = useCallback((receiptId: string, evalData: Omit<TraineeEvaluation, "id">) =>
    setState(s => ({ ...s, receipts: s.receipts.map(r => {
      if (r.id !== receiptId) return r;
      const evals = [...(r.evaluations ?? []), { ...evalData, id: uid() }];
      return { ...r, evaluations: evals, skillRating: evalData.rating };
    }) })), []);

  const addCoachEvaluation = useCallback((c: Omit<CoachEvaluation, "id">) =>
    setState(s => ({ ...s, coachEvaluations: [{ ...c, id: uid() }, ...s.coachEvaluations] })), []);
  const deleteCoachEvaluation = useCallback((id: string) =>
    setState(s => ({ ...s, coachEvaluations: s.coachEvaluations.filter(c => c.id !== id) })), []);

  const findByClientId = useCallback((clientId: string) => {
    const q = clientId.trim().toLowerCase();
    if (!q) return [];
    return stateRef.current.receipts.filter(r =>
      r.clientId.toLowerCase() === q ||
      r.clientId.toLowerCase().includes(q) ||
      r.membershipId.toLowerCase() === q,
    );
  }, []);

  const resetData = useCallback(() => {
    const s = seed();
    setState(s);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }, []);

  const value = useMemo<Store>(() => ({
    ...state, addLead, updateLead, deleteLead,
    addReceipt, updateReceipt, deleteReceipt, toggleSession, setShift,
    addCoachProfile, updateCoachProfile, deleteCoachProfile,
    addGroupType, updateGroupType, deleteGroupType,
    addBooking, deleteBooking, checkBookingSlot,
    setLaneCapacity, getLaneCapacity,
    addTraineeEvaluation, addCoachEvaluation, deleteCoachEvaluation,
    findByClientId, resetData,
  }), [state, addLead, updateLead, deleteLead, addReceipt, updateReceipt, deleteReceipt, toggleSession, setShift,
       addCoachProfile, updateCoachProfile, deleteCoachProfile, addGroupType, updateGroupType, deleteGroupType,
       addBooking, deleteBooking, checkBookingSlot, setLaneCapacity, getLaneCapacity,
       addTraineeEvaluation, addCoachEvaluation, deleteCoachEvaluation, findByClientId, resetData]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAcademy(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAcademy must be used inside AcademyProvider");
  return v;
}

export { AGENTS, CATEGORIES, COACHES, COACH_COLORS, DAY_GROUPS, LEAD_SOURCES, LEAD_STATUSES, LEVELS, OFFERS, PAYMENT_METHODS, SERVICES, SESSION_COUNTS, SESSION_TYPES, TIME_SLOTS };
