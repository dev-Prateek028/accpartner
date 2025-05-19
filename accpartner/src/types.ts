export interface UserProfile {
  id: string;
  username: string;
  email: string;
  timezone: string;
  deadline: string;
  isAvailable: boolean;
  rating: number;
  totalPairs: number;
}

export interface Task {
  id: string;
  task: string;
  description: string;
  fileUrl: string;
  userId: string;
  partnerId: string;
  pairingId: string;
  status: 'pending' | 'completed' | 'verified' | 'missed';
  createdAt: any;
  deadline: string;
  verified: boolean;
  verificationResult: boolean;
  timestamp: any;
}

export interface Pairing {
  id: string;
  users: string[];
  createdAt: any;
  status: string;
}

export interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDeadline: (newDeadline: string) => Promise<void>;
  register: (email: string, password: string, username: string, timezone: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
} 