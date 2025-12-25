import { User, InsertUser, UserModel, Job, InsertJob, JobModel, UserSchema } from "@shared/schema";
import { connect, connection, Types, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request } from 'express';
import { promisify } from 'util';

const SALT_WORK_FACTOR = 10;
const randomBytes = promisify(crypto.randomBytes);

export interface IStorage {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Auth methods
  loginUser(email: string, password: string, req: Request): Promise<{ user: User; token: string }>;
  requestPasswordReset(email: string): Promise<{ resetToken: string; user: User }>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  verifyEmail(token: string): Promise<boolean>;
  trackLogin(userId: string, ip: string, userAgent: string): Promise<void>;
  
  // Job methods
  createJob(job: InsertJob): Promise<Job>;
  getJobById(id: string): Promise<Job | null>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;
  getAllJobs(limit?: number, page?: number): Promise<{ jobs: Job[]; total: number }>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | null>;
  deleteJob(id: string): Promise<boolean>;
  searchJobs(query: string, filters?: {
    jobType?: string[];
    experienceLevel?: string[];
    location?: string;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<Job[]>;
}

export class MongoDBStorage implements IStorage {
  private isConnected = false;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await connect(this.connectionString);
      this.isConnected = true;
      console.log('MongoDB connected successfully');
      
      // Create indexes if they don't exist
      await this.ensureIndexes();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private async ensureIndexes() {
    try {
      await JobModel.syncIndexes();
      await UserModel.syncIndexes();
      console.log('Database indexes are up to date');
    } catch (error) {
      console.error('Error ensuring indexes:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await connection.close();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    }
  }

  // Hash password before saving
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    return bcrypt.hash(password, salt);
  }

  // Generate random token
  private generateToken(bytes = 32): Promise<string> {
    return randomBytes(bytes).then(buf => buf.toString('hex'));
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id).select('-password').lean().exec();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email }).select('-password').lean().exec();
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return UserModel.findOne({ googleId }).select('-password').lean().exec();
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Generate email verification token
    const verificationToken = await this.generateToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours expiry

    const user = new UserModel({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'job_seeker',
      verificationToken,
      verificationTokenExpires,
      emailVerified: false
    });
    
    await user.save();
    
    // Send verification email (implement this function)
    // await sendVerificationEmail(user.email, verificationToken);
    
    const userObj = user.toObject();
    // @ts-ignore - We're removing password from the returned object
    delete userObj.password;
    return userObj;
  }

  // Auth methods
  async loginUser(email: string, password: string, req: Request): Promise<{ user: User; token: string }> {
    // Find user by email and select password
    const user = await UserModel.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }
    
    // Track login
    await this.trackLogin(user._id.toString(), req.ip, req.headers['user-agent'] || '');
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token (implement your JWT logic here)
    const token = 'generated-jwt-token';
    
    // Return user without password and with token
    const userObj = user.toObject();
    // @ts-ignore
    delete userObj.password;
    
    return { user: userObj, token };
  }
  
  async requestPasswordReset(email: string): Promise<{ resetToken: string; user: User }> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('No account with that email exists');
    }
    
    // Generate reset token
    const resetToken = await this.generateToken();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry
    
    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // Send reset email (implement this function)
    // await sendPasswordResetEmail(user.email, resetToken);
    
    return { resetToken, user: user.toObject() };
  }
  
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new Error('Password reset token is invalid or has expired');
    }
    
    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    return true;
  }
  
  async verifyEmail(token: string): Promise<boolean> {
    const user = await UserModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new Error('Email verification token is invalid or has expired');
    }
    
    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    
    return true;
  }
  
  async trackLogin(userId: string, ip: string, userAgent: string): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          loginLogs: {
            timestamp: new Date(),
            ip,
            userAgent
          }
        },
        lastLogin: new Date()
      },
      { new: true }
    );
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    
    const user = await UserModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .select('-password')
    .lean()
    .exec();
    
    return user;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // Job methods
  async createJob(jobData: InsertJob): Promise<Job> {
    const job = new JobModel(jobData);
    await job.save();
    
    // Populate employer details
    const populatedJob = await job.populate('employerId', 'username companyName email');
    return populatedJob.toObject();
  }

  async getJobById(id: string): Promise<Job | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return JobModel.findById(id)
      .populate('employerId', 'username companyName email')
      .lean()
      .exec();
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    if (!Types.ObjectId.isValid(employerId)) return [];
    return JobModel.find({ employerId: new Types.ObjectId(employerId) })
      .populate('employerId', 'username companyName email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getAllJobs(limit: number = 10, page: number = 1): Promise<{ jobs: Job[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [jobs, total] = await Promise.all([
      JobModel.find({ isActive: true })
        .populate('employerId', 'username companyName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      JobModel.countDocuments({ isActive: true })
    ]);

    return { jobs, total };
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    const updatedJob = await JobModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('employerId', 'username companyName email')
      .lean()
      .exec();

    return updatedJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    
    const result = await JobModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async searchJobs(
    query: string,
    filters: {
      jobType?: string[];
      experienceLevel?: string[];
      location?: string;
      minSalary?: number;
      maxSalary?: number;
    } = {}
  ): Promise<Job[]> {
    const { jobType, experienceLevel, location, minSalary, maxSalary } = filters;
    
    const searchQuery: any = { isActive: true };
    
    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    // Apply filters
    if (jobType && jobType.length > 0) {
      searchQuery.jobType = { $in: jobType };
    }
    
    if (experienceLevel && experienceLevel.length > 0) {
      searchQuery.experienceLevel = { $in: experienceLevel };
    }
    
    if (location) {
      searchQuery.location = new RegExp(location, 'i');
    }
    
    if (minSalary !== undefined || maxSalary !== undefined) {
      searchQuery.salary = {};
      if (minSalary !== undefined) searchQuery.salary.$gte = minSalary;
      if (maxSalary !== undefined) searchQuery.salary.$lte = maxSalary;
    }
    
    return JobModel.find(searchQuery)
      .populate('employerId', 'username companyName email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}

// Create a new instance with a default connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rest-express';

export const storage = new MongoDBStorage(MONGODB_URI);
