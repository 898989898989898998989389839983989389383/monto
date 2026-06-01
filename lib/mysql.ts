import dotenv from "dotenv";
import { Pool, type PoolClient, type QueryResult } from "pg";

dotenv.config();

export type RowDataPacket = Record<string, any>;

export type PoolConnection = {
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  query: <T extends RowDataPacket = RowDataPacket>(sql: string, params?: unknown[]) => Promise<[T[]]>;
  execute: (sql: string, params?: unknown[]) => Promise<[QueryResult]>;
  release: () => void;
};

type SeedCourse = {
  id: string;
  title: string;
  lessons: number;
  image: string;
  description?: string;
  price: number;
  oldPrice: number;
  type: "free" | "premium";
  category: string;
  access_code?: string;
};

type SeedLesson = {
  id: string;
  course_id: string;
  title: string;
  duration: string;
  note_content: string;
  note_url: string;
  video_url: string;
  thumbnail_url?: string;
};

type SeedNote = {
  id: string;
  title: string;
  lessons: number;
  category: string;
  type: "free" | "premium";
  url: string;
  content: string;
};

type SeedQuiz = {
  id: string;
  topic: string;
  type: "free" | "premium";
};

type SeedQuestion = {
  id: string;
  quiz_id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image_url?: string;
};

type SeedSlider = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  sort_order: number;
  is_active: number;
};

type SeedLiveClass = {
  id: string;
  title: string;
  description: string;
  meeting_url: string;
  scheduled_at: string;
  access_type: "free" | "premium";
  audience_type: "all" | "course" | "selected";
  course_id?: string;
  selected_user_ids: string;
  is_active: boolean;
};

const seedCourses: SeedCourse[] = [
  {
    id: "5",
    title: "NEB Chemistry: Organic Chemistry",
    lessons: 120,
    image: "https://images.unsplash.com/photo-1532187875605-1ef6c237ddc4?auto=format&fit=crop&w=800&q=80",
    price: 100,
    oldPrice: 4999,
    type: "premium",
    category: "Chemistry",
  },
  {
    id: "7",
    title: "Full Chemistry Course",
    lessons: 10,
    image: "https://images.unsplash.com/photo-1532634993-15f421e42ec0?auto=format&fit=crop&w=800&q=80",
    price: 999,
    oldPrice: 2999,
    type: "premium",
    category: "Chemistry",
  },
  {
    id: "11",
    title: "Chemistry 2.0",
    lessons: 96,
    image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80",
    price: 6999,
    oldPrice: 19999,
    type: "premium",
    category: "Chemistry",
  },
  {
    id: "21",
    title: "Chemistry Crash Course 30 Days",
    lessons: 3,
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    price: 999,
    oldPrice: 2999,
    type: "premium",
    category: "Chemistry",
  },
  {
    id: "22",
    title: "Physical Chemistry Problem Solving",
    lessons: 3,
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    price: 2999,
    oldPrice: 7999,
    type: "premium",
    category: "Chemistry",
  },
  {
    id: "23",
    title: "Inorganic Chemistry Revision Batch",
    lessons: 3,
    image: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=800&q=80",
    price: 1999,
    oldPrice: 5999,
    type: "premium",
    category: "Chemistry",
  },
];

const fullChemistryCoursePlaylistLessons: SeedLesson[] = [
  {
    id: "playlist-ygfWkUUe_mw",
    course_id: "7",
    title: "Prepare smarter for NEB Chemistry with Monto!",
    duration: "57:30",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/ygfWkUUe_mw",
  },
  {
    id: "playlist-ctvAG2m0eck",
    course_id: "7",
    title: "Prepare smarter for NEB Chemistry with Monto!",
    duration: "34:41",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/ctvAG2m0eck",
  },
  {
    id: "playlist-dJN_zde16e0",
    course_id: "7",
    title: "Prepare smarter for NEB Chemistry with Monto!",
    duration: "56:25",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/dJN_zde16e0",
  },
  {
    id: "playlist-Go11beHIcDc",
    course_id: "7",
    title: "Monto Chemistry important questions solving for NEB students",
    duration: "56:10",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/Go11beHIcDc",
  },
  {
    id: "playlist-M-BNETidn8o",
    course_id: "7",
    title: "Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto",
    duration: "1:02:22",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/M-BNETidn8o",
  },
  {
    id: "playlist-l8f4e1_tWhE",
    course_id: "7",
    title: "First Part Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto |",
    duration: "22:00",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/l8f4e1_tWhE",
  },
  {
    id: "playlist-HOomRqoQi6g",
    course_id: "7",
    title: "Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto |Saral Shikshya Academy",
    duration: "1:16:08",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/HOomRqoQi6g",
  },
  {
    id: "playlist-fgJAyaWlUT8",
    course_id: "7",
    title: "Chemistry Class | Ravi Bhushan Sharma",
    duration: "1:06:19",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/fgJAyaWlUT8",
  },
  {
    id: "playlist-zE0JXXvbhP4",
    course_id: "7",
    title: "Chemistry Class | Ravi Bhushan Sharma",
    duration: "1:12:21",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/zE0JXXvbhP4",
  },
  {
    id: "playlist-hl2Q3Rhlq_0",
    course_id: "7",
    title: "Aldehydes, Ketones and Carboxylic Acid | Grade 12 | NEB | Saral Shikshya",
    duration: "5:40",
    note_content: "NEB Chemistry playlist lesson from Saral Shikshya Academy.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/hl2Q3Rhlq_0",
  },
];

