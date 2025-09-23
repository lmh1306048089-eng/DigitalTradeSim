import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  jsonb, 
  boolean,
  numeric,
  index,
  unique
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

// 海关申报表单主表
export const declarationForms = pgTable("declaration_forms", {
  id: varchar("id", { length: 36 }).primaryKey(),
  
  // 基本申报信息
  preEntryNo: varchar("pre_entry_no", { length: 50 }), // 预录入编号
  customsNo: varchar("customs_no", { length: 50 }), // 海关编号
  consignorConsignee: varchar("consignor_consignee", { length: 200 }).notNull(), // 收发货人
  productionSalesUnit: varchar("production_sales_unit", { length: 200 }), // 生产销售单位
  declarationUnit: varchar("declaration_unit", { length: 200 }), // 申报单位
  filingNo: varchar("filing_no", { length: 50 }), // 备案号
  licenseNo: varchar("license_no", { length: 50 }), // 许可证号
  
  // 合同与发票信息
  contractNo: varchar("contract_no", { length: 50 }), // 合同协议号
  invoiceNo: varchar("invoice_no", { length: 50 }), // 发票号
  tradeTerms: varchar("trade_terms", { length: 20 }), // 成交方式(FOB/CIF/etc)
  
  // 贸易信息
  exportPort: varchar("export_port", { length: 100 }).notNull(), // 出口口岸
  exportDate: timestamp("export_date"), // 出口日期
  declareDate: timestamp("declare_date").defaultNow().notNull(), // 申报日期
  transportMode: varchar("transport_mode", { length: 50 }).notNull(), // 运输方式
  transportName: varchar("transport_name", { length: 100 }), // 运输工具名称
  billNo: varchar("bill_no", { length: 50 }), // 提运单号
  containerNos: jsonb("container_nos").$type<string[]>(), // 集装箱号列表
  supervisionMode: varchar("supervision_mode", { length: 20 }), // 监管方式
  exemptionNature: varchar("exemption_nature", { length: 50 }), // 征免性质
  tradeCountry: varchar("trade_country", { length: 50 }), // 贸易国(地区)
  arrivalCountry: varchar("arrival_country", { length: 50 }), // 运抵国(地区)
  originCountry: varchar("origin_country", { length: 50 }), // 启运国(地区)
  finalDestCountry: varchar("final_dest_country", { length: 50 }), // 最终目的国(地区)
  transitPort: varchar("transit_port", { length: 100 }), // 经停港
  inlandDest: varchar("inland_dest", { length: 100 }), // 境内目的地
  goodsLocation: varchar("goods_location", { length: 200 }), // 货物存放地点
  domesticSource: varchar("domestic_source", { length: 100 }), // 境内货源地
  
  // 金融信息
  currency: varchar("currency", { length: 10 }).default("USD"), // 币制
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }), // 汇率
  totalAmountForeign: numeric("total_amount_foreign", { precision: 18, scale: 2 }), // 外币总价
  totalAmountCNY: numeric("total_amount_cny", { precision: 18, scale: 2 }), // 人民币总价
  freight: numeric("freight", { precision: 15, scale: 2 }), // 运费
  insurance: numeric("insurance", { precision: 15, scale: 2 }), // 保险费
  otherCharges: numeric("other_charges", { precision: 15, scale: 2 }), // 杂费
  
  // 计量与包装
  packages: integer("packages"), // 件数
  packageType: varchar("package_type", { length: 50 }), // 包装种类
  grossWeight: numeric("gross_weight", { precision: 10, scale: 3 }), // 毛重(千克)
  netWeight: numeric("net_weight", { precision: 10, scale: 3 }), // 净重(千克)
  
  // 申报相关信息
  declarationLocation: varchar("declaration_location", { length: 100 }), // 申报地点
  customsDistrict: varchar("customs_district", { length: 50 }), // 关区代码
  declarationPerson: varchar("declaration_person", { length: 50 }), // 申报人员
  declarationPhone: varchar("declaration_phone", { length: 20 }), // 申报联系电话
  
  // 标记唛码及备注
  marksAndNotes: text("marks_and_notes"), // 标记唛码及备注
  
  // 申报声明与选项
  inspectionQuarantine: boolean("inspection_quarantine").default(false), // 检验检疫(是/否)
  priceInfluenceFactor: boolean("price_influence_factor").default(false), // 价格影响因素(是/否)  
  paymentSettlementUsage: boolean("payment_settlement_usage").default(false), // 支付/结汇方式使用情况(是/否)
  specialRelationshipConfirm: boolean("special_relationship_confirm").default(false), // 特殊关系确认
  priceInfluenceConfirm: boolean("price_influence_confirm").default(false), // 价格影响确认
  royaltyPaymentConfirm: boolean("royalty_payment_confirm").default(false), // 支付特许权使用费确认
  
  // 随附单证
  supportingDocuments: text("supporting_documents"), // 随附单证信息
  
  // 录入和申报人员信息
  entryPersonnel: varchar("entry_personnel", { length: 50 }), // 录入人员
  entryUnit: varchar("entry_unit", { length: 200 }), // 录入单位
  unitAddress: text("unit_address"), // 单位地址
  fillDate: timestamp("fill_date"), // 填制日期
  
  // 元数据
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  experimentId: varchar("experiment_id", { length: 36 }).references(() => experiments.id),
  resultId: varchar("result_id", { length: 36 }).references(() => experimentResults.id),
  status: varchar("status", { length: 20 }).default("draft"), // draft, submitted, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("declaration_forms_user_id_idx").on(table.userId),
  experimentIdIdx: index("declaration_forms_experiment_id_idx").on(table.experimentId),
  resultIdIdx: index("declaration_forms_result_id_idx").on(table.resultId),
}));

