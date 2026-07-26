export type Story = { id: string; name: string; you?: boolean };

export const STORIES: Story[] = [
  { id: "s0", name: "Kamu", you: true },
  { id: "s1", name: "Dinda" },
  { id: "s2", name: "Yoga" },
  { id: "s3", name: "Fatan" },
  { id: "s4", name: "Aulia" },
  { id: "s5", name: "Ilham" },
];

export type Post = {
  id: string;
  name: string;
  time: string;
  kind: "activity" | "consistency" | "reflection";
  text: string;
  detail: string;
  encourages: number;
  comments: number;
  commentList?: { id: string; userName: string; text: string }[];
  reactionList?: string[];
  trustLevel?: string;
};

export const POSTS: Post[] = [
  { 
    id: "p1", 
    name: "Dinda Puspita", 
    time: "12 mnt lalu", 
    kind: "activity", 
    text: "Selesai kardio ringan mengelilingi jalur kampus. Langkah yang berkelanjutan terasa lebih nyaman daripada memaksakan tubuh.",
    detail: "1,4 km · Progres Terverifikasi",
    encourages: 24, 
    comments: 5,
    trustLevel: "verified"
  },
  { 
    id: "p2", 
    name: "Yoga Adyatma", 
    time: "1 jam lalu", 
    kind: "consistency", 
    text: "Berhasil menjaga pola konsistensi selama tujuh hari dengan langkah sederhana dan pemulihan aktif.",
    detail: "Fondasi 7 Hari",
    encourages: 41, 
    comments: 12,
    trustLevel: "verified"
  },
  { 
    id: "p3", 
    name: "Fatan Mubarak", 
    time: "3 jam lalu", 
    kind: "reflection", 
    text: "Hari pemulihan membantu menjaga energi. Terkadang istirahat adalah langkah paling produktif untuk konsistensi.",
    detail: "Hari Pemulihan Aktif",
    encourages: 18, 
    comments: 3,
    trustLevel: "self-reported"
  },
  { 
    id: "p4", 
    name: "Aulia Rahma", 
    time: "5 jam lalu", 
    kind: "activity", 
    text: "Mengumpulkan 7,2 km jalan kaki terverifikasi untuk tantangan Kardio Ringan.",
    detail: "72% Progres Tantangan",
    encourages: 30, 
    comments: 7,
    trustLevel: "verified"
  },
];

export type Suggestion = { id: string; name: string; mutual: number; focus: string };

export const SUGGESTIONS: Suggestion[] = [
  { id: "u1", name: "Bima Saputra", mutual: 4, focus: "Pace Aktif" },
  { id: "u2", name: "Sarah Wijaya", mutual: 2, focus: "Ritme Pemulihan" },
  { id: "u3", name: "Reza Firmansyah", mutual: 6, focus: "Rutinitas Seimbang" },
];

export const COMMUNITY_CHALLENGE = {
  title: "1 Juta Langkah Bersama AMIKOM",
  now: 642000,
  goal: 1000000,
  participants: 312,
};