const seedLessons: SeedLesson[] = [
  {
    id: "l6",
    course_id: "7",
    title: "Atomic Structure Basics",
    duration: "19:20",
    note_content: "Study subatomic particles, atomic number, mass number, isotopes, and electronic configuration.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/QoU8R9PHN5c",
  },
  {
    id: "l7",
    course_id: "7",
    title: "Periodic Table and Trends",
    duration: "23:10",
    note_content: "Learn groups, periods, valency, atomic radius, electronegativity, and metallic character trends.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/0RRVV4Diomg",
  },
  {
    id: "l8",
    course_id: "7",
    title: "Acids, Bases and Salts",
    duration: "21:45",
    note_content: "Understand pH scale, indicators, neutralization, common salts, and daily-life applications.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/9s3sW0nG3hE",
  },
  {
    id: "l18",
    course_id: "11",
    title: "Organic Chemistry Masterclass",
    duration: "32:15",
    note_content: "Advanced coverage of hydrocarbons, functional groups, nomenclature, and reaction pathways.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/4ZBs5JxQY3Y",
  },
  {
    id: "l19",
    course_id: "11",
    title: "Electrochemistry Deep Dive",
    duration: "29:50",
    note_content: "Detailed study of redox reactions, electrolysis, cells, and electrode potentials.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/5s25Pq9Wj3M",
  },
  {
    id: "l20",
    course_id: "11",
    title: "Numerical Chemistry Practice",
    duration: "27:20",
    note_content: "Practice session focused on mole concept, concentration, stoichiometry, and gas law numericals.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/Gyd3C6l2NJE",
  },
  {
    id: "l21",
    course_id: "21",
    title: "Mole Concept in One Shot",
    duration: "18:40",
    note_content: "Quick revision of mole concept, molar mass, Avogadro number, and unit conversions for rapid practice.",
    note_url: "",
    video_url: "https://www.youtube.com/watch?v=VbfpW0pbvaU",
  },
  {
    id: "l22",
    course_id: "21",
    title: "Chemical Bonding Revision",
    duration: "22:15",
    note_content: "Covers ionic, covalent, coordinate bonding, VSEPR basics, and common board-style examples.",
    note_url: "",
    video_url: "https://youtu.be/e3l1UD4ZaY8",
  },
  {
    id: "l23",
    course_id: "21",
    title: "Thermodynamics Fast Track",
    duration: "20:05",
    note_content: "High-speed walkthrough of system-surroundings, enthalpy, internal energy, and first law numericals.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/k0M4l6Q8DWI",
  },
  {
    id: "l24",
    course_id: "22",
    title: "Gas Laws Numericals",
    duration: "26:30",
    note_content: "Practice ideal gas equation, Boyle's law, Charles' law, and mixed formula questions with shortcuts.",
    note_url: "",
    video_url: "https://www.youtube.com/watch?v=1Vd8dV2x0hM",
  },
  {
    id: "l25",
    course_id: "22",
    title: "Chemical Equilibrium Problems",
    duration: "24:10",
    note_content: "Step-by-step equilibrium constant, Le Chatelier principle, and concentration-based problem solving.",
    note_url: "",
    video_url: "https://youtu.be/6x0sVqN6WbI",
  },
  {
    id: "l26",
    course_id: "22",
    title: "Electrochemistry Numericals Marathon",
    duration: "28:20",
    note_content: "Focused practice on electrodes, cell notation, Nernst equation, and common entrance-style numericals.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/vl4sQ9xW8XQ",
  },
  {
    id: "l27",
    course_id: "23",
    title: "Periodic Table Super Revision",
    duration: "17:55",
    note_content: "Fast revision of periodic trends, blocks, atomic size, ionization enthalpy, and metallic character.",
    note_url: "",
    video_url: "https://www.youtube.com/watch?v=rz4Dd1I_fX0",
  },
  {
    id: "l28",
    course_id: "23",
    title: "Coordination Compounds Basics",
    duration: "21:35",
    note_content: "Introductory lesson on ligands, coordination number, nomenclature, and isomerism in complexes.",
    note_url: "",
    video_url: "https://youtu.be/0iMtlus-aFo",
  },
  {
    id: "l29",
    course_id: "23",
    title: "d and f Block Revision Session",
    duration: "23:50",
    note_content: "Revision of transition elements, oxidation states, color, magnetic behavior, and lanthanoid trends.",
    note_url: "",
    video_url: "https://www.youtube.com/embed/XVn7C8wF8Yw",
  },
  ...fullChemistryCoursePlaylistLessons,
];

const seedNotes: SeedNote[] = [];

