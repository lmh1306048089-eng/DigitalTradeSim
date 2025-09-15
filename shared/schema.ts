import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  jsonb, 
  boolean,
  numeric
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// 产品用户角色表（第一层角色：决定系统基础权限）
// 保持现有结构兼容性，role字段对应产品用户角色
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
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
export const businessRoles = pgTable("business_roles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  roleCode: varchar("role_code", { length: 50 }).notNull().unique(),
  roleName: varchar("role_name", { length: 100 }).notNull(),
  description: text("description"),
  availableScenes: jsonb("available_scenes").$type<string[]>(), // 可进入的场景ID列表
  availableOperations: jsonb("available_operations").$type<string[]>(), // 可执行的操作列表
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 用户-业务角色关联表（记录学生在实训任务中选择的业务角色）
export const userBusinessRoles = pgTable("user_business_roles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  businessRoleId: varchar("business_role_id", { length: 36 }).notNull().references(() => businessRoles.id, { onDelete: "cascade" }),
  taskId: varchar("task_id", { length: 36 }).references(() => trainingTasks.id), // 关联到具体实训任务
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// 5大实训场景配置（物理空间/操作载体）
export const virtualScenes = pgTable("virtual_scenes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  // 基于业务角色的操作入口配置
  operationPoints: jsonb("operation_points").$type<{
    businessRoleCode: string;
    entryName: string;
    entryDescription: string;
    allowedOperations: string[];
  }[]>(),
  interactiveElements: jsonb("interactive_elements").$type<string[]>(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Experiment workflows
export const experiments = pgTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // preparation, declaration, inspection, etc.
  steps: jsonb("steps").$type<any[]>(),
  requirements: jsonb("requirements").$type<string[]>(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 学生进度跟踪（基于业务角色的操作记录）
export const studentProgress = pgTable("student_progress", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  businessRoleId: varchar("business_role_id", { length: 36 }).references(() => businessRoles.id), // 当前扮演的业务角色
  sceneId: varchar("scene_id", { length: 36 }).references(() => virtualScenes.id),
  status: varchar("status", { length: 20 }).notNull().default("not_started"), // not_started, in_progress, completed
  progress: integer("progress").notNull().default(0), // 0-100
  currentStep: integer("current_step").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent").default(0), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 业务协作数据表（记录角色间的数据流转）
export const collaborationData = pgTable("collaboration_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => trainingTasks.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id", { length: 36 }).notNull().references(() => users.id),
  fromRoleCode: varchar("from_role_code", { length: 50 }).notNull(), // 发起方业务角色
  toUserId: varchar("to_user_id", { length: 36 }).references(() => users.id), // 接收方用户（可为空，如系统自动处理）
  toRoleCode: varchar("to_role_code", { length: 50 }).notNull(), // 接收方业务角色
  dataType: varchar("data_type", { length: 100 }).notNull(), // 数据类型：backup_application, customs_declaration, etc.
  data: jsonb("data").$type<any>(), // 协作数据内容
  status: varchar("status", { length: 20 }).default("pending"), // pending, processed, completed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 实训任务表（教师分配，支持业务角色分工）
export const trainingTasks = pgTable("training_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  // 任务需要的业务角色配置
  requiredBusinessRoles: jsonb("required_business_roles").$type<string[]>(), // 必需的业务角色代码列表
  // 学生-业务角色分配
  roleAssignments: jsonb("role_assignments").$type<{
    studentId: string;
    businessRoleCode: string;
  }[]>(),
  assignedStudents: jsonb("assigned_students").$type<string[]>(),
  taskType: varchar("task_type", { length: 20 }).default("individual"), // individual（单人实训）, group（小组实训）
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student submissions and evaluation results
export const experimentResults = pgTable("experiment_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).notNull().references(() => experiments.id, { onDelete: "cascade" }),
  taskId: varchar("task_id", { length: 36 }).references(() => trainingTasks.id),
  submissionData: jsonb("submission_data").$type<any>(),
  score: numeric("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  evaluatedBy: varchar("evaluated_by", { length: 36 }).references(() => users.id),
  evaluatedAt: timestamp("evaluated_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// File uploads for training materials
export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: integer("size"),
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

// E-commerce qualification form submission schema
export const ecommerceQualificationSubmissionSchema = z.object({
  // 基本企业信息
  companyName: z.string().min(2, "企业名称至少2个字符"),
  unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
  businessLicenseNumber: z.string().min(15, "营业执照注册号不能少于15位"),
  
  // 法定代表人信息
  legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
  legalRepIdCard: z.string().regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, "请输入有效的身份证号码"),
  legalRepPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  
  // 企业地址信息
  registeredAddress: z.string().min(10, "注册地址信息不完整"),
  businessAddress: z.string().min(10, "经营地址信息不完整"),
  
  // 联系信息
  contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  
  // 对外贸易经营者备案信息
  tradeLicenseNumber: z.string().min(10, "对外贸易经营者备案登记表编号不能少于10位"),
  tradeScope: z.string().or(z.array(z.string())).transform(val => 
    typeof val === 'string' ? val.split(',') : val
  ),
  
  // 跨境电商海关备案号
  customsRecordNumber: z.string().min(10, "海关备案号不能少于10位"),
  
  // 外汇结算账户信息
  bankName: z.string().min(2, "开户银行名称不能少于2个字符"),
  accountNumber: z.string().min(10, "银行账号不能少于10位"),
  accountName: z.string().min(2, "账户名称不能少于2个字符"),
  
  // 税务备案信息
  taxRegistrationNumber: z.string().min(15, "税务登记证号不能少于15位"),
  vatNumber: z.string().optional(),
  
  // 生产能力信息
  productionCapacity: z.string().min(10, "请详细描述生产能力"),
  qualityCertification: z.string().or(z.array(z.string())).optional().transform(val => 
    typeof val === 'string' ? val.split(',') : val
  ),
  
  // 声明确认
  dataAccuracy: z.string().or(z.boolean()).transform(val => val === 'true' || val === true),
  legalResponsibility: z.string().or(z.boolean()).transform(val => val === 'true' || val === true),
  submitConsent: z.string().or(z.boolean()).transform(val => val === 'true' || val === true)
}).refine(data => data.dataAccuracy === true, {
  message: "必须确认数据真实性",
  path: ["dataAccuracy"]
}).refine(data => data.legalResponsibility === true, {
  message: "必须承诺承担法律责任", 
  path: ["legalResponsibility"]
}).refine(data => data.submitConsent === true, {
  message: "必须同意提交申请",
  path: ["submitConsent"]
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

// 工作流程实例表
export const workflowInstances = pgTable("workflow_instances", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowCode: varchar("workflow_code", { length: 50 }).notNull(),
  businessRoleCode: varchar("business_role_code", { length: 50 }).notNull(),
  initiatorUserId: varchar("initiator_user_id", { length: 36 }).notNull(),
  currentStep: integer("current_step").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, paused, failed
  stepData: jsonb("step_data"), // 存储各步骤的数据
  collaborators: jsonb("collaborators"), // 参与的其他角色用户
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 工作流程步骤执行记录表
export const workflowStepExecutions = pgTable("workflow_step_executions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  workflowInstanceId: varchar("workflow_instance_id", { length: 36 }).notNull(),
  stepNumber: integer("step_number").notNull(),
  executorUserId: varchar("executor_user_id", { length: 36 }).notNull(),
  businessRoleCode: varchar("business_role_code", { length: 50 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, failed
  executedAt: timestamp("executed_at").defaultNow(),
});

// 工作流程相关schema
export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepExecutionSchema = createInsertSchema(workflowStepExecutions).omit({
  id: true,
  executedAt: true,
});

// 工作流程类型定义
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;
export type WorkflowStepExecution = typeof workflowStepExecutions.$inferSelect;
export type InsertWorkflowStepExecution = z.infer<typeof insertWorkflowStepExecutionSchema>;

// 海关企业资质备案测试数据表
export const customsTestData = pgTable("customs_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  businessScope: jsonb("business_scope").$type<string[]>().notNull(),
  importExportLicense: varchar("import_export_license", { length: 30 }),
  registeredCapital: numeric("registered_capital", { precision: 15, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 海关测试数据相关 schema
export const insertCustomsTestDataSchema = createInsertSchema(customsTestData).omit({
  id: true,
  createdAt: true,
});

export type CustomsTestData = typeof customsTestData.$inferSelect;
export type InsertCustomsTestData = z.infer<typeof insertCustomsTestDataSchema>;

// 电子口岸IC卡申请测试数据表
export const icCardTestData = pgTable("ic_card_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  registeredCapital: numeric("registered_capital", { precision: 15, scale: 2 }).notNull(),
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  businessScope: jsonb("business_scope").$type<string[]>().notNull(),
  // IC卡申请特有字段
  operatorName: varchar("operator_name", { length: 50 }).notNull(), // 操作员姓名
  operatorIdCard: varchar("operator_id_card", { length: 18 }).notNull(), // 操作员身份证号
  customsDeclarantCertificate: varchar("customs_declarant_certificate", { length: 30 }).notNull(), // 报关人员备案证明编号
  foreignTradeRegistration: varchar("foreign_trade_registration", { length: 30 }).notNull(), // 对外贸易经营者备案登记表编号
  customsImportExportReceipt: varchar("customs_import_export_receipt", { length: 30 }).notNull(), // 海关进出口货物收发人备案回执编号
  applicationReason: text("application_reason").notNull(), // 申请原因
  expectedCardQuantity: integer("expected_card_quantity").notNull().default(1), // 预期申请卡片数量
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// IC卡测试数据相关 schema
export const insertIcCardTestDataSchema = createInsertSchema(icCardTestData).omit({
  id: true,
  createdAt: true,
});

export type IcCardTestData = typeof icCardTestData.$inferSelect;
export type InsertIcCardTestData = z.infer<typeof insertIcCardTestDataSchema>;

// 电商企业资质备案测试数据表
export const ecommerceQualificationTestData = pgTable("ecommerce_qualification_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  // 企业基本信息
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  legalRepresentativeIdCard: varchar("legal_representative_id_card", { length: 18 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  businessAddress: text("business_address").notNull(),
  registeredCapital: integer("registered_capital").notNull(), // 注册资本（万元）
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  // 经营资质信息
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  businessScope: text("business_scope").notNull(),
  foreignTradeRecord: varchar("foreign_trade_record", { length: 30 }).notNull(), // 对外贸易经营者备案登记表编号
  customsEcommerceRecord: varchar("customs_ecommerce_record", { length: 30 }).notNull(), // 跨境电商海关备案号
  establishmentDate: varchar("establishment_date", { length: 20 }).notNull(), // 企业成立日期
  businessValidityPeriod: varchar("business_validity_period", { length: 100 }).notNull(), // 营业期限
  // 产品与生产信息
  mainProducts: text("main_products").notNull(), // 主要经营产品
  productionCapacity: text("production_capacity").notNull(), // 年生产能力
  productCertification: varchar("product_certification", { length: 200 }).notNull(), // 产品认证证书编号
  qualityManagementSystem: varchar("quality_management_system", { length: 200 }), // 质量管理体系认证
  brandAuthorization: text("brand_authorization"), // 品牌授权情况
  supplierInformation: text("supplier_information").notNull(), // 主要供应商信息
  // 财务与税务信息
  foreignExchangeAccount: varchar("foreign_exchange_account", { length: 100 }).notNull(), // 外汇结算账户开户银行
  foreignExchangeAccountNumber: varchar("foreign_exchange_account_number", { length: 30 }).notNull(), // 外汇结算账户号
  taxRegistrationNumber: varchar("tax_registration_number", { length: 30 }).notNull(), // 税务登记证号
  taxpayerType: varchar("taxpayer_type", { length: 20 }).notNull(), // 纳税人类型
  annualTurnover: integer("annual_turnover").notNull(), // 上年度营业额（万元）
  exportVolume: integer("export_volume").notNull(), // 上年度出口额（万美元）
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 电商企业资质备案测试数据相关 schema
export const insertEcommerceQualificationTestDataSchema = createInsertSchema(ecommerceQualificationTestData).omit({
  id: true,
  createdAt: true,
});

export type EcommerceQualificationTestData = typeof ecommerceQualificationTestData.$inferSelect;
export type InsertEcommerceQualificationTestData = z.infer<typeof insertEcommerceQualificationTestDataSchema>;
