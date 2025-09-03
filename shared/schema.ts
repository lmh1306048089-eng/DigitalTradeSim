import { sql } from "drizzle-orm";
import { 
  mysqlTable, 
  varchar, 
  text, 
  timestamp, 
  int, 
  json, 
  boolean,
  decimal
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with role-based access
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  phone: varchar("phone", { length: 11 }).notNull().unique(),
  password: text("password").notNull(),
  username: varchar("username", { length: 50 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student, teacher, admin
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Virtual scenes configuration
export const virtualScenes = mysqlTable("virtual_scenes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  interactiveElements: json("interactive_elements").$type<string[]>(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  order: int("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Experiment workflows
export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // preparation, declaration, inspection, etc.
  steps: json("steps").$type<any[]>(),
  requirements: json("requirements").$type<string[]>(),
  order: int("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student progress tracking
export const studentProgress = mysqlTable("student_progress", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  sceneId: varchar("scene_id", { length: 36 }).references(() => virtualScenes.id),
  status: varchar("status", { length: 20 }).notNull().default("not_started"), // not_started, in_progress, completed
  progress: int("progress").notNull().default(0), // 0-100
  currentStep: int("current_step").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  timeSpent: int("time_spent").default(0), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training tasks assigned by teachers
export const trainingTasks = mysqlTable("training_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  assignedStudents: json("assigned_students").$type<string[]>(),
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student submissions and evaluation results
export const experimentResults = mysqlTable("experiment_results", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  taskId: varchar("task_id", { length: 36 }).references(() => trainingTasks.id),
  submissionData: json("submission_data").$type<any>(),
  score: decimal("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  evaluatedBy: varchar("evaluated_by", { length: 36 }).references(() => users.id),
  evaluatedAt: timestamp("evaluated_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// File uploads for training materials
export const uploadedFiles = mysqlTable("uploaded_files", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: int("size"),
  path: text("path").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 36 }).notNull().references(() => users.id),
  experimentId: varchar("experiment_id", { length: 36 }).references(() => experiments.id),
  resultId: varchar("result_id", { length: 36 }).references(() => experimentResults.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(studentProgress),
  tasks: many(trainingTasks),
  results: many(experimentResults),
  uploads: many(uploadedFiles),
}));

export const experimentsRelations = relations(experiments, ({ many }) => ({
  progress: many(studentProgress),
  tasks: many(trainingTasks),
  results: many(experimentResults),
  uploads: many(uploadedFiles),
}));

export const virtualScenesRelations = relations(virtualScenes, ({ many }) => ({
  progress: many(studentProgress),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  user: one(users, { fields: [studentProgress.userId], references: [users.id] }),
  experiment: one(experiments, { fields: [studentProgress.experimentId], references: [experiments.id] }),
  scene: one(virtualScenes, { fields: [studentProgress.sceneId], references: [virtualScenes.id] }),
}));

export const trainingTasksRelations = relations(trainingTasks, ({ one, many }) => ({
  teacher: one(users, { fields: [trainingTasks.teacherId], references: [users.id] }),
  experiment: one(experiments, { fields: [trainingTasks.experimentId], references: [experiments.id] }),
  results: many(experimentResults),
}));

export const experimentResultsRelations = relations(experimentResults, ({ one, many }) => ({
  user: one(users, { fields: [experimentResults.userId], references: [users.id] }),
  experiment: one(experiments, { fields: [experimentResults.experimentId], references: [experiments.id] }),
  task: one(trainingTasks, { fields: [experimentResults.taskId], references: [trainingTasks.id] }),
  evaluator: one(users, { fields: [experimentResults.evaluatedBy], references: [users.id] }),
  uploads: many(uploadedFiles),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  uploader: one(users, { fields: [uploadedFiles.uploadedBy], references: [users.id] }),
  experiment: one(experiments, { fields: [uploadedFiles.experimentId], references: [experiments.id] }),
  result: one(experimentResults, { fields: [uploadedFiles.resultId], references: [experimentResults.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  password: z.string().min(6, "密码至少6位"),
  role: z.enum(["student", "teacher", "admin"]),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  password: z.string().min(1, "请输入密码"),
  role: z.enum(["student", "teacher", "admin"]),
});

export const insertVirtualSceneSchema = createInsertSchema(virtualScenes).omit({
  id: true,
  createdAt: true,
});

export const insertExperimentSchema = createInsertSchema(experiments).omit({
  id: true,
  createdAt: true,
});

export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingTaskSchema = createInsertSchema(trainingTasks).omit({
  id: true,
  createdAt: true,
});

export const insertExperimentResultSchema = createInsertSchema(experimentResults).omit({
  id: true,
  submittedAt: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type VirtualScene = typeof virtualScenes.$inferSelect;
export type InsertVirtualScene = z.infer<typeof insertVirtualSceneSchema>;
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type TrainingTask = typeof trainingTasks.$inferSelect;
export type InsertTrainingTask = z.infer<typeof insertTrainingTaskSchema>;
export type ExperimentResult = typeof experimentResults.$inferSelect;
export type InsertExperimentResult = z.infer<typeof insertExperimentResultSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
