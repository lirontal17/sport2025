
export type Gender = 'בנות' | 'בנים';
export type GradeLevel = 'ז' | 'ח' | 'ט' | 'י' | 'יא' | 'יב';
export type FitnessComponent = 'סיבולת לב-ריאה' | 'כוח' | 'מהירות וזריזות' | 'גמישות' | 'קואורדינציה';
export type LessonDuration = '45 דקות' | '90 דקות';
export type TrainingDuration = 'שבוע' | 'שבועיים' | '4 שבועות' | '6 שבועות';

export interface Record {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  gradeLevel: GradeLevel;
  className: string;
  date: string;
  testType: string;
  originalResult: string;
  grade: number;
  // Added userId for student view filtering
  userId: string; 
}

export interface Student {
    firstName: string;
    lastName: string;
}

export interface TestInfo {
  unit: string;
  isTime?: boolean;
  lowerIsBetter: boolean;
  grades: { score: number; threshold: string | number }[];
}

export interface GradingData {
  [gender: string]: {
    [grade: string]: {
      [test: string]: TestInfo;
    };
  };
}

export enum ModalType {
  Help,
  ConfirmDelete,
  ConfirmClearAll,
  Ai,
  LessonPlan,
  ShareGroup,
  TrainingPlan,
  ReportCard,
}

export interface AiRequest {
    isLoading: boolean;
    title: string;
    content: string;
}

// --- LTI Integration Types ---
export type UserRole = 'Instructor' | 'Learner';

export interface LtiContextType {
    isLti: boolean;
    role: UserRole;
    userId: string;
    userName: string;
    courseId: string;
    courseName: string;
    roster: Student[];
    gradeLevel: GradeLevel | null;
}
