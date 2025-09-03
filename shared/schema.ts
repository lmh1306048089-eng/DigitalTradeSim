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

// 产品用户角色表（第一层角色：决定系统基础权限）
// 保持现有结构兼容性，role字段对应产品用户角色
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  phone: varchar("phone", { length: 11 }).notNull().unique(),
  password: text("password").notNull(),
  username: varchar("username", { length: 50 }).notNull(),
  // role字段直接对应产品用户角色：student（实训学生）, teacher（实训教师）, admin（系统管理员）
  role: varchar("role", { length: 20 }).notNull().default("student"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 实训业务角色表（第二层角色：决定实训操作范围，仅对学生开放）
export const businessRoles = mysqlTable("business_roles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  roleCode: varchar("role_code", { length: 50 }).notNull().unique(),
  roleName: varchar("role_name", { length: 100 }).notNull(),
  description: text("description"),
  availableScenes: json("available_scenes").$type<string[]>(), // 可进入的场景ID列表
  availableOperations: json("available_operations").$type<string[]>(), // 可执行的操作列表
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 用户-业务角色关联表（记录学生在实训任务中选择的业务角色）
export const userBusinessRoles = mysqlTable("user_business_roles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  businessRoleId: varchar("business_role_id", { length: 36 }).notNull().references(() => businessRoles.id, { onDelete: "cascade" }),
  taskId: varchar("task_id", { length: 36 }).references(() => trainingTasks.id), // 关联到具体实训任务
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// 5大实训场景配置（物理空间/操作载体）
export const virtualScenes = mysqlTable("virtual_scenes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  // 基于业务角色的操作入口配置
  operationPoints: json("operation_points").$type<{
    businessRoleCode: string;
    entryName: string;
    entryDescription: string;
    allowedOperations: string[];
  }[]>(),
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

// 学生进度跟踪（基于业务角色的操作记录）
export const studentProgress = mysqlTable("student_progress", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  businessRoleId: varchar("business_role_id", { length: 36 }).references(() => businessRoles.id), // 当前扮演的业务角色
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

// 业务协作数据表（记录角色间的数据流转）
export const collaborationData = mysqlTable("collaboration_data", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => trainingTasks.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id", { length: 36 }).notNull().references(() => users.id),
  fromRoleCode: varchar("from_role_code", { length: 50 }).notNull(), // 发起方业务角色
  toUserId: varchar("to_user_id", { length: 36 }).references(() => users.id), // 接收方用户（可为空，如系统自动处理）
  toRoleCode: varchar("to_role_code", { length: 50 }).notNull(), // 接收方业务角色
  dataType: varchar("data_type", { length: 50 }).notNull(), // 数据类型：backup_application, customs_declaration, etc.
  data: json("data").$type<any>(), // 协作数据内容
  status: varchar("status", { length: 20 }).default("pending"), // pending, processed, completed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 实训任务表（教师分配，支持业务角色分工）
export const trainingTasks = mysqlTable("training_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  // 任务需要的业务角色配置
  requiredBusinessRoles: json("required_business_roles").$type<string[]>(), // 必需的业务角色代码列表
  // 学生-业务角色分配
  roleAssignments: json("role_assignments").$type<{
    studentId: string;
    businessRoleCode: string;
  }[]>(),
  assignedStudents: json("assigned_students").$type<string[]>(),
  taskType: varchar("task_type", { length: 20 }).default("individual"), // individual（单人实训）, group（小组实训）
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
  businessRoleAssignments: many(userBusinessRoles),
  collaborationDataFrom: many(collaborationData, { relationName: "fromUser" }),
  collaborationDataTo: many(collaborationData, { relationName: "toUser" }),
}));

export const businessRolesRelations = relations(businessRoles, ({ many }) => ({
  userAssignments: many(userBusinessRoles),
  progress: many(studentProgress),
}));

export const userBusinessRolesRelations = relations(userBusinessRoles, ({ one }) => ({
  user: one(users, { fields: [userBusinessRoles.userId], references: [users.id] }),
  businessRole: one(businessRoles, { fields: [userBusinessRoles.businessRoleId], references: [businessRoles.id] }),
  task: one(trainingTasks, { fields: [userBusinessRoles.taskId], references: [trainingTasks.id] }),
}));

export const collaborationDataRelations = relations(collaborationData, ({ one }) => ({
  task: one(trainingTasks, { fields: [collaborationData.taskId], references: [trainingTasks.id] }),
  fromUser: one(users, { fields: [collaborationData.fromUserId], references: [users.id], relationName: "fromUser" }),
  toUser: one(users, { fields: [collaborationData.toUserId], references: [users.id], relationName: "toUser" }),
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
  businessRole: one(businessRoles, { fields: [studentProgress.businessRoleId], references: [businessRoles.id] }),
}));

export const trainingTasksRelations = relations(trainingTasks, ({ one, many }) => ({
  teacher: one(users, { fields: [trainingTasks.teacherId], references: [users.id] }),
  experiment: one(experiments, { fields: [trainingTasks.experimentId], references: [experiments.id] }),
  results: many(experimentResults),
  roleAssignments: many(userBusinessRoles),
  collaborationData: many(collaborationData),
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
  role: z.enum(["student", "teacher", "admin"]).default("student"),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  password: z.string().min(1, "请输入密码"),
  role: z.enum(["student", "teacher", "admin"]),
});

export const insertBusinessRoleSchema = createInsertSchema(businessRoles).omit({
  id: true,
  createdAt: true,
});

export const insertUserBusinessRoleSchema = createInsertSchema(userBusinessRoles).omit({
  id: true,
  assignedAt: true,
});

export const insertCollaborationDataSchema = createInsertSchema(collaborationData).omit({
  id: true,
  createdAt: true,
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

export type BusinessRole = typeof businessRoles.$inferSelect;
export type InsertBusinessRole = z.infer<typeof insertBusinessRoleSchema>;
export type UserBusinessRole = typeof userBusinessRoles.$inferSelect;
export type InsertUserBusinessRole = z.infer<typeof insertUserBusinessRoleSchema>;
export type CollaborationData = typeof collaborationData.$inferSelect;
export type InsertCollaborationData = z.infer<typeof insertCollaborationDataSchema>;

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

// 双层角色体系相关常量
export const PRODUCT_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher", 
  ADMIN: "admin"
} as const;

export const BUSINESS_ROLES = {
  ENTERPRISE_OPERATOR: "enterprise_operator",     // 跨境电商企业操作员
  CUSTOMS_OFFICER: "customs_officer",             // 海关审核员
  LOGISTICS_OPERATOR: "logistics_operator",       // 物流企业操作员
  PLATFORM_SPECIALIST: "platform_specialist",    // 跨境电商平台专员（系统自动）
  SERVICE_SPECIALIST: "service_specialist",      // 综合服务企业专员（系统自动）
} as const;

export const SCENES = {
  ENTERPRISE: "enterprise_scene",                 // 电商企业场景
  CUSTOMS: "customs_scene",                       // 海关场景
  CUSTOMS_SUPERVISION: "customs_supervision_scene", // 海关监管作业场所场景
  OVERSEAS_WAREHOUSE: "overseas_warehouse_scene",  // 海外仓库场景
  BUYER_HOME: "buyer_home_scene"                   // 买家居家场景
} as const;

export const WORKFLOWS = {
  PREPARATION: "preparation",                     // 前期准备
  EXPORT_DECLARATION: "export_declaration",      // 出口申报
  INSPECTION_RELEASE: "inspection_release",      // 查验放行
  DESTINATION_CLEARANCE: "destination_clearance", // 目的国入境清关
  OVERSEAS_DELIVERY: "overseas_delivery",        // 境外配送
  TAX_REFUND: "tax_refund"                       // 退税申报
} as const;
