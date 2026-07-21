import {
  DemoTraveler,
  TodayJourneySummary,
  ChallengePreview
} from "./types";

export const demoTraveler: DemoTraveler = {
  name: "Fathan Mubarak",
  journeyDay: 148,
  currentStreak: 7
};


export const todayJourneySummary: TodayJourneySummary = {
  percentComplete: 64,
  healthyDayStatus: "Still Forming",
  goals: [
    {
      id: "g1",
      name: "Morning Walk",
      value: 1.4,
      target: 2.0,
      unit: "km",
      verification: "Verified"
    },
    {
      id: "g2",
      name: "Protein Progress",
      value: 56,
      target: 80,
      unit: "g",
      verification: "Partially Verified"
    },
    {
      id: "g3",
      name: "Hydration",
      value: 1.1,
      target: 2.0,
      unit: "L",
      verification: "Self-Reported"
    },
    {
      id: "g4",
      name: "Light Recovery",
      value: 15,
      target: 15,
      unit: "min",
      verification: "Completed"
    }
  ]
};


export const activeChallenge: ChallengePreview = {
  title: "Light Cardio Journey",
  progress: 7.2,
  target: 10.0,
  unit: "km",
  status: "In Progress",
  potentialReward: {
    xp: 180,
    hp: 60
  }
};
