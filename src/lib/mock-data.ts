import { Waves, Dumbbell, Shield, Volleyball, CircleDot } from "lucide-react";

export const SPORTS = [
  {
    id: "swim",
    name: "Swim School",
    nameAr: "مدرسة السباحة",
    tagline: "Kids & Adults · All levels",
    icon: Waves,
    color: "aqua",
    gradient: "from-[var(--aqua)] to-[var(--aqua-glow)]",
    description: "Small-group swim classes from infant splash to competitive stroke technique.",
    ageGroups: ["3-5", "6-12", "13-17", "Adult"],
    levels: ["Beginner", "Intermediate", "Advanced"],
    seasons: ["Summer", "Autumn", "Winter", "Spring"],
    students: 1240,
  },
  {
    id: "basketball",
    name: "Basketball",
    nameAr: "كرة السلة",
    tagline: "Skills · Teams · Leagues",
    icon: CircleDot,
    color: "orange",
    gradient: "from-[var(--orange)] to-[var(--coral)]",
    description: "Ball-handling, shooting form, and full-court IQ from rookie to varsity.",
    ageGroups: ["6-12", "13-17", "Adult"],
    levels: ["Beginner", "Intermediate", "Advanced"],
    seasons: ["Autumn", "Winter", "Spring"],
    students: 860,
  },
  {
    id: "volleyball",
    name: "Volleyball",
    nameAr: "الكرة الطائرة",
    tagline: "Beach & Indoor",
    icon: Volleyball,
    color: "coral",
    gradient: "from-[var(--coral)] to-[var(--orange)]",
    description: "Serve, set, spike. Indoor drills in winter and beach clinics in summer.",
    ageGroups: ["13-17", "Adult"],
    levels: ["Beginner", "Intermediate", "Advanced"],
    seasons: ["Summer", "Spring", "Autumn"],
    students: 540,
  },
  {
    id: "karate",
    name: "Karate",
    nameAr: "الكاراتيه",
    tagline: "Discipline · Belts · Sparring",
    icon: Shield,
    color: "navy",
    gradient: "from-[var(--navy)] to-[var(--aqua)]",
    description: "Traditional Shotokan curriculum with grading, kata, and controlled kumite.",
    ageGroups: ["3-5", "6-12", "13-17", "Adult"],
    levels: ["Beginner", "Intermediate", "Advanced"],
    seasons: ["Autumn", "Winter", "Spring", "Summer"],
    students: 420,
  },
  {
    id: "fitness",
    name: "Fitness & Conditioning",
    nameAr: "اللياقة والإعداد البدني",
    tagline: "Strength · HIIT · Mobility",
    icon: Dumbbell,
    color: "lime",
    gradient: "from-[var(--lime)] to-[var(--aqua-glow)]",
    description: "Athlete-grade conditioning, functional strength, and recovery science.",
    ageGroups: ["13-17", "Adult"],
    levels: ["Beginner", "Intermediate", "Advanced"],
    seasons: ["Summer", "Autumn", "Winter", "Spring"],
    students: 980,
  },
] as const;

export const SEASONS = [
  { id: "Summer", label: "Summer Camp", labelAr: "معسكر الصيف", emoji: "☀️", accent: "orange" },
  { id: "Autumn", label: "Autumn Term", labelAr: "فصل الخريف", emoji: "🍂", accent: "coral" },
  { id: "Winter", label: "Winter Clinics", labelAr: "عيادات الشتاء", emoji: "❄️", accent: "aqua" },
  { id: "Spring", label: "Spring Bootcamp", labelAr: "معسكر الربيع", emoji: "🌱", accent: "lime" },
] as const;

export const BRANCHES = [
  {
    id: "main",
    name: "Main Branch — Downtown HQ",
    nameAr: "الفرع الرئيسي — وسط المدينة",
    phone: "+971 4 555 1000",
    whatsapp: "+971 50 555 1000",
    email: "main@unitedsport.ac",
    hours: "Sat–Thu · 6am–11pm",
    address: "1 Union Ave, Downtown District",
    map: "https://www.google.com/maps?q=Dubai+Downtown&output=embed",
  },
  {
    id: "west",
    name: "West City Branch",
    nameAr: "فرع غرب المدينة",
    phone: "+971 4 555 2000",
    whatsapp: "+971 50 555 2000",
    email: "west@unitedsport.ac",
    hours: "Sat–Thu · 7am–10pm",
    address: "West Sports Plaza, Al Barsha",
    map: "https://www.google.com/maps?q=Al+Barsha+Dubai&output=embed",
  },
  {
    id: "coastal",
    name: "Coastal Campus",
    nameAr: "الحرم الساحلي",
    phone: "+971 4 555 3000",
    whatsapp: "+971 50 555 3000",
    email: "coastal@unitedsport.ac",
    hours: "Daily · 5am–midnight",
    address: "Marina Aquatic Center, Beachfront",
    map: "https://www.google.com/maps?q=Dubai+Marina&output=embed",
  },
  {
    id: "east",
    name: "East Hub",
    nameAr: "المركز الشرقي",
    phone: "+971 4 555 4000",
    whatsapp: "+971 50 555 4000",
    email: "east@unitedsport.ac",
    hours: "Sat–Thu · 7am–11pm",
    address: "Eastside Arena, Al Warqa",
    map: "https://www.google.com/maps?q=Al+Warqa+Dubai&output=embed",
  },
] as const;

