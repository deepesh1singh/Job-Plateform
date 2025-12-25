import { z } from "zod";
import { Schema, model, Document, Types } from "mongoose";

// Base interface for all documents
interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
interface IUser extends IBaseDocument {
  username: string;
  password: string;
  role: 'employer' | 'job_seeker' | 'admin';
  companyName?: string;
  email: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  loginLogs: {
    timestamp: Date;
    ip: string;
    userAgent: string;
  }[];
  lastLogin?: Date;
  isActive: boolean;
}

// Job related types
interface IJob extends IBaseDocument {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary?: number;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  employerId: Types.ObjectId;
  isActive: boolean;
  skillsRequired: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
  applicationDeadline?: Date;
}

// Zod schemas for validation
export const userSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  ),
  confirmPassword: z.string().optional(),
  role: z.enum(['employer', 'job_seeker', 'admin']).default('job_seeker'),
  companyName: z.string().optional(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  verificationToken: z.string().optional(),
  verificationTokenExpires: z.date().optional(),
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.date().optional(),
  googleId: z.string().optional(),
  loginLogs: z.array(z.object({
    timestamp: z.date(),
    ip: z.string(),
    userAgent: z.string()
  })).default([]),
  lastLogin: z.date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const jobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  requirements: z.array(z.string()).default([]),
  location: z.string(),
  salary: z.number().min(0).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  employerId: z.instanceof(Types.ObjectId),
  isActive: z.boolean().default(true),
  skillsRequired: z.array(z.string()).default([]),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
  applicationDeadline: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Export types
export type User = IUser;
export type InsertUser = Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>;

export type Job = IJob;
export type InsertJob = Omit<IJob, '_id' | 'createdAt' | 'updatedAt'>;

// Mongoose schemas
export const UserSchema = new Schema<User>(
  {
    username: { 
      type: String, 
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['employer', 'job_seeker', 'admin'],
        message: 'Invalid role'
      },
      default: 'job_seeker'
    },
    companyName: {
      type: String,
      required: [
        function() { return this.role === 'employer'; },
        'Company name is required for employers'
      ],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    googleId: String,
    loginLogs: [{
      timestamp: { type: Date, default: Date.now },
      ip: String,
      userAgent: String
    }],
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

export const JobSchema = new Schema<Job>(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: true,
      trim: true
    },
    requirements: [{
      type: String,
      trim: true
    }],
    location: { 
      type: String, 
      required: true,
      trim: true
    },
    salary: { 
      type: Number,
      min: 0
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
      required: true
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    skillsRequired: [{
      type: String,
      trim: true
    }],
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'mid'
    },
    applicationDeadline: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual for employer details
JobSchema.virtual('employer', {
  ref: 'User',
  localField: 'employerId',
  foreignField: '_id',
  justOne: true
});

// Create indexes for better query performance
JobSchema.index({ title: 'text', description: 'text', location: 'text' });
JobSchema.index({ employerId: 1 });
JobSchema.index({ isActive: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ experienceLevel: 1 });

// Create models
export const UserModel = model<User & Document>('User', UserSchema);
export const JobModel = model<Job & Document>('Job', JobSchema);
