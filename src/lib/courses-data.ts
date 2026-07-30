export type CourseMode = "Offline" | "Online" | "Hybrid";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "Professional";

export type Course = {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  sport: string;
  mode: CourseMode;
  level: CourseLevel;
  startDate: string;
  endDate: string;
  duration: string;
  durationAr: string;
  schedule: string;
  scheduleAr: string;
  venue: string;
  venueAr: string;
  price: number;
  originalPrice?: number;
  seatsLeft: number;
  totalSeats: number;
  rating: number;
  reviewsCount: number;
  instructor: {
    name: string;
    nameAr: string;
    title: string;
    titleAr: string;
    certs: string[];
    experience: string;
  };
  syllabus: { week: string; topic: string; topicAr: string; details: string }[];
  reviews: { name: string; rating: number; quote: string }[];
  gradient: string;
  featured?: boolean;
};

export const COURSE_CATEGORIES = [
  { id: "all", label: "All Categories", labelAr: "كل الفئات" },
  { id: "swim", label: "Swimming", labelAr: "السباحة" },
  { id: "fitness", label: "Fitness & Strength", labelAr: "اللياقة والقوة" },
  { id: "basketball", label: "Basketball", labelAr: "كرة السلة" },
  { id: "volleyball", label: "Volleyball", labelAr: "الكرة الطائرة" },
  { id: "karate", label: "Karate", labelAr: "الكاراتيه" },
  { id: "nutrition", label: "Sports Nutrition", labelAr: "التغذية الرياضية" },
  { id: "coaching", label: "Athletic Coaching", labelAr: "التدريب الرياضي" },
] as const;

export const COURSE_MODES = ["All", "Offline", "Online", "Hybrid"] as const;
export const COURSE_LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "Professional"] as const;