export const BRANCH_NAMES = BRANCHES.map((b) => b.name);

export const GALLERY = [
  { id: 1, title: "State Swim Meet Finals", sport: "swim", season: "Summer", color: "220 60% 55%", cat: "Competitions" },
  { id: 2, title: "U14 Basketball Championship", sport: "basketball", season: "Winter", color: "30 90% 55%", cat: "Competitions" },
  { id: 3, title: "Beach Volleyball Camp", sport: "volleyball", season: "Summer", color: "15 85% 60%", cat: "Camps" },
  { id: 4, title: "Karate Belt Grading", sport: "karate", season: "Autumn", color: "260 40% 30%", cat: "Celebrations" },
  { id: 5, title: "Strength Lab Open Day", sport: "fitness", season: "Spring", color: "145 60% 55%", cat: "Daily Practice" },
  { id: 6, title: "Junior Swim Squad", sport: "swim", season: "Autumn", color: "210 70% 60%", cat: "Daily Practice" },
  { id: 7, title: "Skills & Drills Clinic", sport: "basketball", season: "Autumn", color: "35 85% 60%", cat: "Daily Practice" },
  { id: 8, title: "Winter Indoor League", sport: "volleyball", season: "Winter", color: "20 80% 55%", cat: "Competitions" },
  { id: 9, title: "Kata Demonstration", sport: "karate", season: "Winter", color: "255 45% 35%", cat: "Celebrations" },
  { id: 10, title: "Summer Splash Party", sport: "swim", season: "Summer", color: "195 80% 55%", cat: "Celebrations" },
  { id: 11, title: "Coach Retreat", sport: "fitness", season: "Autumn", color: "150 55% 50%", cat: "Behind the Scenes" },
  { id: 12, title: "Sunset Beach Volley", sport: "volleyball", season: "Summer", color: "10 90% 60%", cat: "Camps" },
];

export const VIDEOS = [
  { id: "v1", title: "Perfect Freestyle Breath Timing", sport: "swim", duration: "4:12", views: "24.1k", cat: "Technical" },
  { id: "v2", title: "3-Cone Shooting Drill Breakdown", sport: "basketball", duration: "6:38", views: "18.9k", cat: "Technical" },
  { id: "v3", title: "Approach Jump Mechanics", sport: "volleyball", duration: "5:21", views: "9.4k", cat: "Technical" },
  { id: "v4", title: "White → Yellow Belt Kata", sport: "karate", duration: "8:02", views: "12.7k", cat: "Technical" },
  { id: "v5", title: "20-Min Athlete Mobility Flow", sport: "fitness", duration: "20:15", views: "31.5k", cat: "Technical" },
  { id: "v6", title: "Backstroke Body Position", sport: "swim", duration: "3:44", views: "15.2k", cat: "Technical" },
  { id: "v7", title: "A Day at United Sport", sport: "fitness", duration: "12:30", views: "58.2k", cat: "Behind the Scenes" },
  { id: "v8", title: "Championship Highlight Reel", sport: "basketball", duration: "3:20", views: "94.3k", cat: "Match Highlights" },
];

export const RESOURCES = [
  { id: "r1", title: "Learn-to-Swim Parent Handbook", sport: "swim", type: "PDF", size: "2.4 MB", cat: "Guide" },
  { id: "r2", title: "Basketball Off-Season Program", sport: "basketball", type: "PDF", size: "1.8 MB", cat: "Program" },
  { id: "r3", title: "Volleyball Rotation Cheat Sheet", sport: "volleyball", type: "PDF", size: "640 KB", cat: "Reference" },
  { id: "r4", title: "Karate Grading Requirements", sport: "karate", type: "PDF", size: "1.2 MB", cat: "Reference" },
  { id: "r5", title: "Athlete Nutrition Handbook", sport: "fitness", type: "PDF", size: "3.1 MB", cat: "Nutrition" },
  { id: "r6", title: "Skill Checklist — Level 1", sport: "swim", type: "PDF", size: "420 KB", cat: "Checklist" },
  { id: "r7", title: "Strength Baseline Test", sport: "fitness", type: "PDF", size: "780 KB", cat: "Checklist" },
  { id: "r8", title: "Coach Feedback Framework", sport: "basketball", type: "PDF", size: "990 KB", cat: "Program" },
];