// 海关申报商品明细表
export const declarationItems = pgTable("declaration_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  declarationFormId: varchar("declaration_form_id", { length: 36 }).notNull().references(() => declarationForms.id, { onDelete: "cascade" }),
  
  // 商品信息
  itemNo: integer("item_no").notNull(), // 项号
  goodsCode: varchar("goods_code", { length: 20 }), // 商品编号(HS)
  goodsNameSpec: text("goods_name_spec").notNull(), // 商品名称/规格型号
  
  // 数量和单位 (支持双重计量)
  quantity1: numeric("quantity1", { precision: 17, scale: 3 }).notNull(), // 第一数量
  unit1: varchar("unit1", { length: 20 }).notNull(), // 第一单位
  quantity2: numeric("quantity2", { precision: 17, scale: 3 }), // 第二数量
  unit2: varchar("unit2", { length: 20 }), // 第二单位
  
  // 价格信息
  unitPrice: numeric("unit_price", { precision: 15, scale: 4 }).notNull(), // 单价
  totalPrice: numeric("total_price", { precision: 18, scale: 2 }).notNull(), // 总价
  currency: varchar("currency", { length: 10 }).default("USD"), // 币制
  
  // 原产地和贸易信息
  originCountry: varchar("origin_country", { length: 50 }), // 原产国
  finalDestCountry: varchar("final_dest_country", { length: 50 }), // 最终目的国(地区)
  
  // 税务和监管信息
  exemption: varchar("exemption", { length: 50 }), // 征免
  taxCode: varchar("tax_code", { length: 20 }), // 税号
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }), // 税率
  dutyRate: numeric("duty_rate", { precision: 5, scale: 2 }), // 关税税率
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }), // 增值税税率
  preference: varchar("preference", { length: 50 }), // 优惠贸易协定
  
  // 附加信息
  brand: varchar("brand", { length: 100 }), // 品牌
  model: varchar("model", { length: 100 }), // 型号
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // 确保同一申报单内项号唯一
  uniqueItemNo: unique("declaration_items_unique_item_no").on(table.declarationFormId, table.itemNo),
}));