const driveClass12Notes: SeedNote[] = [
  {
    id: "drive-pdf-16jkJ-nobOf3YmRPGre9UW8a700xpCVSb",
    title: "CHEMISTRY IN SERVICE TO MANKIND.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Applied",
    type: "free",
    url: "https://drive.google.com/file/d/16jkJ-nobOf3YmRPGre9UW8a700xpCVSb/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/applied",
  },
  {
    id: "drive-pdf-1pcmLpVKHIfF0IOe_c3JUfZ4Gv8YRQLQ4",
    title: "iron.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/1pcmLpVKHIfF0IOe_c3JUfZ4Gv8YRQLQ4/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-1kQEmyofO6C1O2BCVb_Y7cIuIISPeOUIm",
    title: "mercury 2.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/1kQEmyofO6C1O2BCVb_Y7cIuIISPeOUIm/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-1bSHWids8BdbhU896ZqRAdbkJtMBQnOFA",
    title: "silver2.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/1bSHWids8BdbhU896ZqRAdbkJtMBQnOFA/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-1JX4aLiZKLA0UTTUg0JsewMxJl8q_4aQN",
    title: "transition metal.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/1JX4aLiZKLA0UTTUg0JsewMxJl8q_4aQN/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-1stp4Tw7ayzG33QT3bl1uxG-X5qtESmwN",
    title: "TRANSITION METALS (2) (1).pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/1stp4Tw7ayzG33QT3bl1uxG-X5qtESmwN/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-19_IieZOubLYMmRRi3MUHQin2YU4O5Wwd",
    title: "ZINC.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Inorganic",
    type: "free",
    url: "https://drive.google.com/file/d/19_IieZOubLYMmRRi3MUHQin2YU4O5Wwd/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/inorganic 12",
  },
  {
    id: "drive-pdf-1k86d9V3bglk1NuqxNf8E8YMwSrSc7r55",
    title: "amine.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1k86d9V3bglk1NuqxNf8E8YMwSrSc7r55/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1Sfhmn23VI7OaViDU4cox2l4LOiMjtni7",
    title: "aniline.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1Sfhmn23VI7OaViDU4cox2l4LOiMjtni7/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1oHyKpRla7QVnRHFSG1zB5XozFhdWWlKm",
    title: "ether.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1oHyKpRla7QVnRHFSG1zB5XozFhdWWlKm/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1vDMUGHXc8iFIdtIOapMEgdB5npnZLBY-",
    title: "Grignard reagent.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1vDMUGHXc8iFIdtIOapMEgdB5npnZLBY-/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1Z6cAsmf3bL58N8Kye3Qx_PGm-wzba6nS",
    title: "nitro compound.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1Z6cAsmf3bL58N8Kye3Qx_PGm-wzba6nS/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1VmNOjre9MLEUVIsjiM6h9BdZS02DuP_j",
    title: "nitrobenzene.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Organic",
    type: "free",
    url: "https://drive.google.com/file/d/1VmNOjre9MLEUVIsjiM6h9BdZS02DuP_j/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/organic 12",
  },
  {
    id: "drive-pdf-1kyufvKKFFEcW6h44Ykd0BINCBptSrilw",
    title: "IONIC EQUILIBRIUM (new curriculum).pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Physical",
    type: "free",
    url: "https://drive.google.com/file/d/1kyufvKKFFEcW6h44Ykd0BINCBptSrilw/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/Physical 12/Ionic equilibrium (new curriculum)",
  },
  {
    id: "drive-pdf-1d_Nx5GABXXZAfKI9ZG0meFIfMrWMdDcy",
    title: "VOLUMETRIC ANALYSIS Theory.pdf",
    lessons: 1,
    category: "Chemistry - Class 12 Physical",
    type: "free",
    url: "https://drive.google.com/file/d/1d_Nx5GABXXZAfKI9ZG0meFIfMrWMdDcy/view?usp=drive_web",
    content: "PDF note from Drive path: class 12/Physical 12/Volumetric Analysis Theory",
  },
];

const seedQuizzes: SeedQuiz[] = [
  { id: "q1", topic: "Chemistry", type: "free" },
];

const seedQuestions: SeedQuestion[] = [
  {
    id: "qn1",
    quiz_id: "q1",
    text: "Which of the following is a decomposition reaction?",
    options: ["H2 + O2 -> H2O", "CaCO3 -> CaO + CO2", "Zn + HCl -> ZnCl2 + H2", "NaOH + HCl -> NaCl + H2O"],
    correctAnswer: 1,
    explanation: "Decomposition reaction is a reaction in which a single reactant breaks down into two or more products. CaCO3 -> CaO + CO2 is a classic example.",
  },
  {
    id: "qn2",
    quiz_id: "q1",
    text: "What is the pH of a neutral solution?",
    options: ["0", "14", "7", "1"],
    correctAnswer: 2,
    explanation: "A neutral solution has a pH of 7. Values below 7 are acidic, and values above 7 are basic.",
  },
  {
    id: "qn3",
    quiz_id: "q1",
    text: "Which gas is evolved when zinc reacts with dilute sulphuric acid?",
    options: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"],
    correctAnswer: 1,
    explanation: "Zinc reacts with sulphuric acid to produce zinc sulphate and hydrogen gas (Zn + H2SO4 -> ZnSO4 + H2).",
  },
];