export const REGISTRATIONS = [
  { id: "REG-1042", name: "Aiden Chen", sport: "Swim School", branch: "Coastal Campus", season: "Summer", status: "Approved", date: "2026-07-12" },
  { id: "REG-1043", name: "Sofia Martins", sport: "Basketball", branch: "East Hub", season: "Autumn", status: "Pending", date: "2026-07-14" },
  { id: "REG-1044", name: "Liam O'Connor", sport: "Karate", branch: "West City Branch", season: "Autumn", status: "Approved", date: "2026-07-15" },
  { id: "REG-1045", name: "Priya Shah", sport: "Fitness", branch: "Main Branch", season: "Summer", status: "Approved", date: "2026-07-15" },
  { id: "REG-1046", name: "Noah Kim", sport: "Volleyball", branch: "Main Branch", season: "Summer", status: "Pending", date: "2026-07-18" },
  { id: "REG-1047", name: "Ella Rossi", sport: "Swim School", branch: "Coastal Campus", season: "Autumn", status: "Rejected", date: "2026-07-19" },
  { id: "REG-1048", name: "Marcus Hall", sport: "Basketball", branch: "East Hub", season: "Winter", status: "Pending", date: "2026-07-21" },
];

export const APPLICATIONS = [
  { id: "APP-201", name: "Jordan Blake", kind: "Job", role: "Head Swim Coach", exp: "6 yrs", status: "Pending" },
  { id: "APP-202", name: "Maya Sato", kind: "Volunteer", role: "Event Support", exp: "—", status: "Approved" },
  { id: "APP-203", name: "Diego Alvarez", kind: "Job", role: "Basketball Assistant", exp: "3 yrs", status: "Approved" },
  { id: "APP-204", name: "Hannah Weiss", kind: "Volunteer", role: "Youth Mentor", exp: "—", status: "Pending" },
  { id: "APP-205", name: "Kenji Watanabe", kind: "Job", role: "Karate Sensei", exp: "10 yrs", status: "Pending" },
  { id: "APP-206", name: "Zoe Bennett", kind: "Volunteer", role: "Media Team", exp: "—", status: "Rejected" },
];

export const ENROLLMENT_TREND = [
  { month: "Jan", swim: 180, basketball: 120, volleyball: 60, karate: 70, fitness: 140 },
  { month: "Feb", swim: 210, basketball: 140, volleyball: 70, karate: 80, fitness: 160 },
  { month: "Mar", swim: 260, basketball: 170, volleyball: 90, karate: 90, fitness: 190 },
  { month: "Apr", swim: 300, basketball: 200, volleyball: 110, karate: 110, fitness: 220 },
  { month: "May", swim: 380, basketball: 220, volleyball: 160, karate: 120, fitness: 240 },
  { month: "Jun", swim: 520, basketball: 240, volleyball: 220, karate: 130, fitness: 280 },
  { month: "Jul", swim: 610, basketball: 260, volleyball: 260, karate: 140, fitness: 310 },
];

export const TEAM = [
  { id: "t1", name: "Dr. Reem Al-Hashimi", nameAr: "د. ريم الهاشمي", role: "Founder & President", bio: "Former Olympic swimmer with a PhD in sports science and 20+ years shaping national athletic curricula.", tags: ["PhD", "Olympian", "FINA Cert"] },
  { id: "t2", name: "Marcus Feld", nameAr: "ماركوس فيلد", role: "Technical Director", bio: "NBA G-League scout turned academy director. Built our multi-sport pathway from grassroots to pro pipelines.", tags: ["NCAA", "FIBA"] },
  { id: "t3", name: "Coach Nina Kovač", nameAr: "المدربة نينا كوفاتش", role: "Head Swim Coach", bio: "European Championships medalist. Specializes in stroke biomechanics for youth athletes.", tags: ["ASCA L5", "Biomech"] },
  { id: "t4", name: "Sensei Kenji Watanabe", nameAr: "المعلم كنجي واتانابي", role: "Head Karate Sensei", bio: "6th-degree Shotokan black belt. Trained under the JKA lineage for over three decades.", tags: ["6th Dan", "JKA"] },
  { id: "t5", name: "Dr. Amara Okoye", nameAr: "د. أمارا أوكوي", role: "Sports Nutritionist", bio: "Registered dietitian designing meal plans for our elite athletes and youth camps alike.", tags: ["RD", "IOC Diploma"] },
  { id: "t6", name: "Diego Alvarez", nameAr: "دييغو ألفاريز", role: "Basketball Program Lead", bio: "Former Spanish ACB player. Leads our shooting mechanics and IQ curriculum.", tags: ["ACB", "FIBA Coach"] },
];