export const COURSES: Course[] = [
  {
    id: "c1",
    title: "Advanced Swimming Mechanics Masterclass",
    titleAr: "ماستر كلاس ميكانيكا السباحة المتقدمة",
    category: "swim",
    categoryAr: "السباحة",
    sport: "swim",
    mode: "Offline",
    level: "Advanced",
    startDate: "2026-08-10",
    endDate: "2026-09-21",
    duration: "6 Weeks · 12 Sessions",
    durationAr: "٦ أسابيع · ١٢ جلسة",
    schedule: "Mon & Wed · 6:00pm–8:00pm",
    scheduleAr: "الاثنين والأربعاء · ٦م–٨م",
    venue: "Coastal Campus · Olympic Pool",
    venueAr: "الحرم الساحلي · المسبح الأولمبي",
    price: 1499,
    originalPrice: 1899,
    seatsLeft: 4,
    totalSeats: 16,
    rating: 4.9,
    reviewsCount: 128,
    instructor: {
      name: "Coach Nina Kovač",
      nameAr: "المدربة نينا كوفاتش",
      title: "Head Swim Coach · European Medalist",
      titleAr: "كبيرة مدربي السباحة",
      certs: ["ASCA L5", "FINA Cert", "Biomech Specialist"],
      experience: "15+ years coaching national squads.",
    },
    syllabus: [
      { week: "Week 1", topic: "Hydrodynamics & Body Position", topicAr: "الديناميكا المائية ووضعية الجسم", details: "Streamlining, drag reduction, and neutral spine alignment drills." },
      { week: "Week 2", topic: "Breathing & Bilateral Timing", topicAr: "التنفس والتوقيت الثنائي", details: "Breath-per-stroke patterns and CO₂ tolerance sets." },
      { week: "Week 3", topic: "Stroke Efficiency: Freestyle", topicAr: "كفاءة السباحة الحرة", details: "Catch, pull, recovery — high-elbow mechanics and film review." },
      { week: "Week 4", topic: "Backstroke & Body Roll", topicAr: "سباحة الظهر ودوران الجسم", details: "Rotation, head position, and finish mechanics." },
      { week: "Week 5", topic: "Turns, Walls & Underwaters", topicAr: "الدورات والاندفاع تحت الماء", details: "Flip turns, streamline kicks, and 15m breakout." },
      { week: "Week 6", topic: "Race Simulation & Taper", topicAr: "محاكاة السباق والتدرج", details: "Time trials, pacing charts, and taper protocol." },
    ],
    reviews: [
      { name: "Aiden C.", rating: 5, quote: "Dropped 3 seconds off my 100m free in a month. Coach Nina's film breakdowns are unreal." },
      { name: "Priya S.", rating: 5, quote: "Every session had a purpose. Best swim clinic I've ever done." },
    ],
    gradient: "from-[var(--aqua)] to-[var(--aqua-glow)]",
    featured: true,
  },
  {
    id: "c2",
    title: "Junior Karate Black Belt Prep",
    titleAr: "التحضير للحزام الأسود للناشئين",
    category: "karate",
    categoryAr: "الكاراتيه",
    sport: "karate",
    mode: "Offline",
    level: "Advanced",
    startDate: "2026-09-05",
    endDate: "2026-12-20",
    duration: "16 Weeks · 32 Sessions",
    durationAr: "١٦ أسبوع · ٣٢ جلسة",
    schedule: "Tue & Thu · 5:00pm–6:30pm",
    scheduleAr: "الثلاثاء والخميس · ٥م–٦:٣٠م",
    venue: "Main Branch · Dojo Hall B",
    venueAr: "الفرع الرئيسي · قاعة الدوجو ب",
    price: 2200,
    seatsLeft: 6,
    totalSeats: 14,
    rating: 4.8,
    reviewsCount: 74,
    instructor: {
      name: "Sensei Kenji Watanabe",
      nameAr: "المعلم كنجي واتانابي",
      title: "6th Dan Shotokan · JKA Lineage",
      titleAr: "الحزام الأسود ٦ دان",
      certs: ["6th Dan", "JKA", "WKF Referee"],
      experience: "30+ years training national kata champions.",
    },
    syllabus: [
      { week: "Weeks 1-4", topic: "Kihon Mastery", topicAr: "إتقان الكيهون", details: "Stances, blocks, and strikes to grading-level precision." },
      { week: "Weeks 5-8", topic: "Kata: Bassai Dai & Kanku Dai", topicAr: "كاتا: باساي داي وكانكو داي", details: "Full form breakdown, bunkai, and rhythm." },
      { week: "Weeks 9-12", topic: "Kumite Strategy", topicAr: "استراتيجية القتال", details: "Distance, timing, and controlled sparring drills." },
      { week: "Weeks 13-16", topic: "Grading Simulation", topicAr: "محاكاة الاختبار", details: "Mock panels, endurance sets, and mental prep." },
    ],
    reviews: [
      { name: "Liam O.", rating: 5, quote: "Passed my black belt first attempt. Sensei's kumite drills were the game-changer." },
    ],
    gradient: "from-[var(--navy)] to-[var(--aqua)]",
  },
  {
    id: "c3",
    title: "Elite Basketball Shooting Lab",
    titleAr: "معمل التصويب المتقدم لكرة السلة",
    category: "basketball",
    categoryAr: "كرة السلة",
    sport: "basketball",
    mode: "Hybrid",
    level: "Intermediate",
    startDate: "2026-08-20",
    endDate: "2026-10-01",
    duration: "6 Weeks · 18 Sessions",
    durationAr: "٦ أسابيع · ١٨ جلسة",
    schedule: "Mon/Wed/Fri · 4:30pm–6:00pm",
    scheduleAr: "الاثنين/الأربعاء/الجمعة · ٤:٣٠م–٦م",
    venue: "East Hub · Arena + Live Zoom",
    venueAr: "المركز الشرقي · صالة + زووم مباشر",
    price: 1299,
    originalPrice: 1599,
    seatsLeft: 9,
    totalSeats: 20,
    rating: 4.7,
    reviewsCount: 91,
    instructor: {
      name: "Diego Alvarez",
      nameAr: "دييغو ألفاريز",
      title: "Former ACB Player · FIBA Coach",
      titleAr: "لاعب سابق في الدوري الإسباني",
      certs: ["FIBA Coach L3", "ACB Pro"],
      experience: "12 years pro + 8 years coaching.",
    },
    syllabus: [
      { week: "Week 1", topic: "Form Reset & Base Mechanics", topicAr: "إعادة ضبط الأساسيات", details: "Feet, hips, elbow alignment — filmed and corrected." },
      { week: "Week 2", topic: "Catch-and-Shoot Range Work", topicAr: "التصويب من الاستلام", details: "Footwork variations from every spot on the floor." },
      { week: "Week 3", topic: "Off-the-Dribble Pull-Ups", topicAr: "التصويب بعد التنطيط", details: "Side steps, step-backs, and change-of-pace shots." },
      { week: "Week 4", topic: "Contested Shooting IQ", topicAr: "قرارات التصويب تحت الضغط", details: "Reading closeouts and shot selection." },
      { week: "Week 5", topic: "3-Point Extension", topicAr: "توسيع مدى التصويب", details: "Deep range mechanics and volume protocol." },
      { week: "Week 6", topic: "Live-Play Integration", topicAr: "التطبيق في المباراة", details: "Scrimmage-based shot creation and analytics." },
    ],
    reviews: [
      { name: "Marcus H.", rating: 5, quote: "3P% went from 28 to 41 in six weeks. The video sessions were worth it alone." },
      { name: "Sofia M.", rating: 4, quote: "Loved the hybrid format — I could rewatch every breakdown at home." },
    ],
    gradient: "from-[var(--orange)] to-[var(--coral)]",
    featured: true,
  },
  {
    id: "c4",
    title: "Sports Nutrition Certification",
    titleAr: "شهادة التغذية الرياضية",
    category: "nutrition",
    categoryAr: "التغذية",
    sport: "fitness",
    mode: "Online",
    level: "Professional",
    startDate: "2026-08-01",
    endDate: "2026-11-15",
    duration: "15 Weeks · Self-Paced + Live Q&A",
    durationAr: "١٥ أسبوع · ذاتي + جلسات مباشرة",
    schedule: "Live Q&A · Sundays 7:00pm",
    scheduleAr: "جلسات مباشرة · الأحد ٧م",
    venue: "Online · Live Zoom + Portal",
    venueAr: "عبر الإنترنت · زووم والبوابة",
    price: 2499,
    seatsLeft: 22,
    totalSeats: 50,
    rating: 4.9,
    reviewsCount: 210,
    instructor: {
      name: "Dr. Amara Okoye",
      nameAr: "د. أمارا أوكوي",
      title: "Registered Dietitian · IOC Diploma",
      titleAr: "أخصائية تغذية معتمدة",
      certs: ["RD", "IOC Diploma", "PhD Nutrition"],
      experience: "Elite athlete nutrition programs since 2011.",
    },
    syllabus: [
      { week: "Module 1", topic: "Macros & Energy Systems", topicAr: "الطاقة والعناصر الكبرى", details: "Fuel demands by sport and phase." },
      { week: "Module 2", topic: "Hydration Science", topicAr: "علم الترطيب", details: "Sweat testing, electrolytes, and heat protocols." },
      { week: "Module 3", topic: "Peri-Workout Fueling", topicAr: "التغذية حول التمرين", details: "Pre / intra / post windows for adaptation." },
      { week: "Module 4", topic: "Youth Athlete Nutrition", topicAr: "تغذية الناشئين", details: "Growth-aware planning and family-friendly meals." },
      { week: "Module 5", topic: "Case Studies & Cert Exam", topicAr: "دراسات حالة والاختبار", details: "Real athlete plans and final assessment." },
    ],
    reviews: [
      { name: "Jordan B.", rating: 5, quote: "The best online cert I've done. Dr. Amara's case studies were gold." },
    ],
    gradient: "from-[var(--lime)] to-[var(--aqua-glow)]",
  },
  {
    id: "c5",
    title: "Volleyball Approach & Attack Clinic",
    titleAr: "عيادة الاقتراب والهجوم في الكرة الطائرة",
    category: "volleyball",
    categoryAr: "الكرة الطائرة",
    sport: "volleyball",
    mode: "Offline",
    level: "Intermediate",
    startDate: "2026-08-15",
    endDate: "2026-09-19",
    duration: "5 Weeks · 10 Sessions",
    durationAr: "٥ أسابيع · ١٠ جلسات",
    schedule: "Sat & Tue · 5:00pm–7:00pm",
    scheduleAr: "السبت والثلاثاء · ٥م–٧م",
    venue: "West City Branch · Indoor Court",
    venueAr: "فرع غرب المدينة · صالة مغلقة",
    price: 999,
    seatsLeft: 3,
    totalSeats: 12,
    rating: 4.6,
    reviewsCount: 42,
    instructor: {
      name: "Coach Ella Rossi",
      nameAr: "المدربة إيلا روسي",
      title: "National Team Assistant · CEV Level 3",
      titleAr: "مساعدة المنتخب الوطني",
      certs: ["CEV L3", "AVP Cert"],
      experience: "8 years pro beach + 5 years coaching.",
    },
    syllabus: [
      { week: "Week 1", topic: "Approach Footwork", topicAr: "خطوات الاقتراب", details: "3-step and 4-step patterns with tempo drills." },
      { week: "Week 2", topic: "Arm Swing Mechanics", topicAr: "ميكانيكا الذراع", details: "Bow-and-arrow load and contact point." },
      { week: "Week 3", topic: "Reading the Set", topicAr: "قراءة التمريرة", details: "Timing on quicks, slides, and back-row attacks." },
      { week: "Week 4", topic: "Shot Selection", topicAr: "اختيار الضربة", details: "Line, cross, tip, and roll under a real block." },
      { week: "Week 5", topic: "Game-Speed Integration", topicAr: "التطبيق بسرعة المباراة", details: "Full-court scrimmages with feedback." },
    ],
    reviews: [
      { name: "Noah K.", rating: 5, quote: "My vertical didn't change but my kill % doubled. Timing is everything." },
    ],
    gradient: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    id: "c6",
    title: "Strength & Conditioning for Youth Athletes",
    titleAr: "القوة والإعداد للناشئين",
    category: "fitness",
    categoryAr: "اللياقة",
    sport: "fitness",
    mode: "Hybrid",
    level: "Beginner",
    startDate: "2026-08-05",
    endDate: "2026-09-16",
    duration: "6 Weeks · 12 Sessions",
    durationAr: "٦ أسابيع · ١٢ جلسة",
    schedule: "Mon & Thu · 4:00pm–5:30pm",
    scheduleAr: "الاثنين والخميس · ٤م–٥:٣٠م",
    venue: "Main Branch · Strength Lab + Portal",
    venueAr: "الفرع الرئيسي · معمل القوة",
    price: 899,
    seatsLeft: 11,
    totalSeats: 24,
    rating: 4.8,
    reviewsCount: 63,
    instructor: {
      name: "Coach Marcus Feld",
      nameAr: "الكابتن ماركوس فيلد",
      title: "Technical Director · NSCA CSCS",
      titleAr: "المدير الفني للأكاديمية",
      certs: ["CSCS", "USAW L1", "FMS L2"],
      experience: "Youth pathways lead across five sports.",
    },
    syllabus: [
      { week: "Week 1", topic: "Movement Screening", topicAr: "فحص الحركة", details: "FMS baseline and mobility corrections." },
      { week: "Week 2", topic: "Foundational Lifts", topicAr: "الرفعات الأساسية", details: "Squat, hinge, push, pull — age-appropriate loading." },
      { week: "Week 3", topic: "Speed & Agility", topicAr: "السرعة والرشاقة", details: "Acceleration mechanics and change-of-direction drills." },
      { week: "Week 4", topic: "Power Development", topicAr: "تطوير القدرة", details: "Med-ball, jump, and light Olympic derivatives." },
      { week: "Week 5", topic: "Sport Integration", topicAr: "دمج مع الرياضة", details: "Transferring gym gains to court/pool performance." },
      { week: "Week 6", topic: "Testing & Reassessment", topicAr: "الاختبار وإعادة التقييم", details: "Retest baselines and set next-cycle goals." },
    ],
    reviews: [
      { name: "Ella R.", rating: 5, quote: "My daughter loves it and has never moved better. Great structure." },
    ],
    gradient: "from-[var(--lime)] to-[var(--aqua-glow)]",
    featured: true,
  },
];
