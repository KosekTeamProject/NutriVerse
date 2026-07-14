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
  kind: "activity" | "tier" | "badge";
  text: string;
  detail: string;
  encourages: number;
  comments: number;
};

export const POSTS: Post[] = [
  { id: "p1", name: "Dinda Puspita", time: "12 mnt lalu", kind: "activity", text: "Lari pagi menyusuri kampus, target minggu ini hampir tercapai!", detail: "8,0 km · +800 XP", encourages: 24, comments: 5 },
  { id: "p2", name: "Yoga Adyatma", time: "1 jam lalu", kind: "tier", text: "Akhirnya naik ke tier Peak setelah grind seminggu penuh.", detail: "Naik ke tier Peak", encourages: 41, comments: 12 },
  { id: "p3", name: "Fatan Mubarak", time: "3 jam lalu", kind: "badge", text: "Dapat badge Hydration Hero, ternyata rajin minum air kebayar juga.", detail: "Badge Hydration Hero", encourages: 18, comments: 3 },
  { id: "p4", name: "Aulia Rahma", time: "5 jam lalu", kind: "activity", text: "Gowes sore keliling kota, cuaca lagi bagus banget.", detail: "22,0 km · +990 XP", encourages: 30, comments: 7 },
];

export type Suggestion = { id: string; name: string; mutual: number };

export const SUGGESTIONS: Suggestion[] = [
  { id: "u1", name: "Bima Saputra", mutual: 4 },
  { id: "u2", name: "Sarah Wijaya", mutual: 2 },
  { id: "u3", name: "Reza Firmansyah", mutual: 6 },
];

export const COMMUNITY_CHALLENGE = {
  title: "1 Juta Langkah Bersama AMIKOM",
  now: 642000,
  goal: 1000000,
  participants: 312,
};
