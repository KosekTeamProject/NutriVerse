export interface DemoTraveler {
  name: string;
  journeyDay: number;
  currentStreak: number;
}


export interface GoalItem {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  verification: "Verified" | "Partially Verified" | "Self-Reported" | "Completed";
}

export interface TodayJourneySummary {
  percentComplete: number;
  goals: GoalItem[];
  healthyDayStatus: string;
}



export interface ChallengePreview {
  title: string;
  progress: number;
  target: number;
  unit: string;
  status: string;
  potentialReward: {
    xp: number;
    hp: number;
  };
}