const nebChemistryChapters = [
  {
    slug: "applied",
    title: "Chemistry in Service to Mankind",
    branch: "Applied Chemistry",
    facts: [
      ["analgesics", "reduce pain without causing loss of consciousness", "antibiotics", "antacids", "fertilizers"],
      ["antacids", "neutralize excess acid in the stomach", "detergents", "dyes", "polymers"],
      ["fertilizers", "supply essential plant nutrients", "analgesics", "disinfectants", "antipyretics"],
      ["disinfectants", "kill microorganisms on non-living surfaces", "antibiotics", "vitamins", "antacids"],
      ["food preservatives", "slow microbial growth and oxidation in food", "explosives", "dyes", "fuels"],
    ],
  },
  {
    slug: "iron",
    title: "Iron",
    branch: "Inorganic Chemistry",
    facts: [
      ["haematite", "is the chief ore of iron", "bauxite", "cinnabar", "argentite"],
      ["limestone", "acts as a flux in iron extraction", "coke", "slag", "haematite"],
      ["coke", "reduces iron oxide and supplies heat", "limestone", "silica", "slag"],
      ["slag", "removes earthy impurities during smelting", "pig iron", "wrought iron", "cast iron"],
      ["rusting", "is corrosion of iron in moist air", "galvanization", "alloying", "annealing"],
    ],
  },
  {
    slug: "mercury",
    title: "Mercury",
    branch: "Inorganic Chemistry",
    facts: [
      ["cinnabar", "is the chief ore of mercury", "haematite", "bauxite", "galena"],
      ["mercury", "is liquid at ordinary room temperature", "zinc", "silver", "iron"],
      ["amalgam", "is an alloy of mercury with another metal", "slag", "flux", "ore"],
      ["HgS", "is roasted to obtain mercury", "HgCl2", "HgO", "HgSO4"],
      ["mercury barometer", "uses high density of mercury", "low melting point", "magnetism", "brittleness"],
    ],
  },
  {
    slug: "silver",
    title: "Silver",
    branch: "Inorganic Chemistry",
    facts: [
      ["argentite", "is the important ore of silver", "cinnabar", "haematite", "calamine"],
      ["cyanide process", "is used for extraction of silver", "Hall process", "Contact process", "Solvay process"],
      ["silver nitrate", "is used as a laboratory reagent for halides", "silver oxide", "silver chloride", "silver sulphide"],
      ["AgCl", "is a white precipitate formed with chloride ion", "AgBr", "AgI", "Ag2S"],
      ["tarnishing", "occurs due to formation of silver sulphide", "silver nitrate", "silver oxide", "silver carbonate"],
    ],
  },
  {
    slug: "transition-metals",
    title: "Transition Metals",
    branch: "Inorganic Chemistry",
    facts: [
      ["variable oxidation states", "are shown due to participation of d and s electrons", "complete octet", "large atomic size", "low density"],
      ["colored compounds", "often arise from d-d electronic transitions", "s-s transition", "p-p transition", "nuclear transition"],
      ["catalytic activity", "is common due to variable oxidation states and surface adsorption", "low melting point", "non-metallic nature", "no vacant orbitals"],
      ["complex formation", "is favored by small size and vacant d orbitals", "large radius only", "no charge", "closed shell only"],
      ["paramagnetism", "is due to unpaired electrons", "paired electrons only", "low density", "ionic radius"],
    ],
  },
  {
    slug: "zinc",
    title: "Zinc",
    branch: "Inorganic Chemistry",
    facts: [
      ["zinc blende", "is an important ore of zinc", "cinnabar", "argentite", "haematite"],
      ["roasting", "converts zinc sulphide into zinc oxide", "zinc oxide into zinc sulphide", "zinc into zinc carbonate", "zinc chloride into zinc"],
      ["galvanization", "protects iron by coating it with zinc", "coating with tin", "heating with carbon", "adding mercury"],
      ["ZnO", "is amphoteric in nature", "strongly acidic only", "strongly basic only", "neutral only"],
      ["brass", "is an alloy of copper and zinc", "iron and carbon", "silver and mercury", "lead and tin"],
    ],
  },
  {
    slug: "amine",
    title: "Amines",
    branch: "Organic Chemistry",
    facts: [
      ["amines", "are organic derivatives of ammonia", "water", "methane", "benzene"],
      ["basicity of amines", "is due to lone pair on nitrogen", "pi bond on oxygen", "absence of electrons", "metallic bonding"],
      ["primary amine", "contains one alkyl or aryl group attached to nitrogen", "two alkyl groups", "three alkyl groups", "no alkyl group"],
      ["carbylamine test", "is given by primary amines", "secondary amines", "tertiary amines", "amides only"],
      ["aniline", "is an aromatic amine", "aliphatic alcohol", "ketone", "ether"],
    ],
  },
  {
    slug: "aniline",
    title: "Aniline",
    branch: "Organic Chemistry",
    facts: [
      ["aniline", "is less basic than methylamine", "more basic than methylamine", "neutral like benzene", "strong acid"],
      ["diazotization", "converts aniline into benzene diazonium chloride at low temperature", "aniline into phenol directly at room temperature", "benzene into aniline", "amine into amide"],
      ["bromination of aniline", "gives 2,4,6-tribromoaniline in water", "nitrobenzene", "benzoic acid", "benzaldehyde"],
      ["acetylation", "protects the amino group in aniline", "destroys benzene ring", "forms alcohol", "forms ether only"],
      ["azo dye", "is formed by coupling diazonium salt with phenol or aniline", "oxidation of alkane", "reduction of ester", "polymerization of ethene"],
    ],
  },
  {
    slug: "ether",
    title: "Ethers",
    branch: "Organic Chemistry",
    facts: [
      ["ether", "has R-O-R functional group", "R-COOH", "R-CHO", "R-NH2"],
      ["Williamson synthesis", "prepares ether from alkoxide and alkyl halide", "acid and base", "alkene and water", "aldehyde and hydrogen"],
      ["diethyl ether", "is comparatively less reactive due to absence of active hydrogen", "strongly acidic", "highly ionic", "metallic"],
      ["cleavage by HI", "breaks ether into alcohol and alkyl iodide", "forms ester only", "forms amide", "forms salt only"],
      ["anisole", "is methoxybenzene", "ethoxyethane", "phenol", "benzaldehyde"],
    ],
  },
  {
    slug: "grignard",
    title: "Grignard Reagent",
    branch: "Organic Chemistry",
    facts: [
      ["Grignard reagent", "has general formula RMgX", "RX", "ROH", "RCOOH"],
      ["dry ether", "is used as solvent for Grignard reagent", "water", "ethanol", "aqueous acid"],
      ["Grignard reagent with formaldehyde", "gives primary alcohol after hydrolysis", "secondary alcohol", "tertiary alcohol", "carboxylic acid only"],
      ["Grignard reagent", "is destroyed by moisture", "is stable in water", "requires sunlight", "is a weak acid"],
      ["carbon dioxide reaction", "gives carboxylic acid after acidic hydrolysis", "amine", "ether", "alkane only"],
    ],
  },
  {
    slug: "nitro-compound",
    title: "Nitro Compounds",
    branch: "Organic Chemistry",
    facts: [
      ["nitro group", "is represented by -NO2", "-NH2", "-OH", "-CHO"],
      ["reduction of nitrobenzene", "can produce aniline", "phenol", "toluene", "benzoic acid"],
      ["nitration", "introduces nitro group using nitric acid and sulphuric acid", "removes nitro group", "adds chlorine only", "adds hydrogen only"],
      ["nitroalkanes", "show acidic character due to alpha hydrogen", "lack of nitrogen", "metallic nature", "only ionic bonding"],
      ["aromatic nitro compounds", "are deactivating and meta-directing", "activating ortho-para directing", "neutral directing", "strongly basic directing"],
    ],
  },
  {
    slug: "nitrobenzene",
    title: "Nitrobenzene",
    branch: "Organic Chemistry",
    facts: [
      ["nitrobenzene", "is obtained by nitration of benzene", "hydrolysis of benzene", "oxidation of phenol", "reduction of aniline"],
      ["nitro group in nitrobenzene", "is meta directing", "ortho directing only", "para directing only", "no directing effect"],
      ["reduction of nitrobenzene", "gives aniline under suitable conditions", "benzaldehyde", "benzoic acid", "phenol only"],
      ["nitrobenzene", "is used in manufacture of aniline", "manufacture of sodium carbonate", "production of oxygen", "extraction of iron"],
      ["mixed acid", "means concentrated nitric acid and concentrated sulphuric acid", "HCl and HNO3", "NaOH and HCl", "ethanol and water"],
    ],
  },
  {
    slug: "ionic-equilibrium",
    title: "Ionic Equilibrium",
    branch: "Physical Chemistry",
    facts: [
      ["pH", "is negative logarithm of hydrogen ion concentration", "positive logarithm of hydroxide ion", "mass by volume", "moles by mass"],
      ["buffer solution", "resists change in pH on dilution or addition of small acid/base", "changes pH rapidly", "contains only water", "contains no ions"],
      ["common ion effect", "suppresses ionization of a weak electrolyte", "increases ionization always", "removes ions completely", "causes combustion"],
      ["solubility product", "is product of ionic concentrations in saturated solution", "sum of masses", "ratio of volumes", "product of gases only"],
      ["acidic buffer", "contains weak acid and its salt with strong base", "strong acid only", "weak base only", "salt of strong acid only"],
    ],
  },
  {
    slug: "volumetric-analysis",
    title: "Volumetric Analysis",
    branch: "Physical Chemistry",
    facts: [
      ["standard solution", "has accurately known concentration", "unknown concentration", "no solute", "only solvent"],
      ["end point", "is indicated by color change of indicator", "start of titration", "boiling point", "freezing point"],
      ["molarity", "is moles of solute per litre of solution", "mass per kg solvent", "moles per kg solvent", "volume per mole"],
      ["primary standard", "must be pure, stable and have high molar mass", "must be volatile", "must be hygroscopic", "must decompose quickly"],
      ["phenolphthalein", "is commonly used in acid-base titration", "redox only", "precipitation only", "complexometric only"],
    ],
  },
  {
    slug: "transition-revision",
    title: "Transition Metals Revision",
    branch: "Inorganic Chemistry",
    facts: [
      ["lanthanoid contraction", "is due to poor shielding by 4f electrons", "excellent shielding by s electrons", "loss of protons", "increase of neutrons only"],
      ["coordination number", "is number of donor atoms attached to central metal ion", "charge on ligand", "mass number", "atomic number"],
      ["ligand", "donates electron pair to central metal ion", "accepts proton only", "removes neutron", "forms only covalent gas"],
      ["oxidation state", "represents apparent charge on an atom in compound", "atomic mass", "molecular mass", "density"],
      ["d-block elements", "have differentiating electron entering d-subshell", "s-subshell", "p-subshell", "f-subshell only"],
    ],
  },
];