// 申报表单测试数据表
export const declarationTestData = pgTable("declaration_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  experimentKey: varchar("experiment_key", { length: 100 }).notNull(), // 实验标识符
  dataSetName: varchar("data_set_name", { length: 100 }).notNull().default("默认测试企业"), // 数据集名称
  
  // 基本申报信息
  preEntryNo: varchar("pre_entry_no", { length: 50 }),
  customsNo: varchar("customs_no", { length: 50 }),
  consignorConsignee: varchar("consignor_consignee", { length: 200 }).notNull(),
  productionSalesUnit: varchar("production_sales_unit", { length: 200 }),
  declarationUnit: varchar("declaration_unit", { length: 200 }),
  filingNo: varchar("filing_no", { length: 50 }),
  licenseNo: varchar("license_no", { length: 50 }),
  
  // 贸易信息 
  exportPort: varchar("export_port", { length: 100 }).notNull(),
  exportDate: varchar("export_date", { length: 10 }),
  declareDate: varchar("declare_date", { length: 10 }).notNull(),
  transportMode: varchar("transport_mode", { length: 50 }).notNull(),
  transportName: varchar("transport_name", { length: 100 }),
  billNo: varchar("bill_no", { length: 50 }),
  supervisionMode: varchar("supervision_mode", { length: 20 }),
  exemptionNature: varchar("exemption_nature", { length: 50 }),
  tradeCountry: varchar("trade_country", { length: 50 }),
  arrivalCountry: varchar("arrival_country", { length: 50 }),
  originCountry: varchar("origin_country", { length: 50 }),
  finalDestCountry: varchar("final_dest_country", { length: 50 }),
  transitPort: varchar("transit_port", { length: 100 }),
  inlandDest: varchar("inland_dest", { length: 100 }),
  goodsLocation: varchar("goods_location", { length: 200 }),
  
  // 计量与包装
  packages: integer("packages"),
  packageType: varchar("package_type", { length: 50 }),
  grossWeight: numeric("gross_weight", { precision: 10, scale: 3 }),
  netWeight: numeric("net_weight", { precision: 10, scale: 3 }),
  
  // 标记唛码及备注
  marksAndNotes: text("marks_and_notes"),
  
  // 商品明细数据(JSON格式存储)
  itemsData: jsonb("items_data").$type<{
    itemNo: number;
    goodsCode: string;
    goodsNameSpec: string;
    quantity: number;
    unit: string;
    finalDestCountry?: string;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    exemption?: string;
  }[]>(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 海关申报表单相关 schema
export const insertDeclarationFormSchema = createInsertSchema(declarationForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  consignorConsignee: z.string().min(2, "收发货人不能少于2个字符"),
  exportPort: z.string().min(2, "出口口岸不能为空"),
  transportMode: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"], {
    errorMap: () => ({ message: "请选择有效的运输方式" })
  }), // 1-江海, 2-铁路, 3-公路, 4-航空, 5-邮政, 6-固定运输, 7-管道运输, 8-内陆水运, 9-其他
  supervisionMode: z.enum(["0110", "1210", "1239", "9610", "9710", "9810"], {
    errorMap: () => ({ message: "请选择有效的监管方式" })
  }).optional(),
  status: z.enum(["draft", "submitted", "completed"], {
    errorMap: () => ({ message: "状态必须为草稿、已提交或已完成" })
  }).optional(),
  tradeTerms: z.enum(["FOB", "CIF", "CFR", "EXW", "FCA", "CPT", "CIP", "DAT", "DAP", "DDP"], {
    errorMap: () => ({ message: "请选择有效的贸易条款" })
  }).optional(),
  currency: z.string().length(3, "币种代码必须为3位"),
  exchangeRate: z.number().positive("汇率必须为正数").optional(),
  totalAmountForeign: z.number().positive("外币总价必须为正数").optional(),
  totalAmountCNY: z.number().positive("人民币总价必须为正数").optional(),
  packages: z.number().int().positive("件数必须为正整数").optional(),
  grossWeight: z.number().positive("毛重必须为正数").optional(),
  netWeight: z.number().positive("净重必须为正数").optional(),
  declarationPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号").optional(),
  containerNos: z.array(z.string().min(1, "集装箱号不能为空")).optional(),
  
  // PDF标准新增字段
  billNo: z.string().optional(), // 提运单号
  exemptionNature: z.string().optional(), // 征免性质
  transitPort: z.string().optional(), // 指运港/经停港
  domesticSource: z.string().optional(), // 境内货源地
  
  // 核心字段验证
  declareDate: z.coerce.date(), // 申报日期 - 必填
  licenseNo: z.string().optional(), // 许可证号 - 可选
  
  // 已移除字段 - 设为可选以保持向后兼容
  invoiceNo: z.string().optional(), // 发票号 - 已从UI移除
  inspectionQuarantine: z.boolean().optional().default(false), // 已从UI移除
  priceInfluenceFactor: z.boolean().optional().default(false), // 已从UI移除
  paymentSettlementUsage: z.boolean().optional().default(false), // 已从UI移除
  
  // 确认声明字段 - 保持为复选框
  specialRelationshipConfirm: z.boolean().optional().default(false), // 特殊关系确认
  priceInfluenceConfirm: z.boolean().optional().default(false), // 价格影响确认
  royaltyPaymentConfirm: z.boolean().optional().default(false), // 支付特许权使用费确认
  
  // 随附单证和人员信息
  supportingDocuments: z.string().optional(), // 随附单证
  entryPersonnel: z.string().min(1, "录入人员不能为空").optional(), // 录入人员
  entryUnit: z.string().min(2, "录入单位不能少于2个字符").optional(), // 录入单位
  unitAddress: z.string().optional(), // 单位地址
  fillDate: z.coerce.date().optional(), // 填制日期
});

