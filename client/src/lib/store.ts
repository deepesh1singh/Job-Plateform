import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type UserRole = 'job_seeker' | 'employer' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string; // In real app, never store plain password
  role: UserRole;
  // Profile fields
  legalName?: string;
  preferredName?: string;
  country?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneCode?: string;
  phone?: string;
  linkedIn?: string;
  websites?: string[]; // Array of website URLs
  isAdult?: boolean;
  
  // Education
  university?: string;
  degree?: string;
  major?: string;
  startYear?: string;
  endYear?: string;
  gpa?: string;

  // Files (mocked as strings/names)
  resume?: string;
  coverLetter?: string;
  portfolioLinks?: string[];
  
  // Skills
  codingLanguages?: string[];
  preferredAreas?: string[];

  // Assessments
  assessments?: string[];
  satScore?: string;
  hackerRank?: string;

  // Employer specific
  companyName?: string;
  isApproved?: boolean; // For admin approval
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  companyName: string;
  description: string;
  salary: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Remote';
  skillsRequired: string[];
  experience: string;
  lastDate: string;
  createdAt: string;
  status: 'active' | 'paused' | 'closed';
}

export interface Application {
  id: string;
  jobId: string;
  jobSeekerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

interface StoreState {
  users: User[];
  jobs: Job[];
  applications: Application[];
  currentUser: User | null;
  
  // Actions
  registerUser: (user: User) => void;
  loginUser: (email: string, pass: string) => User | undefined;
  logoutUser: () => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  addJob: (job: Job) => void;
  updateJob: (id: string, data: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  
  applyToJob: (app: Application) => void;
  updateApplicationStatus: (id: string, status: 'accepted' | 'rejected') => void;
}

// --- Initial Mock Data ---

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  email: 'admin@gmail.com',
  password: 'admin@1791893',
  role: 'admin',
  legalName: 'System Admin'
};

const MOCK_JOBS: Job[] = [
  {
    id: 'job-1',
    employerId: 'emp-1',
    title: 'Frontend Developer',
    companyName: 'Tech Corp',
    description: 'We are looking for a skilled React developer.',
    salary: '$80,000 - $120,000',
    location: 'New York, NY',
    type: 'Full-time',
    skillsRequired: ['React', 'TypeScript', 'Tailwind'],
    experience: '2 years',
    lastDate: '2025-12-31',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'job-2',
    employerId: 'emp-2',
    title: 'Backend Intern',
    companyName: 'Startup Inc',
    description: 'Join our team to learn Node.js and Databases.',
    salary: '$30/hr',
    location: 'Remote',
    type: 'Internship',
    skillsRequired: ['Node.js', 'SQL'],
    experience: '0 years',
    lastDate: '2025-06-30',
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];

// --- Store ---

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      users: [INITIAL_ADMIN], // Start with Admin
      jobs: MOCK_JOBS,
      applications: [],
      currentUser: null,

      registerUser: (user) => set((state) => ({ users: [...state.users, user] })),
      
      loginUser: (email, pass) => {
        const user = get().users.find(u => u.email === email && u.password === pass);
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return undefined;
      },
      
      logoutUser: () => set({ currentUser: null }),
      
      updateUser: (id, data) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),
      
      addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
      
      updateJob: (id, data) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...data } : j)
      })),
      
      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== id)
      })),
      
      applyToJob: (app) => set((state) => ({ applications: [...state.applications, app] })),
      
      updateApplicationStatus: (id, status) => set((state) => ({
        applications: state.applications.map(a => a.id === id ? { ...a, status } : a)
      }))
    }),
    {
      name: 'job-portal-storage', // unique name
    }
  )
);