const createNebChemistryQuestionBank = () => {
  const quizzes: SeedQuiz[] = nebChemistryChapters.map((chapter) => ({
    id: `neb12-${chapter.slug}`,
    topic: `Chemistry Class 12 NEB - ${chapter.title}`,
    type: "free",
  }));
  const stems = [
    "In Class 12 NEB Chemistry, which statement about {term} is correct?",
    "Choose the best answer for {term} from {chapter}.",
    "Which option correctly explains {term}?",
    "For board-style preparation, {term} is best described as which of the following?",
    "Identify the correct concept related to {term}.",
  ];
  const questions: SeedQuestion[] = [];

  nebChemistryChapters.forEach((chapter, chapterIndex) => {
    for (let round = 0; round < 67; round += 1) {
      const fact = chapter.facts[round % chapter.facts.length];
      const stem = stems[(round + chapterIndex) % stems.length];
      const correctPosition = (round + chapterIndex) % 4;
      const distractors = fact.slice(2);
      const options = [...distractors];
      options.splice(correctPosition, 0, fact[1]);
      questions.push({
        id: `neb12-${chapter.slug}-q${String(round + 1).padStart(3, "0")}`,
        quiz_id: `neb12-${chapter.slug}`,
        text: `${stem.replace("{term}", fact[0]).replace("{chapter}", chapter.title)} (${chapter.branch}, set ${round + 1})`,
        options,
        correctAnswer: correctPosition,
        explanation: `${fact[0]} ${fact[1]}. This is a high-frequency NEB-style concept from ${chapter.title}, so focus on the definition, key reagent/property, and common board wording.`,
      });
    }
  });

  return { quizzes, questions };
};

