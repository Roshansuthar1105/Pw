export type ResourceType = 'NOTES' | 'VIDEO';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TopicView { id: number; name: string; }
export interface SubjectView { id: number; name: string; topics: TopicView[]; }
export interface CourseView { id: number; name: string; description?: string | null; subjects: SubjectView[]; }

export interface OptionInput { key: string; content: string; }
export interface QuestionInput {
  courseId: number;
  subjectId: number;
  topicId: number | null;
  prompt: string;
  imageUrl: string | null;
  explanation: string | null;
  correctOption: string;
  marks: number;
  difficulty: Difficulty;
  options: OptionInput[];
}
export interface QuestionView extends QuestionInput {
  id: number;
  courseName: string;
  subjectName: string;
  topicName?: string | null;
  createdAt: string;
}

export interface ResourceInput {
  courseId: number;
  subjectId: number;
  topicId: number | null;
  type: ResourceType;
  title: string;
  description: string;
  url: string;
  published: boolean;
}
export interface ResourceView extends ResourceInput {
  id: number;
  courseName: string;
  subjectName: string;
  topicName?: string | null;
  createdAt: string;
}

export interface TestInput {
  courseId: number;
  subjectId: number;
  title: string;
  instructions: string;
  durationMinutes: number;
  availableFrom: string | null;
  availableUntil: string | null;
  questionIds: number[];
}
export interface TestSummary {
  id: number;
  courseId: number;
  courseName: string;
  subjectId: number;
  subjectName: string;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  availableFrom: string | null;
  availableUntil: string | null;
  published: boolean;
  questionCount: number;
  totalMarks: number;
  attemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | null;
  score: number | null;
}
export interface TestDetail {
  id: number;
  courseId: number;
  subjectId: number;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  availableFrom: string | null;
  availableUntil: string | null;
  published: boolean;
  questionIds: number[];
}
export interface AttemptQuestion {
  id: number;
  prompt: string;
  imageUrl?: string | null;
  marks: number;
  options: OptionInput[];
}
export interface AttemptStart {
  attemptId: number;
  testId: number;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  startedAt: string;
  questions: AttemptQuestion[];
  answers: Record<number, string>;
}
export interface AttemptResult {
  attemptId: number;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  score: number | null;
  totalMarks: number;
  submittedAt: string | null;
}
export interface QuestionImportDraft {
  prompt: string;
  imageUrl: string | null;
  explanation: string | null;
  correctOption: string;
  marks: number;
  difficulty: Difficulty;
  options: OptionInput[];
  source: string;
  errors: string[];
}
export interface QuestionImportPreview {
  questions: QuestionImportDraft[];
  errors: string[];
}
