export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  GoalForm: { goalId?: string } | undefined;
  GoalDetail: { goalId: string };
};

export type MainTabParamList = {
  AIChat: { initialMessage?: string } | undefined;
  Goals: undefined;
  Tasks: undefined;
  Calendar: undefined;
};