const seedSliders: SeedSlider[] = [
  {
    id: "sl1",
    title: "Chemistry One Shot Video",
    subtitle: "Start fast with a focused chemistry one-shot session designed for quick revision.",
    image_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiqmdaP81MD5lfSQVNyUCJHE9FIrXTOfUWnKCTUFxE45Jx9QoEf3diojYpuDZggIrin3HGuPMTBSzn2lZmU4bz_u5tAaIxqVtZaqmrcLzOVUG4ZNDPl916cIR1XekUjbegMk2HeRWejq6SMpfJr5ontaQhhmlN1NJ7yZBClkbchUrH9-ZH9xhOGkixzVQ/s1600/oneshot%20video.png",
    sort_order: 1,
    is_active: 1,
  },
  {
    id: "sl2",
    title: "Organic Chemistry",
    subtitle: "Study reaction pathways, mechanisms, and named reactions with confidence.",
    image_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgwdYcwalrDhUUicjNzgFlihRBqyGSDR-6R-pzRt58tSxvGoFeBsvmcUV8VMx83zmnMeNne0R_LU0fjw5NLK1ryg-yVbzsWc0ye0h187vq09UR7Gph1PiHYeaggvkICuJ4fAzqk7KQqhd485SqYSKvhtxPfE7HLQBKCmUae9g3c0FIHYHW6e4_ur18X7Q/s1536/organic.png",
    sort_order: 2,
    is_active: 1,
  },
  {
    id: "sl3",
    title: "Inorganic Chemistry",
    subtitle: "Cover periodic trends, coordination compounds, and core inorganic concepts.",
    image_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgbaKHm45THr1QiQ4mfh6oBypp8tS3_F1lV_f2fwVwgnZp54S2Vm7ZT-ch5ZBshKsc7AtiwJwwhjoMc3CZYFR8SvULf4BBgSwkjvn_JVTtOrJcJTRmF4uCUy284SVMSazNsVTLPf4lWUVSwRWIwT9Y6q9RAN01AY_MwcMYV0nCAcDrXaSVUcQf66UcTQ/s1536/inorganic.png",
    sort_order: 3,
    is_active: 1,
  },
];

const seedLiveClasses: SeedLiveClass[] = [];
const removedDummyPremiumCourseIds = ["5", "7", "11", "21", "22", "23", "c1778073513478e4c7ae52", "c177807312799652cdba22"];

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

