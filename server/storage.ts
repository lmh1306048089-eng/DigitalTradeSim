import {
  users,
  virtualScenes,
  experiments,
  studentProgress,
  trainingTasks,
  experimentResults,
  uploadedFiles,
  businessRoles,
  userBusinessRoles,
  collaborationData,
  type User,
  type InsertUser,
  type VirtualScene,
  type InsertVirtualScene,
  type Experiment,
  type InsertExperiment,
  type StudentProgress,
  type InsertStudentProgress,
  type TrainingTask,
  type InsertTrainingTask,
  type ExperimentResult,
  type InsertExperimentResult,
  type UploadedFile,
  type InsertUploadedFile,
  type BusinessRole,
  type InsertBusinessRole,
  type UserBusinessRole,
  type InsertUserBusinessRole,
  type CollaborationData,
  type InsertCollaborationData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Business role operations
  getBusinessRoles(): Promise<BusinessRole[]>;
  getBusinessRole(id: string): Promise<BusinessRole | undefined>;
  createBusinessRole(role: InsertBusinessRole): Promise<BusinessRole>;
  
  // User business role assignments
  getUserBusinessRoles(userId: string): Promise<UserBusinessRole[]>;
  assignUserBusinessRole(assignment: InsertUserBusinessRole): Promise<UserBusinessRole>;
  removeUserBusinessRole(id: string): Promise<void>;
  
  // Virtual scenes
  getVirtualScenes(): Promise<VirtualScene[]>;
  getVirtualScene(id: string): Promise<VirtualScene | undefined>;
  createVirtualScene(scene: InsertVirtualScene): Promise<VirtualScene>;
  updateVirtualScene(id: string, updates: Partial<VirtualScene>): Promise<VirtualScene>;
  
  // Experiments
  getExperiments(): Promise<Experiment[]>;
  getExperiment(id: string): Promise<Experiment | undefined>;
  getExperimentsByCategory(category: string): Promise<Experiment[]>;
  createExperiment(experiment: InsertExperiment): Promise<Experiment>;
  updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment>;
  
  // Student progress
  getStudentProgress(userId: string): Promise<StudentProgress[]>;
  getStudentProgressByExperiment(userId: string, experimentId: string): Promise<StudentProgress | undefined>;
  createOrUpdateProgress(progress: InsertStudentProgress): Promise<StudentProgress>;
  updateProgress(id: string, updates: Partial<StudentProgress>): Promise<StudentProgress>;
  
  // Training tasks
  getTrainingTasks(teacherId?: string): Promise<TrainingTask[]>;
  getTrainingTask(id: string): Promise<TrainingTask | undefined>;
  getTasksForStudent(studentId: string): Promise<TrainingTask[]>;
  createTrainingTask(task: InsertTrainingTask): Promise<TrainingTask>;
  updateTrainingTask(id: string, updates: Partial<TrainingTask>): Promise<TrainingTask>;
  
  // Experiment results
  getExperimentResults(userId?: string, experimentId?: string): Promise<ExperimentResult[]>;
  getExperimentResult(id: string): Promise<ExperimentResult | undefined>;
  createExperimentResult(result: InsertExperimentResult): Promise<ExperimentResult>;
  updateExperimentResult(id: string, updates: Partial<ExperimentResult>): Promise<ExperimentResult>;
  
  // File uploads
  getUploadedFiles(userId?: string, experimentId?: string): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  deleteUploadedFile(id: string): Promise<void>;
  
  // Analytics
  getStudentStats(userId: string): Promise<any>;
  getTeacherStats(teacherId: string): Promise<any>;
  getSystemStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Business role operations
  async getBusinessRoles(): Promise<BusinessRole[]> {
    return db.select().from(businessRoles).where(eq(businessRoles.isActive, true));
  }

  async getBusinessRole(id: string): Promise<BusinessRole | undefined> {
    const [role] = await db.select().from(businessRoles).where(eq(businessRoles.id, id));
    return role;
  }

  async createBusinessRole(roleData: InsertBusinessRole): Promise<BusinessRole> {
    const [role] = await db.insert(businessRoles).values(roleData).returning();
    return role;
  }

  // User business role assignments
  async getUserBusinessRoles(userId: string): Promise<UserBusinessRole[]> {
    return db.select().from(userBusinessRoles)
      .where(and(eq(userBusinessRoles.userId, userId), eq(userBusinessRoles.isActive, true)));
  }

  async assignUserBusinessRole(assignment: InsertUserBusinessRole): Promise<UserBusinessRole> {
    const [role] = await db.insert(userBusinessRoles).values(assignment).returning();
    return role;
  }

  async removeUserBusinessRole(id: string): Promise<void> {
    await db.update(userBusinessRoles)
      .set({ isActive: false })
      .where(eq(userBusinessRoles.id, id));
  }

  // Virtual scenes
  async getVirtualScenes(): Promise<VirtualScene[]> {
    return db.select().from(virtualScenes).orderBy(asc(virtualScenes.order));
  }

  async getVirtualScene(id: string): Promise<VirtualScene | undefined> {
    const [scene] = await db.select().from(virtualScenes).where(eq(virtualScenes.id, id));
    return scene;
  }

  async createVirtualScene(sceneData: InsertVirtualScene): Promise<VirtualScene> {
    const [scene] = await db.insert(virtualScenes).values(sceneData).returning();
    return scene;
  }

  async updateVirtualScene(id: string, updates: Partial<VirtualScene>): Promise<VirtualScene> {
    const [scene] = await db
      .update(virtualScenes)
      .set(updates)
      .where(eq(virtualScenes.id, id))
      .returning();
    return scene;
  }

  // Experiments
  async getExperiments(): Promise<Experiment[]> {
    return db.select().from(experiments).where(eq(experiments.isActive, true)).orderBy(asc(experiments.order));
  }

  async getExperiment(id: string): Promise<Experiment | undefined> {
    const [experiment] = await db.select().from(experiments).where(eq(experiments.id, id));
    return experiment;
  }

  async getExperimentsByCategory(category: string): Promise<Experiment[]> {
    return db.select().from(experiments)
      .where(and(eq(experiments.category, category), eq(experiments.isActive, true)))
      .orderBy(asc(experiments.order));
  }

  async createExperiment(experimentData: InsertExperiment): Promise<Experiment> {
    const [experiment] = await db.insert(experiments).values(experimentData).returning();
    return experiment;
  }

  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment> {
    const [experiment] = await db
      .update(experiments)
      .set(updates)
      .where(eq(experiments.id, id))
      .returning();
    return experiment;
  }

  // Student progress
  async getStudentProgress(userId: string): Promise<StudentProgress[]> {
    return db.select().from(studentProgress)
      .where(eq(studentProgress.userId, userId))
      .orderBy(desc(studentProgress.updatedAt));
  }

  async getStudentProgressByExperiment(userId: string, experimentId: string): Promise<StudentProgress | undefined> {
    const [progress] = await db.select().from(studentProgress)
      .where(and(eq(studentProgress.userId, userId), eq(studentProgress.experimentId, experimentId)));
    return progress;
  }

  async createOrUpdateProgress(progressData: InsertStudentProgress): Promise<StudentProgress> {
    const existing = await this.getStudentProgressByExperiment(progressData.userId, progressData.experimentId);
    
    if (existing) {
      return this.updateProgress(existing.id, progressData);
    } else {
      const [progress] = await db.insert(studentProgress).values(progressData).returning();
      return progress;
    }
  }

  async updateProgress(id: string, updates: Partial<StudentProgress>): Promise<StudentProgress> {
    const [progress] = await db
      .update(studentProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentProgress.id, id))
      .returning();
    return progress;
  }

  // Training tasks
  async getTrainingTasks(teacherId?: string): Promise<TrainingTask[]> {
    const query = db.select().from(trainingTasks);
    if (teacherId) {
      return query.where(eq(trainingTasks.teacherId, teacherId)).orderBy(desc(trainingTasks.createdAt));
    }
    return query.orderBy(desc(trainingTasks.createdAt));
  }

  async getTrainingTask(id: string): Promise<TrainingTask | undefined> {
    const [task] = await db.select().from(trainingTasks).where(eq(trainingTasks.id, id));
    return task;
  }

  async getTasksForStudent(studentId: string): Promise<TrainingTask[]> {
    // Note: This requires a JSON contains operation which might need raw SQL
    return db.select().from(trainingTasks)
      .where(eq(trainingTasks.isActive, true))
      .orderBy(desc(trainingTasks.createdAt));
  }

  async createTrainingTask(taskData: InsertTrainingTask): Promise<TrainingTask> {
    const [task] = await db.insert(trainingTasks).values(taskData).returning();
    return task;
  }

  async updateTrainingTask(id: string, updates: Partial<TrainingTask>): Promise<TrainingTask> {
    const [task] = await db
      .update(trainingTasks)
      .set(updates)
      .where(eq(trainingTasks.id, id))
      .returning();
    return task;
  }

  // Experiment results
  async getExperimentResults(userId?: string, experimentId?: string): Promise<ExperimentResult[]> {
    let query = db.select().from(experimentResults);
    
    if (userId && experimentId) {
      return query.where(and(eq(experimentResults.userId, userId), eq(experimentResults.experimentId, experimentId)))
        .orderBy(desc(experimentResults.submittedAt));
    } else if (userId) {
      return query.where(eq(experimentResults.userId, userId)).orderBy(desc(experimentResults.submittedAt));
    } else if (experimentId) {
      return query.where(eq(experimentResults.experimentId, experimentId)).orderBy(desc(experimentResults.submittedAt));
    }
    
    return query.orderBy(desc(experimentResults.submittedAt));
  }

  async getExperimentResult(id: string): Promise<ExperimentResult | undefined> {
    const [result] = await db.select().from(experimentResults).where(eq(experimentResults.id, id));
    return result;
  }

  async createExperimentResult(resultData: InsertExperimentResult): Promise<ExperimentResult> {
    const [result] = await db.insert(experimentResults).values(resultData).returning();
    return result;
  }

  async updateExperimentResult(id: string, updates: Partial<ExperimentResult>): Promise<ExperimentResult> {
    const [result] = await db
      .update(experimentResults)
      .set(updates)
      .where(eq(experimentResults.id, id))
      .returning();
    return result;
  }

  // File uploads
  async getUploadedFiles(userId?: string, experimentId?: string): Promise<UploadedFile[]> {
    let query = db.select().from(uploadedFiles);
    
    if (userId && experimentId) {
      return query.where(and(eq(uploadedFiles.uploadedBy, userId), eq(uploadedFiles.experimentId, experimentId)))
        .orderBy(desc(uploadedFiles.createdAt));
    } else if (userId) {
      return query.where(eq(uploadedFiles.uploadedBy, userId)).orderBy(desc(uploadedFiles.createdAt));
    } else if (experimentId) {
      return query.where(eq(uploadedFiles.experimentId, experimentId)).orderBy(desc(uploadedFiles.createdAt));
    }
    
    return query.orderBy(desc(uploadedFiles.createdAt));
  }

  async createUploadedFile(fileData: InsertUploadedFile): Promise<UploadedFile> {
    const [file] = await db.insert(uploadedFiles).values(fileData).returning();
    return file;
  }

  async deleteUploadedFile(id: string): Promise<void> {
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
  }

  // Analytics
  async getStudentStats(userId: string): Promise<any> {
    const progress = await this.getStudentProgress(userId);
    const results = await this.getExperimentResults(userId);
    
    const completedExperiments = progress.filter(p => p.status === "completed").length;
    const totalExperiments = progress.length;
    const averageScore = results.length > 0 
      ? results.reduce((sum, r) => sum + (parseFloat(r.score || "0")), 0) / results.length 
      : 0;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    return {
      completedExperiments,
      totalExperiments,
      completionRate: totalExperiments > 0 ? (completedExperiments / totalExperiments) * 100 : 0,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTimeSpent,
    };
  }

  async getTeacherStats(teacherId: string): Promise<any> {
    const tasks = await this.getTrainingTasks(teacherId);
    const activeTasks = tasks.filter(t => t.isActive).length;
    
    return {
      totalTasks: tasks.length,
      activeTasks,
      totalStudents: new Set(tasks.flatMap(t => t.assignedStudents || [])).size,
    };
  }

  async getSystemStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const students = allUsers.filter(u => u.role === "student");
    const teachers = allUsers.filter(u => u.role === "teacher");
    const admins = allUsers.filter(u => u.role === "admin");
    
    return {
      totalUsers: allUsers.length,
      students: students.length,
      teachers: teachers.length,
      admins: admins.length,
    };
  }
}

export const storage = new DatabaseStorage();