export const insertDeclarationItemSchema = createInsertSchema(declarationItems).omit({
  id: true,
  createdAt: true,
}).extend({
  // 必填字段
  itemNo: z.number().int().positive("项号必须为正整数"),
  goodsCode: z.string().regex(/^\d{8,10}$/, "商品编号(HS)必须为8-10位数字").optional(), // 商品编号
  goodsNameSpec: z.string().min(2, "商品名称/规格型号不能少于2个字符"),
  quantity1: z.number().positive("数量必须为正数"),
  unit1: z.string().min(1, "单位不能为空"),
  unitPrice: z.number().positive("单价必须为正数"),
  totalPrice: z.number().positive("总价必须为正数"),
  currency: z.string().length(3, "币种代码必须为3位").default("USD"),
  
  // 新增的9列格式必需字段
  finalDestCountry: z.string().min(2, "最终目的地国(地区)不能为空").optional(), // 最终目的地国
  exemption: z.string().min(1, "征免代码不能为空").optional(), // 征免
  
  // 可选字段
  quantity2: z.number().positive("第二数量必须为正数").optional(),
  unit2: z.string().min(1, "第二单位不能为空").optional(),
  originCountry: z.string().optional(), // 原产国
  taxRate: z.number().min(0).max(100, "税率必须在0-100之间").optional(),
  dutyRate: z.number().min(0).max(100, "关税税率必须在0-100之间").optional(),
  vatRate: z.number().min(0).max(100, "增值税税率必须在0-100之间").optional(),
});

export const insertDeclarationTestDataSchema = createInsertSchema(declarationTestData).omit({
  id: true,
  createdAt: true,
});

// 关系定义
export const declarationFormsRelations = relations(declarationForms, ({ one, many }) => ({
  user: one(users, { fields: [declarationForms.userId], references: [users.id] }),
  experiment: one(experiments, { fields: [declarationForms.experimentId], references: [experiments.id] }),
  items: many(declarationItems),
}));

export const declarationItemsRelations = relations(declarationItems, ({ one }) => ({
  declarationForm: one(declarationForms, { 
    fields: [declarationItems.declarationFormId], 
    references: [declarationForms.id] 
  }),
}));

// 申报表单类型定义
export type DeclarationForm = typeof declarationForms.$inferSelect;
export type InsertDeclarationForm = z.infer<typeof insertDeclarationFormSchema>;
export type DeclarationItem = typeof declarationItems.$inferSelect;
export type InsertDeclarationItem = z.infer<typeof insertDeclarationItemSchema>;
export type DeclarationTestData = typeof declarationTestData.$inferSelect;
export type InsertDeclarationTestData = z.infer<typeof insertDeclarationTestDataSchema>;

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