const adaptSql = (sql: string) => {
  let adapted = sql.replace(/`([^`]+)`/g, "\"$1\"");

  adapted = adapted.replace(/\boldPrice\b/g, "\"oldPrice\"");
  adapted = adapted.replace(/\bcorrectAnswer\b/g, "\"correctAnswer\"");

  let parameterIndex = 0;
  adapted = adapted.replace(/\?/g, () => `$${++parameterIndex}`);

  return adapted;
};

const normalizeRow = <T extends RowDataPacket>(row: RowDataPacket): T => {
  const normalized = {
    ...row,
    oldPrice: row.oldPrice ?? row.oldprice,
    correctAnswer: row.correctAnswer ?? row.correctanswer,
  };

  return normalized as unknown as T;
};

const normalizeRows = <T extends RowDataPacket>(rows: RowDataPacket[]) => rows.map((row) => normalizeRow<T>(row));

const getConnectionConfig = () => {
  const ssl =
    String(process.env.POSTGRES_SSL ?? "true").toLowerCase() === "false"
      ? false
      : { rejectUnauthorized: String(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED ?? "true").toLowerCase() !== "false" };

  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return {
      connectionString: url,
      ssl,
    };
  }

  const host = process.env.POSTGRES_HOST?.trim();
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const user = process.env.POSTGRES_USER?.trim();
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const database = process.env.POSTGRES_DATABASE?.trim();

  if (!host || !user || !database) {
    throw new Error("Postgres connection is not configured. Set DATABASE_URL or POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DATABASE.");
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl,
  };
};

export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      ...getConnectionConfig(),
      max: Number(process.env.POSTGRES_POOL_MAX || 1),
    });
    pool.on("error", (error) => {
      console.error("Unexpected idle Postgres connection error", error.message);
    });
  }

  return pool;
};

const runQuery = async <T extends RowDataPacket = RowDataPacket>(
  client: Pool | PoolClient,
  sql: string,
  params: unknown[] = [],
) => {
  const result = await client.query(adaptSql(sql), params);
  return normalizeRows<T>(result.rows as RowDataPacket[]);
};

const wrapClient = (client: PoolClient): PoolConnection => ({
  beginTransaction: async () => {
    await client.query("BEGIN");
  },
  commit: async () => {
    await client.query("COMMIT");
  },
  rollback: async () => {
    await client.query("ROLLBACK");
  },
  query: async <T extends RowDataPacket = RowDataPacket>(sql: string, params: unknown[] = []) => [await runQuery<T>(client, sql, params)],
  execute: async (sql: string, params: unknown[] = []) => [await client.query(adaptSql(sql), params)],
  release: () => {
    client.release();
  },
});

const seedRowsIfEmpty = async (
  client: Pool | PoolClient,
  table: string,
  rows: Record<string, unknown>[],
) => {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  const count = Number(result.rows[0]?.count || 0);
  if (count > 0 || rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((column) => {
    if (column === "oldPrice" || column === "correctAnswer") {
      return `"${column}"`;
    }
    return `"${column}"`;
  });

  for (const row of rows) {
    const values = columns.map((column) => row[column] ?? null);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO "${table}" (${quotedColumns.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  }
};

const upsertRows = async (
  client: Pool | PoolClient,
  table: string,
  rows: Record<string, unknown>[],
) => {
  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((column) => `"${column}"`);
  const updateColumns = columns.filter((column) => column !== "id");
  const updates = updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`);

  for (const row of rows) {
    const values = columns.map((column) => row[column] ?? null);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO "${table}" (${quotedColumns.join(", ")}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updates.join(", ")}`,
      values,
    );
  }
};

const insertRowsIfMissing = async (
  client: Pool | PoolClient,
  table: string,
  rows: Record<string, unknown>[],
) => {
  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((column) => `"${column}"`);

  for (const row of rows) {
    const values = columns.map((column) => row[column] ?? null);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO "${table}" (${quotedColumns.join(", ")}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`,
      values,
    );
  }
};

