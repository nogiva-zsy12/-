
export enum TaskStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  URGENT = 'URGENT'
}

export type Frequency = 'ONCE' | 'DAILY' | 'WEEKLY';

export interface ToxicRecord {
  id: string;
  time: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
}

export interface Message {
  id: string;
  time: string;
  title: string;
  content: string;
  isRead: boolean;
  type: 'INSULT' | 'SYSTEM' | 'WARNING';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  startTime: string;
  estimatedTime: string;
  progress: number;
  toxicRecords: ToxicRecord[];
  frequency?: Frequency;
  createdAt?: string;
}

export type View = 'CHAT' | 'MESSAGES' | 'TASK_LIST' | 'SETTINGS' | 'LOGIN' | 'DETAIL' | 'PROFILE_EDIT' | 'AI_CONFIG' | 'CREATE_TASK';
