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
  workflowInstances,
  workflowStepExecutions,
  customsTestData,
  icCardTestData,
  ecommerceQualificationTestData,
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
  type WorkflowInstance,
  type InsertWorkflowInstance,
  type WorkflowStepExecution,
  type InsertWorkflowStepExecution,
  type CustomsTestData,
  type InsertCustomsTestData,
  type IcCardTestData,
  type InsertIcCardTestData,
  type EcommerceQualificationTestData,
  type InsertEcommerceQualificationTestData,
  transmissionIdTestData,
  type TransmissionIdTestData,
  type InsertTransmissionIdTestData,
  overseasWarehouseTestData,
  type OverseasWarehouseTestData,
  type InsertOverseasWarehouseTestData,
  customsDeclarationExportTestData,
  type CustomsDeclarationExportTestData,
  type InsertCustomsDeclarationExportTestData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

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
  
  // Workflow operations
  getUserWorkflows(userId: string, businessRoleCode: string): Promise<WorkflowInstance[]>;
  createWorkflowInstance(instance: InsertWorkflowInstance): Promise<WorkflowInstance>;
  executeWorkflowStep(workflowId: string, userId: string, stepExecution: any): Promise<any>;
  
  // Customs test data operations
  getCustomsTestData(): Promise<CustomsTestData[]>;
  getCustomsTestDataByName(dataSetName: string): Promise<CustomsTestData | undefined>;
  createCustomsTestData(testData: InsertCustomsTestData): Promise<CustomsTestData>;
  updateCustomsTestData(id: string, updates: Partial<CustomsTestData>): Promise<CustomsTestData>;
  
  // IC card test data operations
  getIcCardTestData(): Promise<IcCardTestData[]>;
  getIcCardTestDataByName(dataSetName: string): Promise<IcCardTestData | undefined>;
  createIcCardTestData(testData: InsertIcCardTestData): Promise<IcCardTestData>;
  updateIcCardTestData(id: string, updates: Partial<IcCardTestData>): Promise<IcCardTestData>;
  
  // E-commerce qualification test data operations
  getEcommerceQualificationTestData(): Promise<EcommerceQualificationTestData[]>;
  getEcommerceQualificationTestDataByName(dataSetName: string): Promise<EcommerceQualificationTestData | undefined>;
  createEcommerceQualificationTestData(testData: InsertEcommerceQualificationTestData): Promise<EcommerceQualificationTestData>;
  
  // Transmission ID test data operations
  getTransmissionIdTestData(): Promise<TransmissionIdTestData[]>;
  getTransmissionIdTestDataByName(dataSetName: string): Promise<TransmissionIdTestData | undefined>;
  createTransmissionIdTestData(testData: InsertTransmissionIdTestData): Promise<TransmissionIdTestData>;
  
  // Overseas warehouse test data operations
  getOverseasWarehouseTestData(): Promise<OverseasWarehouseTestData[]>;
  getOverseasWarehouseTestDataByName(dataSetName: string): Promise<OverseasWarehouseTestData | undefined>;
  createOverseasWarehouseTestData(testData: InsertOverseasWarehouseTestData): Promise<OverseasWarehouseTestData>;
  
  // Customs declaration export test data operations
  getCustomsDeclarationExportTestData(): Promise<CustomsDeclarationExportTestData[]>;
  getCustomsDeclarationExportTestDataByName(dataSetName: string): Promise<CustomsDeclarationExportTestData | undefined>;
  createCustomsDeclarationExportTestData(testData: InsertCustomsDeclarationExportTestData): Promise<CustomsDeclarationExportTestData>;
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
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      ...userData
    });
    const user = await this.getUser(userId);
    if (!user) throw new Error("Failed to create user");
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id));
    const user = await this.getUser(id);
    if (!user) throw new Error("Failed to update user");
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
    await db.insert(businessRoles).values([{
      roleCode: roleData.roleCode,
      roleName: roleData.roleName,
      description: roleData.description,
      availableScenes: roleData.availableScenes ? JSON.parse(JSON.stringify(roleData.availableScenes)) : [],
      availableOperations: roleData.availableOperations ? JSON.parse(JSON.stringify(roleData.availableOperations)) : [],
      isActive: roleData.isActive ?? true
    }]);
    const [insertedRole] = await db.select().from(businessRoles).where(eq(businessRoles.roleCode, roleData.roleCode));
    if (!insertedRole) throw new Error("Failed to create business role");
    return insertedRole;
  }

  // User business role assignments
  async getUserBusinessRoles(userId: string): Promise<UserBusinessRole[]> {
    return db.select().from(userBusinessRoles)
      .where(and(eq(userBusinessRoles.userId, userId), eq(userBusinessRoles.isActive, true)));
  }

  async assignUserBusinessRole(assignment: InsertUserBusinessRole): Promise<UserBusinessRole> {
    await db.insert(userBusinessRoles).values([assignment]);
    const [role] = await db.select().from(userBusinessRoles)
      .where(and(
        eq(userBusinessRoles.userId, assignment.userId),
        eq(userBusinessRoles.businessRoleId, assignment.businessRoleId)
      ))
      .orderBy(desc(userBusinessRoles.id))
      .limit(1);
    if (!role) throw new Error("Failed to assign user business role");
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
    await db.insert(virtualScenes).values([{
      name: sceneData.name,
      description: sceneData.description,
      imageUrl: sceneData.imageUrl,
      status: sceneData.status ?? "active",
      order: sceneData.order ?? 0,
      operationPoints: sceneData.operationPoints ? JSON.parse(JSON.stringify(sceneData.operationPoints)) : [],
      interactiveElements: sceneData.interactiveElements ? JSON.parse(JSON.stringify(sceneData.interactiveElements)) : []
    }]);
    const [insertedScene] = await db.select().from(virtualScenes).where(eq(virtualScenes.name, sceneData.name));
    if (!insertedScene) throw new Error("Failed to create virtual scene");
    return insertedScene;
  }

  async updateVirtualScene(id: string, updates: Partial<VirtualScene>): Promise<VirtualScene> {
    await db
      .update(virtualScenes)
      .set(updates)
      .where(eq(virtualScenes.id, id));
    const scene = await this.getVirtualScene(id);
    if (!scene) throw new Error("Failed to update virtual scene");
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
    await db.insert(experiments).values([{
      name: experimentData.name,
      category: experimentData.category,
      description: experimentData.description,
      order: experimentData.order ?? 0,
      isActive: experimentData.isActive ?? true,
      steps: experimentData.steps ? JSON.parse(JSON.stringify(experimentData.steps)) : [],
      requirements: experimentData.requirements ? JSON.parse(JSON.stringify(experimentData.requirements)) : []
    }]);
    const [insertedExperiment] = await db.select().from(experiments).where(eq(experiments.name, experimentData.name));
    if (!insertedExperiment) throw new Error("Failed to create experiment");
    return insertedExperiment;
  }

  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment> {
    await db
      .update(experiments)
      .set(updates)
      .where(eq(experiments.id, id));
    const experiment = await this.getExperiment(id);
    if (!experiment) throw new Error("Failed to update experiment");
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
      await db.insert(studentProgress).values([progressData]);
      const [progress] = await db.select().from(studentProgress)
        .where(and(
          eq(studentProgress.userId, progressData.userId),
          eq(studentProgress.experimentId, progressData.experimentId)
        ))
        .orderBy(desc(studentProgress.id))
        .limit(1);
      if (!progress) throw new Error("Failed to create progress");
      return progress;
    }
  }

  async updateProgress(id: string, updates: Partial<StudentProgress>): Promise<StudentProgress> {
    await db
      .update(studentProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentProgress.id, id));
    const [progress] = await db.select().from(studentProgress).where(eq(studentProgress.id, id));
    if (!progress) throw new Error("Failed to update progress");
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
    await db.insert(trainingTasks).values([{
      title: taskData.title,
      teacherId: taskData.teacherId,
      experimentId: taskData.experimentId,
      description: taskData.description,
      taskType: taskData.taskType ?? "individual",
      isActive: taskData.isActive ?? true,
      dueDate: taskData.dueDate,
      requiredBusinessRoles: taskData.requiredBusinessRoles ? JSON.parse(JSON.stringify(taskData.requiredBusinessRoles)) : [],
      roleAssignments: taskData.roleAssignments ? JSON.parse(JSON.stringify(taskData.roleAssignments)) : [],
      assignedStudents: taskData.assignedStudents ? JSON.parse(JSON.stringify(taskData.assignedStudents)) : []
    }]);
    const [insertedTask] = await db.select().from(trainingTasks).where(eq(trainingTasks.title, taskData.title));
    if (!insertedTask) throw new Error("Failed to create training task");
    return insertedTask;
  }

  async updateTrainingTask(id: string, updates: Partial<TrainingTask>): Promise<TrainingTask> {
    await db
      .update(trainingTasks)
      .set(updates)
      .where(eq(trainingTasks.id, id));
    const task = await this.getTrainingTask(id);
    if (!task) throw new Error("Failed to update training task");
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
    await db.insert(experimentResults).values([resultData]);
    const result = await db.select().from(experimentResults)
      .where(and(
        eq(experimentResults.userId, resultData.userId),
        eq(experimentResults.experimentId, resultData.experimentId)
      ))
      .orderBy(desc(experimentResults.submittedAt))
      .limit(1);
    if (!result[0]) throw new Error("Failed to create experiment result");
    return result[0];
  }

  async updateExperimentResult(id: string, updates: Partial<ExperimentResult>): Promise<ExperimentResult> {
    await db
      .update(experimentResults)
      .set(updates)
      .where(eq(experimentResults.id, id));
    const result = await this.getExperimentResult(id);
    if (!result) throw new Error("Failed to update experiment result");
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
    const fileId = randomUUID();
    await db.insert(uploadedFiles).values([{
      id: fileId,
      ...fileData
    }]);
    const [file] = await db.select().from(uploadedFiles)
      .where(eq(uploadedFiles.id, fileId));
    if (!file) throw new Error("Failed to create uploaded file");
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

  // Workflow operations
  async getUserWorkflows(userId: string, businessRoleCode: string): Promise<WorkflowInstance[]> {
    return db.select()
      .from(workflowInstances)
      .where(
        and(
          eq(workflowInstances.initiatorUserId, userId),
          eq(workflowInstances.businessRoleCode, businessRoleCode)
        )
      )
      .orderBy(desc(workflowInstances.createdAt));
  }

  async createWorkflowInstance(instanceData: InsertWorkflowInstance): Promise<WorkflowInstance> {
    await db.insert(workflowInstances).values(instanceData);
    // 获取最新创建的工作流实例
    const [workflow] = await db.select()
      .from(workflowInstances)
      .where(eq(workflowInstances.initiatorUserId, instanceData.initiatorUserId))
      .orderBy(desc(workflowInstances.createdAt))
      .limit(1);
    if (!workflow) throw new Error("Failed to create workflow instance");
    return workflow;
  }

  async executeWorkflowStep(workflowId: string, userId: string, stepExecution: any): Promise<any> {
    // 获取工作流实例
    const [workflow] = await db.select()
      .from(workflowInstances)
      .where(eq(workflowInstances.id, workflowId));
      
    if (!workflow) {
      throw new Error("工作流程不存在");
    }

    // 记录步骤执行
    await db.insert(workflowStepExecutions).values({
      workflowInstanceId: workflowId,
      stepNumber: workflow.currentStep,
      executorUserId: userId,
      businessRoleCode: workflow.businessRoleCode,
      action: stepExecution.action,
      inputData: stepExecution.data,
      outputData: stepExecution.data,
      status: "completed"
    });

    // 更新工作流实例状态
    const nextStep = workflow.currentStep + 1;
    const newStatus = nextStep > 6 ? "completed" : "active"; // 假设最多6步
    
    await db.update(workflowInstances)
      .set({
        currentStep: nextStep,
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(workflowInstances.id, workflowId));

    return {
      success: true,
      currentStep: nextStep,
      status: newStatus,
      message: stepExecution.action + " 执行成功"
    };
  }

  // Customs test data operations
  async getCustomsTestData(): Promise<CustomsTestData[]> {
    return db.select().from(customsTestData).where(eq(customsTestData.isActive, true));
  }

  async getCustomsTestDataByName(dataSetName: string): Promise<CustomsTestData | undefined> {
    const [testData] = await db.select().from(customsTestData)
      .where(and(eq(customsTestData.dataSetName, dataSetName), eq(customsTestData.isActive, true)));
    return testData;
  }

  async createCustomsTestData(testDataInput: InsertCustomsTestData): Promise<CustomsTestData> {
    const testDataId = randomUUID();
    await db.insert(customsTestData).values([{
      id: testDataId,
      dataSetName: testDataInput.dataSetName,
      companyName: testDataInput.companyName,
      unifiedCreditCode: testDataInput.unifiedCreditCode,
      registeredAddress: testDataInput.registeredAddress,
      legalRepresentative: testDataInput.legalRepresentative,
      businessLicense: testDataInput.businessLicense,
      contactPerson: testDataInput.contactPerson,
      contactPhone: testDataInput.contactPhone,
      contactEmail: testDataInput.contactEmail,
      businessScope: testDataInput.businessScope ? JSON.parse(JSON.stringify(testDataInput.businessScope)) : [],
      importExportLicense: testDataInput.importExportLicense,
      registeredCapital: testDataInput.registeredCapital,
      isActive: testDataInput.isActive ?? true
    }]);
    const [insertedData] = await db.select().from(customsTestData)
      .where(eq(customsTestData.dataSetName, testDataInput.dataSetName));
    if (!insertedData) throw new Error("Failed to create customs test data");
    return insertedData;
  }

  async updateCustomsTestData(id: string, updates: Partial<CustomsTestData>): Promise<CustomsTestData> {
    await db
      .update(customsTestData)
      .set(updates)
      .where(eq(customsTestData.id, id));
    const data = await db.select().from(customsTestData).where(eq(customsTestData.id, id));
    if (!data[0]) throw new Error("Failed to update customs test data");
    return data[0];
  }

  // IC card test data operations
  async getIcCardTestData(): Promise<IcCardTestData[]> {
    return db.select().from(icCardTestData).where(eq(icCardTestData.isActive, true));
  }

  async getIcCardTestDataByName(dataSetName: string): Promise<IcCardTestData | undefined> {
    const [testData] = await db.select().from(icCardTestData)
      .where(and(eq(icCardTestData.dataSetName, dataSetName), eq(icCardTestData.isActive, true)));
    return testData;
  }

  async createIcCardTestData(testDataInput: InsertIcCardTestData): Promise<IcCardTestData> {
    const testDataId = randomUUID();
    await db.insert(icCardTestData).values([{
      id: testDataId,
      dataSetName: testDataInput.dataSetName,
      companyName: testDataInput.companyName,
      unifiedCreditCode: testDataInput.unifiedCreditCode,
      registeredAddress: testDataInput.registeredAddress,
      legalRepresentative: testDataInput.legalRepresentative,
      businessLicense: testDataInput.businessLicense,
      registeredCapital: testDataInput.registeredCapital,
      contactPerson: testDataInput.contactPerson,
      contactPhone: testDataInput.contactPhone,
      contactEmail: testDataInput.contactEmail,
      businessScope: testDataInput.businessScope ? JSON.parse(JSON.stringify(testDataInput.businessScope)) : [],
      operatorName: testDataInput.operatorName,
      operatorIdCard: testDataInput.operatorIdCard,
      customsDeclarantCertificate: testDataInput.customsDeclarantCertificate,
      foreignTradeRegistration: testDataInput.foreignTradeRegistration,
      customsImportExportReceipt: testDataInput.customsImportExportReceipt,
      applicationReason: testDataInput.applicationReason,
      expectedCardQuantity: testDataInput.expectedCardQuantity,
      isActive: testDataInput.isActive ?? true
    }]);
    const [insertedData] = await db.select().from(icCardTestData)
      .where(eq(icCardTestData.dataSetName, testDataInput.dataSetName));
    if (!insertedData) throw new Error("Failed to create IC card test data");
    return insertedData;
  }

  async updateIcCardTestData(id: string, updates: Partial<IcCardTestData>): Promise<IcCardTestData> {
    await db
      .update(icCardTestData)
      .set(updates)
      .where(eq(icCardTestData.id, id));
    const data = await db.select().from(icCardTestData).where(eq(icCardTestData.id, id));
    if (!data[0]) throw new Error("Failed to update IC card test data");
    return data[0];
  }

  // E-commerce qualification test data operations
  async getEcommerceQualificationTestData(): Promise<EcommerceQualificationTestData[]> {
    return db.select().from(ecommerceQualificationTestData).where(eq(ecommerceQualificationTestData.isActive, true));
  }

  async getEcommerceQualificationTestDataByName(dataSetName: string): Promise<EcommerceQualificationTestData | undefined> {
    const [testData] = await db.select().from(ecommerceQualificationTestData)
      .where(and(eq(ecommerceQualificationTestData.dataSetName, dataSetName), eq(ecommerceQualificationTestData.isActive, true)));
    return testData;
  }

  async createEcommerceQualificationTestData(testDataInput: InsertEcommerceQualificationTestData): Promise<EcommerceQualificationTestData> {
    const testDataId = randomUUID();
    await db.insert(ecommerceQualificationTestData).values([{
      id: testDataId,
      dataSetName: testDataInput.dataSetName,
      companyName: testDataInput.companyName,
      unifiedCreditCode: testDataInput.unifiedCreditCode,
      legalRepresentative: testDataInput.legalRepresentative,
      legalRepresentativeIdCard: testDataInput.legalRepresentativeIdCard,
      registeredAddress: testDataInput.registeredAddress,
      businessAddress: testDataInput.businessAddress,
      registeredCapital: testDataInput.registeredCapital,
      contactPerson: testDataInput.contactPerson,
      contactPhone: testDataInput.contactPhone,
      contactEmail: testDataInput.contactEmail,
      businessLicense: testDataInput.businessLicense,
      businessScope: testDataInput.businessScope,
      foreignTradeRecord: testDataInput.foreignTradeRecord,
      customsEcommerceRecord: testDataInput.customsEcommerceRecord,
      establishmentDate: testDataInput.establishmentDate,
      businessValidityPeriod: testDataInput.businessValidityPeriod,
      mainProducts: testDataInput.mainProducts,
      productionCapacity: testDataInput.productionCapacity,
      productCertification: testDataInput.productCertification,
      qualityManagementSystem: testDataInput.qualityManagementSystem,
      brandAuthorization: testDataInput.brandAuthorization,
      supplierInformation: testDataInput.supplierInformation,
      foreignExchangeAccount: testDataInput.foreignExchangeAccount,
      foreignExchangeAccountNumber: testDataInput.foreignExchangeAccountNumber,
      taxRegistrationNumber: testDataInput.taxRegistrationNumber,
      taxpayerType: testDataInput.taxpayerType,
      annualTurnover: testDataInput.annualTurnover,
      exportVolume: testDataInput.exportVolume,
      isActive: testDataInput.isActive ?? true
    }]);
    const [insertedData] = await db.select().from(ecommerceQualificationTestData)
      .where(eq(ecommerceQualificationTestData.id, testDataId));
    if (!insertedData) throw new Error("Failed to create e-commerce qualification test data");
    return insertedData;
  }

  // Transmission ID test data operations
  async getTransmissionIdTestData(): Promise<TransmissionIdTestData[]> {
    return db.select().from(transmissionIdTestData).where(eq(transmissionIdTestData.isActive, true));
  }

  async getTransmissionIdTestDataByName(dataSetName: string): Promise<TransmissionIdTestData | undefined> {
    const [testData] = await db.select().from(transmissionIdTestData)
      .where(eq(transmissionIdTestData.dataSetName, dataSetName));
    return testData;
  }

  async createTransmissionIdTestData(testDataInput: InsertTransmissionIdTestData): Promise<TransmissionIdTestData> {
    const testDataId = randomUUID();
    await db.insert(transmissionIdTestData).values([{
      id: testDataId,
      dataSetName: testDataInput.dataSetName,
      companyName: testDataInput.companyName,
      unifiedCreditCode: testDataInput.unifiedCreditCode,
      legalRepresentative: testDataInput.legalRepresentative,
      registeredAddress: testDataInput.registeredAddress,
      businessAddress: testDataInput.businessAddress,
      contactPerson: testDataInput.contactPerson,
      contactPhone: testDataInput.contactPhone,
      contactEmail: testDataInput.contactEmail,
      businessLicense: testDataInput.businessLicense,
      businessScope: testDataInput.businessScope,
      applicationMode: testDataInput.applicationMode,
      applicantName: testDataInput.applicantName,
      applicantIdCard: testDataInput.applicantIdCard,
      applicantPosition: testDataInput.applicantPosition,
      applicantPhone: testDataInput.applicantPhone,
      customsRegistrationNumber: testDataInput.customsRegistrationNumber,
      enterpriseType: testDataInput.enterpriseType,
      businessCategory: testDataInput.businessCategory,
      expectedUsage: testDataInput.expectedUsage,
      systemIntegrationMethod: testDataInput.systemIntegrationMethod,
      technicalContactPerson: testDataInput.technicalContactPerson,
      technicalContactPhone: testDataInput.technicalContactPhone,
      dataInterfaceRequirement: testDataInput.dataInterfaceRequirement,
      isActive: testDataInput.isActive ?? true
    }]);
    const [insertedData] = await db.select().from(transmissionIdTestData)
      .where(eq(transmissionIdTestData.id, testDataId));
    if (!insertedData) throw new Error("Failed to create transmission ID test data");
    return insertedData;
  }

  // Overseas warehouse test data operations
  async getOverseasWarehouseTestData(): Promise<OverseasWarehouseTestData[]> {
    return db.select().from(overseasWarehouseTestData).where(eq(overseasWarehouseTestData.isActive, true));
  }

  async getOverseasWarehouseTestDataByName(dataSetName: string): Promise<OverseasWarehouseTestData | undefined> {
    const [testData] = await db.select().from(overseasWarehouseTestData)
      .where(eq(overseasWarehouseTestData.dataSetName, dataSetName));
    return testData;
  }

  async createOverseasWarehouseTestData(testDataInput: InsertOverseasWarehouseTestData): Promise<OverseasWarehouseTestData> {
    const testDataId = randomUUID();
    await db.insert(overseasWarehouseTestData).values([{
      id: testDataId,
      dataSetName: testDataInput.dataSetName,
      companyName: testDataInput.companyName,
      unifiedCreditCode: testDataInput.unifiedCreditCode,
      legalRepresentative: testDataInput.legalRepresentative,
      registeredAddress: testDataInput.registeredAddress,
      businessAddress: testDataInput.businessAddress,
      contactPerson: testDataInput.contactPerson,
      contactPhone: testDataInput.contactPhone,
      contactEmail: testDataInput.contactEmail,
      businessLicense: testDataInput.businessLicense,
      businessScope: testDataInput.businessScope,
      registeredCapital: testDataInput.registeredCapital,
      exportBusinessScope: testDataInput.exportBusinessScope,
      overseasWarehouseCountry: testDataInput.overseasWarehouseCountry,
      overseasWarehouseAddress: testDataInput.overseasWarehouseAddress,
      warehouseOperatingModel: testDataInput.warehouseOperatingModel,
      expectedAnnualExportVolume: testDataInput.expectedAnnualExportVolume,
      mainExportProducts: testDataInput.mainExportProducts,
      targetMarkets: testDataInput.targetMarkets,
      warehouseName: testDataInput.warehouseName,
      warehouseCode: testDataInput.warehouseCode,
      warehouseArea: testDataInput.warehouseArea,
      storageCapacity: testDataInput.storageCapacity,
      warehouseType: testDataInput.warehouseType,
      operatingLicense: testDataInput.operatingLicense,
      warehouseContactPerson: testDataInput.warehouseContactPerson,
      warehouseContactPhone: testDataInput.warehouseContactPhone,
      warehouseManagementSystem: testDataInput.warehouseManagementSystem,
      ownershipType: testDataInput.ownershipType,
      leaseAgreementNumber: testDataInput.leaseAgreementNumber,
      leaseStartDate: testDataInput.leaseStartDate,
      leaseEndDate: testDataInput.leaseEndDate,
      lessorInformation: testDataInput.lessorInformation,
      customsSupervisionCode: testDataInput.customsSupervisionCode,
      bonded_area_code: testDataInput.bonded_area_code,
      warehouseRegistrationNumber: testDataInput.warehouseRegistrationNumber,
      insuranceInformation: testDataInput.insuranceInformation,
      emergencyContactInfo: testDataInput.emergencyContactInfo,
      isActive: testDataInput.isActive ?? true
    }]);
    const [insertedData] = await db.select().from(overseasWarehouseTestData)
      .where(eq(overseasWarehouseTestData.id, testDataId));
    if (!insertedData) throw new Error("Failed to create overseas warehouse test data");
    return insertedData;
  }

  // Customs declaration export test data operations
  async getCustomsDeclarationExportTestData(): Promise<CustomsDeclarationExportTestData[]> {
    return db.select().from(customsDeclarationExportTestData).where(eq(customsDeclarationExportTestData.isActive, true));
  }

  async getCustomsDeclarationExportTestDataByName(dataSetName: string): Promise<CustomsDeclarationExportTestData | undefined> {
    const [testData] = await db.select().from(customsDeclarationExportTestData)
      .where(eq(customsDeclarationExportTestData.dataSetName, dataSetName));
    return testData;
  }

  async createCustomsDeclarationExportTestData(testDataInput: InsertCustomsDeclarationExportTestData): Promise<CustomsDeclarationExportTestData> {
    const testDataId = randomUUID();
    await db.insert(customsDeclarationExportTestData).values([{
      id: testDataId,
      ...testDataInput,
    }]);
    
    const createdTestData = await this.getCustomsDeclarationExportTestDataByName(testDataInput.dataSetName);
    if (!createdTestData) throw new Error("Failed to create customs declaration export test data");
    return createdTestData;
  }
}

export const storage = new DatabaseStorage();
