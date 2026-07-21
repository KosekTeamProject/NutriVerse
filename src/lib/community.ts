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
  trustLevel?: string;
};

export const POSTS: Post[] = [
  { 
    id: "p1", 
    name: "Dinda Puspita", 
    time: "12 mnt lalu", 
    kind: "activity", 
    text: "Completed a light cardio segment around the campus trail. Sustainable steps feel much better than heavy strain!", 
    detail: "1.4 km · Verified Progress", 
    encourages: 24, 
    comments: 5,
    trustLevel: "verified"
  },
  { 
    id: "p2", 
    name: "Yoga Adyatma", 
    time: "1 jam lalu", 
    kind: "consistency", 
    text: "Hit a seven-day consistency pattern streak. Keeping steps simple and recovery active.", 
    detail: "7-Day Foundation", 
    encourages: 41, 
    comments: 12,
    trustLevel: "verified"
  },
  { 
    id: "p3", 
    name: "Fatan Mubarak", 
    time: "3 jam lalu", 
    kind: "reflection", 
    text: "Today's recovery day helped maintain energy. Sometimes rest is the most productive step for wellness consistency.", 
    detail: "Active Recovery Day", 
    encourages: 18, 
    comments: 3,
    trustLevel: "self-reported"
  },
  { 
    id: "p4", 
    name: "Aulia Rahma", 
    time: "5 jam lalu", 
    kind: "activity", 
    text: "Accumulated 7.2 km of verified walking for the Light Cardio Journey challenge.", 
    detail: "72% Challenge Progress", 
    encourages: 30, 
    comments: 7,
    trustLevel: "verified"
  },
];

export type Suggestion = { id: string; name: string; mutual: number; focus: string };

export const SUGGESTIONS: Suggestion[] = [
  { id: "u1", name: "Bima Saputra", mutual: 4, focus: "Active Pacing" },
  { id: "u2", name: "Sarah Wijaya", mutual: 2, focus: "Recovery Rhythm" },
  { id: "u3", name: "Reza Firmansyah", mutual: 6, focus: "Balanced Routine" },
];

export const COMMUNITY_CHALLENGE = {
  title: "1 Juta Langkah Bersama AMIKOM",
  now: 642000,
  goal: 1000000,
  participants: 312,
};
