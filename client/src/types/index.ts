export interface UserState {
  id: string;
  phone: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface VirtualScene {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  interactiveElements?: string[];
  status: string;
  order: number;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  category: string;
  steps?: any[];
  requirements?: string[];
  order: number;
  isActive: boolean;
}

export interface StudentProgress {
  id: string;
  userId: string;
  experimentId: string;
  sceneId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  currentStep?: number;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number;
}

export interface TrainingTask {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  experimentId: string;
  assignedStudents?: string[];
  dueDate?: Date;
  isActive: boolean;
}

export interface ExperimentResult {
  id: string;
  userId: string;
  experimentId: string;
  taskId?: string;
  submissionData?: any;
  score?: string;
  feedback?: string;
  evaluatedBy?: string;
  evaluatedAt?: Date;
  submittedAt: Date;
}

export interface StudentStats {
  completedExperiments: number;
  totalExperiments: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number;
}

export interface TeacherStats {
  totalTasks: number;
  activeTasks: number;
  totalStudents: number;
}

export interface SystemStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
}