const upsertRowsInBatches = async (
  client: Pool | PoolClient,
  table: string,
  rows: Record<string, unknown>[],
  batchSize = 100,
) => {
  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map((column) => `"${column}"`);
  const updateColumns = columns.filter((column) => column !== "id");
  const updates = updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`);

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const values = batch.flatMap((row) => columns.map((column) => row[column] ?? null));
    const rowPlaceholders = batch.map((_, rowIndex) => {
      const offset = rowIndex * columns.length;
      const placeholders = columns.map((__, columnIndex) => `$${offset + columnIndex + 1}`);
      return `(${placeholders.join(", ")})`;
    });
    await client.query(
      `INSERT INTO "${table}" (${quotedColumns.join(", ")}) VALUES ${rowPlaceholders.join(", ")} ON CONFLICT ("id") DO UPDATE SET ${updates.join(", ")}`,
      values,
    );
  }
};

const createSchema = async (client: Pool | PoolClient) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT,
      lessons INTEGER DEFAULT 0,
      image TEXT,
      description TEXT DEFAULT '',
      price INTEGER DEFAULT 0,
      "oldPrice" INTEGER DEFAULT 0,
      type TEXT,
      category TEXT,
      access_code TEXT DEFAULT ''
    )
  `);
  await client.query(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT ''`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT,
      duration TEXT,
      note_content TEXT,
      note_url TEXT,
      video_url TEXT,
      thumbnail_url TEXT DEFAULT '',
      download_url TEXT DEFAULT '',
      download_label TEXT DEFAULT '',
      download_enabled BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await client.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0`);
  await client.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "download_url" TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "download_label" TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "download_enabled" BOOLEAN DEFAULT TRUE`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      lessons INTEGER DEFAULT 0,
      category TEXT,
      type TEXT DEFAULT 'free',
      url TEXT,
      content TEXT
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      class_level TEXT DEFAULT 'class-12',
      status TEXT DEFAULT 'active',
      user_category TEXT DEFAULT 'free',
      device_id TEXT DEFAULT '',
      device_label TEXT DEFAULT '',
      device_bound_at TIMESTAMPTZ
    )
  `);

  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS class_level TEXT DEFAULT 'class-12'`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS user_category TEXT DEFAULT 'free'`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_label TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_bound_at TIMESTAMPTZ`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS auth_otps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS payload TEXT DEFAULT '{}'`);
  await client.query(`ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ`);
  await client.query(`ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0`);
  await client.query(`ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(role, username)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      topic TEXT,
      type TEXT DEFAULT 'free'
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sliders (
      id TEXT PRIMARY KEY,
      title TEXT,
      subtitle TEXT,
      image_url TEXT,
      drive_file_id TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await client.query(`ALTER TABLE "sliders" ADD COLUMN IF NOT EXISTS "drive_file_id" TEXT DEFAULT ''`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      device_id TEXT DEFAULT '',
      device_label TEXT DEFAULT '',
      platform TEXT DEFAULT 'android',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL`);
  await client.query(`ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS device_label TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'android'`);
  await client.query(`ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW()`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      audience TEXT DEFAULT 'all',
      screen TEXT DEFAULT 'home',
      target_user_ids TEXT DEFAULT '[]',
      total_devices INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      credential_missing BOOLEAN DEFAULT FALSE,
      errors TEXT DEFAULT '[]',
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS target_user_ids TEXT DEFAULT '[]'`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS total_devices INTEGER DEFAULT 0`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS credential_missing BOOLEAN DEFAULT FALSE`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS errors TEXT DEFAULT '[]'`);
  await client.query(`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW()`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
      text TEXT,
      options TEXT,
      "correctAnswer" INTEGER DEFAULT 0,
      explanation TEXT,
      image_url TEXT
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      access_code TEXT,
      granted_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      status TEXT DEFAULT 'active',
      UNIQUE(user_id, course_id)
    )
  `);
  await client.query(`ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ`);
  await client.query(`ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active'`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS live_classes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      meeting_url TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ,
      access_type TEXT DEFAULT 'free',
      audience_type TEXT DEFAULT 'all',
      course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
      selected_user_ids TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT ''`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMPTZ`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "access_type" TEXT DEFAULT 'free'`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "audience_type" TEXT DEFAULT 'all'`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "course_id" TEXT REFERENCES courses(id) ON DELETE SET NULL`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "selected_user_ids" TEXT DEFAULT '[]'`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE`);
  await client.query(`ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW()`);
  await client.query(`
    UPDATE "live_classes"
    SET "course_id" = NULL
    WHERE NULLIF(TRIM(COALESCE("course_id", '')), '') IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM "courses" WHERE "courses"."id" = "live_classes"."course_id"
      )
  `);

  await client.query(`
    UPDATE users
    SET user_category = CASE
      WHEN EXISTS (
        SELECT 1
        FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = users.id
          AND COALESCE(e.status, 'active') = 'active'
          AND (e.expires_at IS NULL OR e.expires_at > CURRENT_TIMESTAMP)
          AND LOWER(COALESCE(c.type, 'free')) = 'premium'
      ) THEN 'premium'
      ELSE 'free'
    END
  `);
};

const seedDatabase = async (client: Pool | PoolClient) => {
  const nebQuestionBank = createNebChemistryQuestionBank();
  await client.query(`DELETE FROM "lessons" WHERE "course_id" = ANY($1::text[])`, [removedDummyPremiumCourseIds]);
  await client.query(`DELETE FROM "enrollments" WHERE "course_id" = ANY($1::text[])`, [removedDummyPremiumCourseIds]);
  await client.query(`UPDATE "live_classes" SET "course_id" = NULL WHERE "course_id" = ANY($1::text[])`, [removedDummyPremiumCourseIds]);
  await client.query(`DELETE FROM "courses" WHERE "id" = ANY($1::text[])`, [removedDummyPremiumCourseIds]);
  await seedRowsIfEmpty(client, "notes", seedNotes);
  await client.query(`DELETE FROM "notes" WHERE "id" IN ('n1', 'n2', 'n3')`);
  await client.query(`DELETE FROM "notes" WHERE "id" LIKE 'drive-folder-%'`);
  await insertRowsIfMissing(client, "notes", driveClass12Notes);
  await seedRowsIfEmpty(client, "quizzes", seedQuizzes);
  await upsertRows(client, "quizzes", nebQuestionBank.quizzes);
  await seedRowsIfEmpty(
    client,
    "questions",
    seedQuestions.map((question) => ({
      ...question,
      options: JSON.stringify(question.options),
      image_url: question.image_url || "",
    })),
  );
  await upsertRowsInBatches(
    client,
    "questions",
    nebQuestionBank.questions.map((question) => ({
      ...question,
      options: JSON.stringify(question.options),
      image_url: question.image_url || "",
    })),
  );
  await seedRowsIfEmpty(client, "sliders", seedSliders);
  await seedRowsIfEmpty(client, "live_classes", seedLiveClasses);
};

export const initDatabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getPool();
      await createSchema(db);
      await seedDatabase(db);
    })();
  }

  await initPromise;
};

export const queryRows = async <T extends RowDataPacket = RowDataPacket>(sql: string, params: unknown[] = []) => {
  const db = getPool();
  return runQuery<T>(db, sql, params);
};

export const queryOne = async <T extends RowDataPacket = RowDataPacket>(sql: string, params: unknown[] = []) => {
  const rows = await queryRows<T>(sql, params);
  return rows[0] || null;
};

export const execute = async (sql: string, params: unknown[] = []) => {
  const db = getPool();
  return db.query(adaptSql(sql), params);
};

export const withTransaction = async <T>(handler: (connection: PoolConnection) => Promise<T>) => {
  const db = getPool();
  const client = await db.connect();
  const connection = wrapClient(client);

  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