export const PARTNERS = [
  { id: "p1", name: "National Swimming Federation", nameAr: "الاتحاد الوطني للسباحة", cat: "Federation", collab: "Officially sanctioned learn-to-swim curriculum and youth ranking events.", color: "220 60% 55%" },
  { id: "p2", name: "Falcon Basketball League", nameAr: "دوري الصقر لكرة السلة", cat: "League", collab: "Home academy for U14 & U18 regional teams; hosts the annual Falcon Cup.", color: "30 90% 55%" },
  { id: "p3", name: "PeakGear Athletics", nameAr: "بيك جير الرياضية", cat: "Sponsor", collab: "Exclusive apparel & equipment partner for all training gear and match kits.", color: "15 85% 60%" },
  { id: "p4", name: "Ministry of Youth & Sports", nameAr: "وزارة الشباب والرياضة", cat: "Institutional", collab: "Grant-funded outreach programs for underserved communities and public schools.", color: "260 40% 40%" },
  { id: "p5", name: "AquaLife Hydration", nameAr: "أكوا لايف", cat: "Sponsor", collab: "Hydration & recovery drinks partner across every branch and event.", color: "195 80% 55%" },
  { id: "p6", name: "Shotokan World Alliance", nameAr: "تحالف الشوتوكان العالمي", cat: "Federation", collab: "Belt grading authority for our Karate program with international recognition.", color: "255 45% 35%" },
  { id: "p7", name: "Coastal Health Group", nameAr: "مجموعة كوستال الصحية", cat: "Institutional", collab: "On-site sports medicine, physiotherapy, and athlete injury prevention.", color: "145 60% 55%" },
  { id: "p8", name: "MetroBank Youth Fund", nameAr: "صندوق مترو بنك للشباب", cat: "Sponsor", collab: "Scholarship program covering 200+ underprivileged athletes per season.", color: "210 70% 60%" },
];

export const BLOG = [
  { id: "b1", title: "5 Nutrition Habits That Separate Elite Swimmers", author: "Dr. Amara Okoye", cat: "Nutrition", read: "6 min", date: "2026-07-20", excerpt: "Fuel, timing, and micronutrients — what our national-level swimmers actually eat during peak training.", body: "The difference between good and elite comes down to consistency: pre-training carbs, post-set protein, hydration checkpoints, sleep-friendly evening meals, and travel-day prep. Here's the framework we use..." },
  { id: "b2", title: "Mental Reps: Visualization Drills for Young Athletes", author: "Coach Nina Kovač", cat: "Mental Conditioning", read: "5 min", date: "2026-07-14", excerpt: "Ten minutes a day of guided visualization measurably improved race-day performance in our U14 squad.", body: "We started every Monday session with a five-minute mental walkthrough of the athlete's core skill. Twelve weeks in, the results were measurable..." },
  { id: "b3", title: "Off-Season Strength: Building a Basketball Base", author: "Diego Alvarez", cat: "Training", read: "8 min", date: "2026-07-08", excerpt: "The three-block plan we use to turn a rest phase into a launchpad for next season.", body: "Block one is corrective and aerobic. Block two shifts to strength and power. Block three integrates sport-specific movement patterns..." },
  { id: "b4", title: "Student Spotlight: From Non-Swimmer to State Finalist in 18 Months", author: "Editorial", cat: "Spotlight", read: "4 min", date: "2026-06-29", excerpt: "How 12-year-old Aiden Chen went from splash-pool nerves to a national-ranking finish.", body: "Aiden joined our Learn-to-Swim beginner group scared of the deep end. Eighteen months later he stood on the podium..." },
  { id: "b5", title: "Karate for Confidence: Why We Start Kids at Age 3", author: "Sensei Kenji Watanabe", cat: "Youth", read: "5 min", date: "2026-06-22", excerpt: "The early belts aren't about fighting — they build focus, listening, and body awareness.", body: "A three-year-old's first bow is a lesson in ceremony. Their first kata is a lesson in memory. Their first sparring drill is a lesson in respect..." },
  { id: "b6", title: "Recovery Rituals: A 20-Minute Cool-Down That Works", author: "Dr. Amara Okoye", cat: "Recovery", read: "7 min", date: "2026-06-15", excerpt: "The exact sequence our coaches run after every high-intensity training block.", body: "Foam roll, mobility flow, breathwork, and a small carb-protein refuel. Twenty minutes. Done right, this alone cuts DOMS in half..." },
];
