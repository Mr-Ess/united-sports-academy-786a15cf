export const SERVICES = [
  "Kids",
  "Adults",
  "Ladies only",
  "Diving",
  "Baby",
  "Paraswim",
  "Open pool",
  "Hydrotherapy",
] as const;
export type Service = (typeof SERVICES)[number];

export const LEAD_SOURCES = ["Social media", "Call", "WhatsApp", "Referral"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const OFFERS = ["None", "10%", "20%"] as const;
export type Offer = (typeof OFFERS)[number];

export const LEAD_STATUSES = [
  "Interested",
  "Long-time customer",
  "Refused",
  "Pending Follow-up",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const AGENTS = ["Mero", "Nada", "Abdelkader", "Youssef", "Mostafa"] as const;
export type Agent = (typeof AGENTS)[number];

export interface Lead {
  id: string;
  name: string;
  contact: string;
  service: Service;
  source: LeadSource;
  assessmentDate: string;
  assessmentAttended: boolean;
  subscriptionType: string;
  offer: Offer;
  status: LeadStatus;
  agent: Agent;
  comments: string;
}

export const CATEGORIES = ["Kids", "Adults", "Ladies Only", "Open Access"] as const;
export type Category = (typeof CATEGORIES)[number];

export const LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const SESSION_TYPES = ["Group", "Private", "Drop-in", "Rental", "Hourly Split"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_COUNTS = ["1", "8", "12 Sessions", "Monthly Package", "Tageezy"] as const;
export type SessionCount = (typeof SESSION_COUNTS)[number];

export const PAYMENT_METHODS = ["Cash", "InstaPay", "Wallet"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DAY_GROUPS = [
  "Sat-Thu",
  "Sun-Tue",
  "Mon-Wed",
  "Mon-Wed Ladies",
  "Sat-Wed Aqua Baby",
] as const;
export type DayGroup = (typeof DAY_GROUPS)[number];

export const TIME_SLOTS = [
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface TraineeEvaluation {
  id: string;
  date: string;
  rating: number; // 1-10 overall skill score
  endurance: number; // 1-5
  technique: number; // 1-5
  notes: string;
  evaluator: string;
}

export interface Receipt {
  id: string;
  clientId: string; // unique short identifier e.g. CL-1A2B3C
  studentName: string;
  membershipId: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  category: Category;
  age: number;
  level: Level;
  type: SessionType;
  sessionsCount: SessionCount;
  totalSessions: number;
  sessionsUsed: number;
  receiptNumber: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  dayGroup: DayGroup;
  timeSlot: TimeSlot;
  coachId?: string;
  skillRating?: number;
  evaluations?: TraineeEvaluation[];
  notes?: string;
}

export interface CoachEvaluation {
  id: string;
  coachId: string;
  date: string;
  punctuality: number; // 1-5
  communication: number; // 1-5
  technique: number; // 1-5
  studentFeedback: number; // 1-5
  notes: string;
}

export type LaneCapacities = Record<string, number>; // key `${dayGroup}__${timeSlot}` -> capacity

export const COACHES = [
  "Coach Hager Shaheen",
  "Coach Hager Ismail",
  "Coach Shahd Ashraf",
  "Coach Ayman El-Maadawy",
  "Coach Mohamed El-Sayed",
  "Coach Nada",
  "Coach Yasmine Ghanam",
  "Coach Eyman El-Sadek",
  "Coach Mohamed Essam",
] as const;
export type Coach = (typeof COACHES)[number];

// key: `${coach}__${dayGroup}__${timeSlot}` -> hours worked
export type CoachShifts = Record<string, number>;

export const MAX_CAPACITY = 10;

export function sessionsForCount(c: SessionCount): number {
  if (c === "1") return 1;
  if (c === "8") return 8;
  if (c === "12 Sessions") return 12;
  if (c === "Monthly Package") return 12;
  if (c === "Tageezy") return 14;
  return 8;
}

// ---------- Scheduling module ----------

export interface CoachProfile {
  id: string;
  name: string;
  specialization: string;
  assignedDayGroups: string[];
  availability: string[]; // entries: `${dayGroup}__${timeSlot}`
  color: string;
}

export interface GroupTypeDef {
  id: string;
  name: string;
  capacity: number;
}

export interface Booking {
  id: string;
  coachId: string;
  dayGroup: string;
  timeSlot: string;
  groupTypeId: string;
  studentName: string;
  createdAt: string;
}

export const COACH_COLORS = [
  "#41C9E2", "#7BD3EA", "#A0E9FF", "#5EEAD4", "#A7F3D0",
  "#FDE68A", "#FCA5A5", "#C4B5FD", "#F0ABFC", "#FDBA74",
];