// 传输ID申请测试数据表
export const transmissionIdTestData = pgTable("transmission_id_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  // 企业基本信息
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  businessAddress: text("business_address").notNull(),
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  businessScope: text("business_scope").notNull(),
  // 传输ID申请特有字段
  applicationMode: varchar("application_mode", { length: 20 }).notNull(), // 申请模式：declaration（报关单模式）或manifest（清单模式）
  applicantName: varchar("applicant_name", { length: 50 }).notNull(), // 申请人姓名
  applicantIdCard: varchar("applicant_id_card", { length: 18 }).notNull(), // 申请人身份证号
  applicantPosition: varchar("applicant_position", { length: 50 }).notNull(), // 申请人职务
  applicantPhone: varchar("applicant_phone", { length: 11 }).notNull(), // 申请人联系电话
  customsRegistrationNumber: varchar("customs_registration_number", { length: 30 }), // 海关注册编号
  enterpriseType: varchar("enterprise_type", { length: 50 }).notNull(), // 企业类型
  businessCategory: varchar("business_category", { length: 100 }).notNull(), // 经营类别
  expectedUsage: text("expected_usage").notNull(), // 预计使用用途
  systemIntegrationMethod: varchar("system_integration_method", { length: 100 }), // 系统对接方式
  technicalContactPerson: varchar("technical_contact_person", { length: 50 }), // 技术对接联系人
  technicalContactPhone: varchar("technical_contact_phone", { length: 11 }), // 技术联系电话
  dataInterfaceRequirement: text("data_interface_requirement"), // 数据接口需求
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 传输ID申请测试数据相关 schema
export const insertTransmissionIdTestDataSchema = createInsertSchema(transmissionIdTestData).omit({
  id: true,
  createdAt: true,
});

export type TransmissionIdTestData = typeof transmissionIdTestData.$inferSelect;
export type InsertTransmissionIdTestData = z.infer<typeof insertTransmissionIdTestDataSchema>;

// 海外仓业务模式备案测试数据表
export const overseasWarehouseTestData = pgTable("overseas_warehouse_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  // 企业基本信息
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  businessAddress: text("business_address").notNull(),
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  businessScope: text("business_scope").notNull(),
  registeredCapital: integer("registered_capital").notNull(), // 注册资本（万元）
  // 海外仓出口企业备案登记表字段
  exportBusinessScope: text("export_business_scope").notNull(), // 出口经营范围
  overseasWarehouseCountry: varchar("overseas_warehouse_country", { length: 50 }).notNull(), // 海外仓所在国家
  overseasWarehouseAddress: text("overseas_warehouse_address").notNull(), // 海外仓地址
  warehouseOperatingModel: varchar("warehouse_operating_model", { length: 50 }).notNull(), // 仓库运营模式：自营/第三方
  expectedAnnualExportVolume: integer("expected_annual_export_volume").notNull(), // 预计年出口量（万美元）
  mainExportProducts: text("main_export_products").notNull(), // 主要出口商品
  targetMarkets: text("target_markets").notNull(), // 目标市场
  // 海外仓信息登记表字段
  warehouseName: varchar("warehouse_name", { length: 200 }).notNull(), // 海外仓名称
  warehouseCode: varchar("warehouse_code", { length: 50 }).notNull(), // 海外仓编码
  warehouseArea: numeric("warehouse_area", { precision: 10, scale: 2 }).notNull(), // 仓库面积（平方米）
  storageCapacity: integer("storage_capacity").notNull(), // 储存能力（立方米）
  warehouseType: varchar("warehouse_type", { length: 50 }).notNull(), // 仓库类型：保税仓/一般贸易仓
  operatingLicense: varchar("operating_license", { length: 100 }), // 运营许可证号
  warehouseContactPerson: varchar("warehouse_contact_person", { length: 50 }).notNull(), // 仓库联系人
  warehouseContactPhone: varchar("warehouse_contact_phone", { length: 20 }).notNull(), // 仓库联系电话
  warehouseManagementSystem: varchar("warehouse_management_system", { length: 100 }), // 仓库管理系统
  // 海外仓所有权信息
  ownershipType: varchar("ownership_type", { length: 50 }).notNull(), // 所有权类型：自有/租赁/委托管理
  leaseAgreementNumber: varchar("lease_agreement_number", { length: 50 }), // 租赁协议编号
  leaseStartDate: varchar("lease_start_date", { length: 20 }), // 租赁开始日期
  leaseEndDate: varchar("lease_end_date", { length: 20 }), // 租赁结束日期
  lessorInformation: text("lessor_information"), // 出租方信息
  // 海关相关信息
  customsSupervisionCode: varchar("customs_supervision_code", { length: 50 }), // 海关监管代码
  bonded_area_code: varchar("bonded_area_code", { length: 50 }), // 保税区域代码
  warehouseRegistrationNumber: varchar("warehouse_registration_number", { length: 50 }), // 仓库注册编号
  insuranceInformation: text("insurance_information"), // 保险信息
  emergencyContactInfo: text("emergency_contact_info"), // 应急联系信息
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 海外仓备案测试数据相关 schema
export const insertOverseasWarehouseTestDataSchema = createInsertSchema(overseasWarehouseTestData).omit({
  id: true,
  createdAt: true,
});

export type OverseasWarehouseTestData = typeof overseasWarehouseTestData.$inferSelect;
export type InsertOverseasWarehouseTestData = z.infer<typeof insertOverseasWarehouseTestDataSchema>;

// 报关单模式出口申报测试数据表
export const customsDeclarationExportTestData = pgTable("customs_declaration_export_test_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  dataSetName: varchar("data_set_name", { length: 100 }).notNull(), // 测试数据集名称
  
  // 企业基本信息
  companyName: varchar("company_name", { length: 200 }).notNull(),
  unifiedCreditCode: varchar("unified_credit_code", { length: 18 }).notNull(),
  legalRepresentative: varchar("legal_representative", { length: 50 }).notNull(),
  registeredAddress: text("registered_address").notNull(),
  businessAddress: text("business_address").notNull(),
  contactPerson: varchar("contact_person", { length: 50 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 11 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  businessLicense: varchar("business_license", { length: 30 }).notNull(),
  customsCode: varchar("customs_code", { length: 20 }).notNull(), // 海关代码
  
  // 货物运抵申报信息
  arrivalReportNumber: varchar("arrival_report_number", { length: 30 }).notNull(), // 运抵报告编号
  transportMode: varchar("transport_mode", { length: 20 }).notNull(), // 运输方式
  transportToolNumber: varchar("transport_tool_number", { length: 50 }).notNull(), // 运输工具编号
  departurePort: varchar("departure_port", { length: 100 }).notNull(), // 启运港
  destinationPort: varchar("destination_port", { length: 100 }).notNull(), // 目的港
  expectedArrivalDate: varchar("expected_arrival_date", { length: 20 }).notNull(), // 预计到达日期
  actualArrivalDate: varchar("actual_arrival_date", { length: 20 }).notNull(), // 实际到达日期
  supervisoryArea: varchar("supervisory_area", { length: 100 }).notNull(), // 监管场所
  
  // 订仓单信息
  bookingOrderNumber: varchar("booking_order_number", { length: 30 }).notNull(), // 订仓单号
  shippingCompany: varchar("shipping_company", { length: 200 }).notNull(), // 船公司
  vesselName: varchar("vessel_name", { length: 100 }).notNull(), // 船名
  voyageNumber: varchar("voyage_number", { length: 30 }).notNull(), // 航次号
  containerNumber: varchar("container_number", { length: 30 }).notNull(), // 集装箱号
  containerType: varchar("container_type", { length: 20 }).notNull(), // 集装箱类型
  sealNumber: varchar("seal_number", { length: 30 }).notNull(), // 封条号
  
  // 货物申报信息
  goodsDescription: text("goods_description").notNull(), // 货物描述
  hsCode: varchar("hs_code", { length: 20 }).notNull(), // HS编码
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(), // 数量
  unit: varchar("unit", { length: 10 }).notNull(), // 计量单位
  unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).notNull(), // 单价
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).notNull(), // 总价值
  currency: varchar("currency", { length: 3 }).notNull().default("USD"), // 币制
  grossWeight: numeric("gross_weight", { precision: 12, scale: 3 }).notNull(), // 毛重（千克）
  netWeight: numeric("net_weight", { precision: 12, scale: 3 }).notNull(), // 净重（千克）
  packageQuantity: integer("package_quantity").notNull(), // 件数
  packageType: varchar("package_type", { length: 50 }).notNull(), // 包装种类
  
  // 贸易方式和征免性质
  tradeMode: varchar("trade_mode", { length: 10 }).notNull(), // 贸易方式代码
  exemptionMethod: varchar("exemption_method", { length: 10 }).notNull(), // 征免性质代码
  
  // 收发货人信息
  consignorName: varchar("consignor_name", { length: 200 }).notNull(), // 发货人名称
  consignorAddress: text("consignor_address").notNull(), // 发货人地址
  consigneeName: varchar("consignee_name", { length: 200 }).notNull(), // 收货人名称
  consigneeAddress: text("consignee_address").notNull(), // 收货人地址
  consigneeCountry: varchar("consignee_country", { length: 50 }).notNull(), // 收货人国家
  
  // 申报任务信息
  declarationTaskId: varchar("declaration_task_id", { length: 50 }).notNull(), // 申报任务ID
  declarationSystemType: varchar("declaration_system_type", { length: 50 }).notNull(), // 申报系统类型
  declarationMode: varchar("declaration_mode", { length: 50 }).notNull().default("declaration"), // 申报模式
  
  // 单一窗口信息
  singleWindowNumber: varchar("single_window_number", { length: 30 }).notNull(), // 单一窗口编号
  customsDeclarationNumber: varchar("customs_declaration_number", { length: 30 }).notNull(), // 报关单号
  declarationStatus: varchar("declaration_status", { length: 50 }).notNull().default("draft"), // 申报状态
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 报关单模式出口申报测试数据相关 schema
export const insertCustomsDeclarationExportTestDataSchema = createInsertSchema(customsDeclarationExportTestData).omit({
  id: true,
  createdAt: true,
});

export type CustomsDeclarationExportTestData = typeof customsDeclarationExportTestData.$inferSelect;
export type InsertCustomsDeclarationExportTestData = z.infer<typeof insertCustomsDeclarationExportTestDataSchema>;

// 出口申报相关数据表（支持报关单模式业务流程）

// 出口申报任务表（主表）
export const exportDeclarations = pgTable("export_declarations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  declarationMode: varchar("declaration_mode", { length: 20 }).notNull().default("declaration"), // declaration（报关单模式）, manifest（清单模式）
  title: varchar("title", { length: 200 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, booking_pushed, declaration_pushed, under_review, approved, rejected
  
  // 综合服务平台相关数据
  templateDownloaded: boolean("template_downloaded").default(false),
  dataImported: boolean("data_imported").default(false),
  taskCreated: boolean("task_created").default(false),
  dataGenerated: boolean("data_generated").default(false),
  bookingOrderPushed: boolean("booking_order_pushed").default(false),
  
  // 出口统一版系统相关数据
  goodsInfoFilled: boolean("goods_info_filled").default(false),
  declarationPushed: boolean("declaration_pushed").default(false),
  customsValidated: boolean("customs_validated").default(false),
  
  // 业务数据
  importedData: jsonb("imported_data").$type<any>(), // 导入的基础数据
  taskInfo: jsonb("task_info").$type<{
    taskId: string;
    taskName: string;
    priority: string;
  }>(), // 申报任务信息
  generatedData: jsonb("generated_data").$type<any>(), // 生成的申报数据
  goodsDeclaration: jsonb("goods_declaration").$type<any>(), // 货物申报信息
  
  // 时间戳
  readyAt: timestamp("ready_at"), // 海关审核准备时间（用于模拟延迟）
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 订仓单表
export const bookingOrders = pgTable("booking_orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  declarationId: varchar("declaration_id", { length: 36 }).notNull().references(() => exportDeclarations.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("created"), // created, pushed, confirmed, failed
  platform: varchar("platform", { length: 50 }).notNull().default("comprehensive_service"), // 跨境电商综合服务平台
  
  // 订仓单数据
  orderData: jsonb("order_data").$type<{
    shipper: any;
    consignee: any;
    goods: any[];
    transport: any;
  }>(),
  
  pushedAt: timestamp("pushed_at"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 数据导入任务表
export const importJobs = pgTable("import_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  declarationId: varchar("declaration_id", { length: 36 }).notNull().references(() => exportDeclarations.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  
  status: varchar("status", { length: 20 }).notNull().default("processing"), // processing, completed, failed
  progress: integer("progress").default(0), // 0-100
  
  // 导入结果
  importResult: jsonb("import_result").$type<{
    recordCount: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  }>(),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 提交历史记录表（记录各个推送步骤的历史）
export const submissionHistory = pgTable("submission_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  declarationId: varchar("declaration_id", { length: 36 }).notNull().references(() => exportDeclarations.id, { onDelete: "cascade" }),
  
  submissionType: varchar("submission_type", { length: 30 }).notNull(), // booking_order, declaration, customs_validation
  platform: varchar("platform", { length: 50 }).notNull(), // comprehensive_service, unified_export, single_window
  status: varchar("status", { length: 20 }).notNull(), // sent, processing, success, failed
  
  // 提交数据和响应
  requestData: jsonb("request_data").$type<any>(),
  responseData: jsonb("response_data").$type<any>(),
  errorMessage: text("error_message"),
  
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// 新增的插入和选择模式
export const insertExportDeclarationSchema = createInsertSchema(exportDeclarations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingOrderSchema = createInsertSchema(bookingOrders).omit({
  id: true,
  createdAt: true,
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionHistorySchema = createInsertSchema(submissionHistory).omit({
  id: true,
  submittedAt: true,
});

// Update schemas for API validation (whitelist updatable fields)
export const updateExportDeclarationSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["draft", "booking_pushed", "declaration_pushed", "under_review", "approved", "rejected"]).optional(),
  templateDownloaded: z.boolean().optional(),
  dataImported: z.boolean().optional(),
  taskCreated: z.boolean().optional(),
  dataGenerated: z.boolean().optional(),
  bookingOrderPushed: z.boolean().optional(),
  goodsInfoFilled: z.boolean().optional(),
  declarationPushed: z.boolean().optional(),
  customsValidated: z.boolean().optional(),
  importedData: z.any().optional(),
  taskInfo: z.object({
    taskId: z.string(),
    taskName: z.string(),
    priority: z.string(),
  }).optional(),
  generatedData: z.any().optional(),
  goodsDeclaration: z.any().optional(),
  readyAt: z.date().optional(),
});

export const updateBookingOrderSchema = z.object({
  orderNumber: z.string().optional(),
  status: z.enum(["draft", "submitted", "confirmed", "rejected"]).optional(),
  orderData: z.any().optional(),
  submittedAt: z.date().optional(),
  confirmedAt: z.date().optional(),
});

export const updateImportJobSchema = z.object({
  jobName: z.string().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  importType: z.string().optional(),
  sourceFile: z.string().optional(),
  importedData: z.any().optional(),
  errorMessage: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type ExportDeclaration = typeof exportDeclarations.$inferSelect;
export type InsertExportDeclaration = z.infer<typeof insertExportDeclarationSchema>;

export type BookingOrder = typeof bookingOrders.$inferSelect;
export type InsertBookingOrder = z.infer<typeof insertBookingOrderSchema>;

export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;

export type SubmissionHistory = typeof submissionHistory.$inferSelect;
export type InsertSubmissionHistory = z.infer<typeof insertSubmissionHistorySchema>;
export type UpdateExportDeclaration = z.infer<typeof updateExportDeclarationSchema>;
export type UpdateBookingOrder = z.infer<typeof updateBookingOrderSchema>;
export type UpdateImportJob = z.infer<typeof updateImportJobSchema>;
