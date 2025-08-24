export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  GoalForm: { goalId?: string } | undefined;
  GoalDetail: { goalId: string };
  TaskForm: { taskId?: string } | undefined;
  TaskDetail: { taskId: string };
};

export type MainTabParamList = {
  BrainDump: undefined;
  AIChat: { initialMessage?: string; threadId?: string; taskTitle?: string } | undefined;
  Goals: undefined;
  Tasks: undefined;
  Calendar: undefined;
  Profile: undefined;
};
