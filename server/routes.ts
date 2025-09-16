import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { storage } from "./storage";
import { 
  authenticateToken, 
  requireRole, 
  hashPassword, 
  comparePassword, 
  generateTokens,
  verifyRefreshToken,
  type AuthRequest 
} from "./auth";
import { 
  insertUserSchema, 
  loginSchema, 
  insertVirtualSceneSchema,
  insertExperimentSchema,
  insertStudentProgressSchema,
  insertTrainingTaskSchema,
  insertExperimentResultSchema,
  insertBusinessRoleSchema,
  insertUserBusinessRoleSchema,
  insertCustomsTestDataSchema,
  insertIcCardTestDataSchema,
  insertEcommerceQualificationTestDataSchema,
  ecommerceQualificationSubmissionSchema
} from "@shared/schema";
import { BUSINESS_ROLE_CONFIGS, SCENE_CONFIGS } from "@shared/business-roles";
import { seedBasicData } from "./seed-data";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "attached_assets", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize database with seed data on startup
  try {
    await seedBasicData();
    console.log("✅ 基础数据初始化完成");
  } catch (error) {
    console.error("⚠️ 基础数据初始化失败，使用内存存储:", error);
  }
  
  // Handle HEAD /api requests - likely from Sentry monitoring
  app.head("/api", (req, res) => {
    res.status(204).end(); // 204 No Content - satisfies health check
  });
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ message: "手机号已被注册" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      res.json({
        user: { ...user, password: undefined },
        ...tokens,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "注册失败" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password, role } = loginSchema.parse(req.body);
      
      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ message: "手机号或密码错误" });
      }
      
      // Check role
      if (user.role !== role) {
        return res.status(400).json({ message: "角色选择错误" });
      }
      
      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "手机号或密码错误" });
      }
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      res.json({
        user: { ...user, password: undefined },
        ...tokens,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "登录失败" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "刷新令牌缺失" });
      }
      
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ message: "无效的刷新令牌" });
      }
      
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }
      
      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error: any) {
      res.status(401).json({ message: error.message || "令牌刷新失败" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取用户信息失败" });
    }
  });

  // Virtual scenes routes
  app.get("/api/scenes", authenticateToken, async (req, res) => {
    try {
      const scenes = await storage.getVirtualScenes();
      res.json(scenes);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取虚拟场景失败" });
    }
  });

  app.get("/api/scenes/:id", authenticateToken, async (req, res) => {
    try {
      const scene = await storage.getVirtualScene(req.params.id);
      if (!scene) {
        return res.status(404).json({ message: "场景不存在" });
      }
      res.json(scene);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取场景详情失败" });
    }
  });

  app.post("/api/scenes", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const sceneData = insertVirtualSceneSchema.parse(req.body);
      const scene = await storage.createVirtualScene(sceneData);
      res.json(scene);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "创建虚拟场景失败" });
    }
  });

  // Experiments routes
  app.get("/api/experiments", authenticateToken, async (req, res) => {
    try {
      const { category } = req.query;
      let experiments;
      
      if (category) {
        experiments = await storage.getExperimentsByCategory(category as string);
      } else {
        experiments = await storage.getExperiments();
      }
      
      res.json(experiments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取实验列表失败" });
    }
  });

  app.get("/api/experiments/:id", authenticateToken, async (req, res) => {
    try {
      const experiment = await storage.getExperiment(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: "实验不存在" });
      }
      res.json(experiment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取实验详情失败" });
    }
  });

  app.post("/api/experiments", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const experimentData = insertExperimentSchema.parse(req.body);
      const experiment = await storage.createExperiment(experimentData);
      res.json(experiment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "创建实验失败" });
    }
  });

  // Student progress routes
  app.get("/api/progress", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const progress = await storage.getStudentProgress(req.user!.id);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取学习进度失败" });
    }
  });

  app.get("/api/progress/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getStudentStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取学习统计失败" });
    }
  });

  app.post("/api/progress", authenticateToken, requireRole(["student"]), async (req: AuthRequest, res) => {
    try {
      const progressData = insertStudentProgressSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const progress = await storage.createOrUpdateProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "更新学习进度失败" });
    }
  });

  // Training tasks routes
  app.get("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let tasks;
      
      if (req.user!.role === "teacher") {
        tasks = await storage.getTrainingTasks(req.user!.id);
      } else if (req.user!.role === "student") {
        tasks = await storage.getTasksForStudent(req.user!.id);
      } else {
        tasks = await storage.getTrainingTasks();
      }
      
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取培训任务失败" });
    }
  });

  app.post("/api/tasks", authenticateToken, requireRole(["teacher"]), async (req: AuthRequest, res) => {
    try {
      const taskData = insertTrainingTaskSchema.parse({
        ...req.body,
        teacherId: req.user!.id,
      });
      
      const task = await storage.createTrainingTask(taskData);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "创建培训任务失败" });
    }
  });

  // Experiment results routes
  app.get("/api/results", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { experimentId } = req.query;
      let results;
      
      if (req.user!.role === "student") {
        results = await storage.getExperimentResults(req.user!.id, experimentId as string);
      } else {
        results = await storage.getExperimentResults(undefined, experimentId as string);
      }
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取实验结果失败" });
    }
  });

  app.post("/api/results", authenticateToken, requireRole(["student"]), async (req: AuthRequest, res) => {
    try {
      const resultData = insertExperimentResultSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const result = await storage.createExperimentResult(resultData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "提交实验结果失败" });
    }
  });

  app.put("/api/results/:id/evaluate", authenticateToken, requireRole(["teacher"]), async (req: AuthRequest, res) => {
    try {
      const { score, feedback } = req.body;
      
      const result = await storage.updateExperimentResult(req.params.id, {
        score,
        feedback,
        evaluatedBy: req.user!.id,
        evaluatedAt: new Date(),
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "评价实验结果失败" });
    }
  });

  // File upload routes
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "没有文件被上传" });
      }
      
      const { experimentId, resultId } = req.body;
      
      // 验证外键引用
      if (experimentId) {
        const experiment = await storage.getExperiment(experimentId);
        if (!experiment) {
          return res.status(400).json({ message: "指定的实验不存在" });
        }
      }
      
      if (resultId) {
        const result = await storage.getExperimentResult(resultId);
        if (!result) {
          return res.status(400).json({ message: "指定的实验结果不存在" });
        }
      }
      
      const fileData = {
        filename: req.file.filename,
        originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user!.id,
        experimentId: experimentId || null,
        resultId: resultId || null,
      };
      
      console.log('文件上传数据:', fileData);
      const uploadedFile = await storage.createUploadedFile(fileData);
      res.json(uploadedFile);
    } catch (error: any) {
      console.error('文件上传错误:', error);
      res.status(400).json({ message: error.message || "文件上传失败" });
    }
  });

  app.get("/api/uploads", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { experimentId } = req.query;
      const files = await storage.getUploadedFiles(req.user!.id, experimentId as string);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取上传文件失败" });
    }
  });

  // E-port IC card application form submission
  app.post("/api/experiments/eport-ic-card/submit", authenticateToken, upload.fields([
    { name: "businessLicense_0", maxCount: 1 },
    { name: "operatorIdCard_0", maxCount: 1 },
    { name: "operatorIdCard_1", maxCount: 1 },
    { name: "customsDeclarationCert_0", maxCount: 1 },
    { name: "foreignTradeRegistration_0", maxCount: 1 },
    { name: "customsBackupReceipt_0", maxCount: 1 }
  ]), async (req: AuthRequest, res) => {
    try {
      console.log("收到电子口岸IC卡申请提交:", req.body);
      console.log("文件信息:", req.files);

      // 查找电子口岸IC卡申请实验的ID
      const experiments = await storage.getExperiments();
      const eportExperiment = experiments.find(exp => exp.name === "电子口岸IC卡申请");
      
      if (!eportExperiment) {
        return res.status(400).json({ 
          success: false, 
          message: "找不到对应的实验配置" 
        });
      }

      // 创建实验结果记录
      const resultData = {
        userId: req.user!.id,
        experimentId: eportExperiment.id,
        formData: JSON.stringify(req.body),
        submittedAt: new Date(),
        score: "100",
        status: "completed",
        feedback: "电子口岸IC卡申请提交成功"
      };

      const result = await storage.createExperimentResult(resultData);

      // 处理文件上传
      if (req.files) {
        const filePromises = Object.entries(req.files as { [fieldname: string]: Express.Multer.File[] }).map(async ([fieldName, files]) => {
          const file = Array.isArray(files) ? files[0] : files;
          if (file) {
            const fileData = {
              filename: file.filename,
              originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              uploadedBy: req.user!.id,
              experimentId: eportExperiment.id,
              resultId: result.id
            };
            return storage.createUploadedFile(fileData);
          }
        });

        await Promise.all(filePromises.filter(Boolean));
      }

      // 更新学生进度
      await storage.createOrUpdateProgress({
        userId: req.user!.id,
        experimentId: eportExperiment.id,
        status: "completed",
        progress: 100,
        currentStep: 7,
        completedAt: new Date()
      });

      res.json({ 
        success: true, 
        message: "电子口岸IC卡申请提交成功！",
        result: result
      });
    } catch (error: any) {
      console.error("电子口岸IC卡申请提交失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "申请提交失败，请重试" 
      });
    }
  });

  // Customs qualification filing form submission
  app.post("/api/experiments/customs-qualification/submit", authenticateToken, upload.fields([
    { name: "businessLicense", maxCount: 1 },
    { name: "customsBackupForm", maxCount: 1 },
    { name: "additionalDocs", maxCount: 5 }
  ]), async (req: AuthRequest, res) => {
    const experimentId = '873e1fe1-0430-4f47-9db2-c4f00e2b048f'; // Stable UUID from seed data
    
    try {
      console.log("收到海关企业资质备案提交:", req.body);
      console.log("文件信息:", req.files);

      // Form data validation schema
      const customsFormSchema = z.object({
        companyName: z.string().min(2, "企业名称至少2个字符"),
        unifiedCreditCode: z.string().regex(/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, "请输入正确的统一社会信用代码"),
        legalRepresentative: z.string().min(2, "法定代表人姓名至少2个字符"),
        registeredAddress: z.string().min(10, "注册地址信息不完整"),
        businessScope: z.string().min(10, "经营范围描述至少10个字符"),
        registeredCapital: z.coerce.number().min(1, "注册资本必须大于0"),
        contactPerson: z.string().min(2, "联系人姓名至少2个字符"),
        contactPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
        contactEmail: z.string().email("请输入有效的邮箱地址"),
        dataAccuracy: z.boolean().refine(val => val === true, "必须确认数据真实性"),
        legalResponsibility: z.boolean().refine(val => val === true, "必须承诺承担法律责任")
      });

      // Validate form data
      const formData = customsFormSchema.parse(req.body);

      // Check required files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files?.businessLicense?.[0] || !files?.customsBackupForm?.[0]) {
        return res.status(400).json({
          success: false,
          message: "缺少必需的文件：营业执照和报关单位备案信息表"
        });
      }

      // Verify experiment exists
      const experiment = await storage.getExperiment(experimentId);
      if (!experiment) {
        return res.status(500).json({
          success: false,
          message: "系统配置错误：找不到对应的实验"
        });
      }

      // Create experiment result with proper types
      const resultData = insertExperimentResultSchema.parse({
        userId: req.user!.id,
        experimentId: experimentId,
        formData: formData, // Store as JSON object, not string
        submittedAt: new Date(),
        score: 100, // Number, not string
        status: "completed",
        feedback: "海关企业资质备案提交成功，材料齐全，符合要求"
      });

      const result = await storage.createExperimentResult(resultData);

      // Process all uploaded files with proper handling
      const uploadedFileData: any[] = [];
      if (files) {
        for (const [fieldName, fileArray] of Object.entries(files)) {
          // Handle all files in the array, not just the first one
          for (const file of fileArray) {
            const fileData = {
              filename: file.filename,
              originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              uploadedBy: req.user!.id,
              experimentId: experimentId,
              resultId: result.id
            };
            const uploadedFile = await storage.createUploadedFile(fileData);
            uploadedFileData.push(uploadedFile);
          }
        }
      }

      // Update student progress with validation
      const progressData = insertStudentProgressSchema.parse({
        userId: req.user!.id,
        experimentId: experimentId,
        status: "completed",
        progress: 100,
        currentStep: 5,
        completedAt: new Date()
      });

      await storage.createOrUpdateProgress(progressData);

      res.json({ 
        success: true, 
        message: "海关企业资质备案提交成功！您的备案申请已提交海关审核，请等待审核结果。",
        result: {
          id: result.id,
          experimentId: experimentId,
          submittedAt: result.submittedAt,
          uploadedFiles: uploadedFileData.length
        }
      });
    } catch (error: any) {
      console.error("海关企业资质备案提交失败:", error);
      
      // Return validation errors specifically
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "表单数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || "备案申请提交失败，请重试" 
      });
    }
  });

  // Customs test data API endpoints
  app.get("/api/customs-test-data", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getCustomsTestData();
      res.json(testData);
    } catch (error: any) {
      console.error("获取海关测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  app.get("/api/customs-test-data/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getCustomsTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          success: false,
          message: "测试数据集不存在"
        });
      }
      
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取海关测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  app.post("/api/customs-test-data", authenticateToken, requireRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testData = insertCustomsTestDataSchema.parse(req.body);
      const result = await storage.createCustomsTestData(testData);
      
      res.json({
        success: true,
        message: "测试数据创建成功",
        data: result
      });
    } catch (error: any) {
      console.error("创建海关测试数据失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || "创建测试数据失败" 
      });
    }
  });

  // IC Card test data routes
  app.get("/api/ic-card-test-data", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getIcCardTestData();
      res.json(testData);
    } catch (error: any) {
      console.error("获取IC卡测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  app.get("/api/ic-card-test-data/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getIcCardTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          success: false,
          message: "测试数据集不存在"
        });
      }
      
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取IC卡测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  app.post("/api/ic-card-test-data", authenticateToken, requireRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testData = insertIcCardTestDataSchema.parse(req.body);
      const result = await storage.createIcCardTestData(testData);
      
      res.json({
        success: true,
        message: "IC卡测试数据创建成功",
        data: result
      });
    } catch (error: any) {
      console.error("创建IC卡测试数据失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || "创建测试数据失败" 
      });
    }
  });

  // User management routes (admin only)
  app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取用户统计失败" });
    }
  });

  // Teacher dashboard routes
  app.get("/api/teacher/stats", authenticateToken, requireRole(["teacher"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getTeacherStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取教师统计失败" });
    }
  });

  // Business role routes
  app.get("/api/business-roles", authenticateToken, async (req, res) => {
    try {
      // 返回内存中的业务角色配置，而不是数据库中的
      const roles = Object.values(BUSINESS_ROLE_CONFIGS).filter(role => !role.isSystemRole);
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取业务角色失败" });
    }
  });

  // 工作流程管理API
  
  // 获取用户当前的工作流程状态
  app.get("/api/workflows/current", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { businessRoleCode } = req.query;
      
      if (!businessRoleCode) {
        return res.status(400).json({ message: "业务角色代码必填" });
      }

      // 获取该角色的当前工作流程状态
      const workflows = await storage.getUserWorkflows(userId, businessRoleCode as string);
      
      res.json({
        businessRoleCode,
        activeWorkflows: workflows,
        totalCount: workflows.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取工作流程失败" });
    }
  });

  // 创建新的工作流程实例
  app.post("/api/workflows/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { workflowCode, businessRoleCode } = req.body;
      
      if (!workflowCode || !businessRoleCode) {
        return res.status(400).json({ message: "工作流程代码和业务角色代码必填" });
      }

      const workflow = await storage.createWorkflowInstance({
        workflowCode,
        businessRoleCode,
        initiatorUserId: userId,
        currentStep: 1,
        status: 'active',
        stepData: {}
      });
      
      res.json({ 
        success: true, 
        workflowId: workflow.id,
        message: "工作流程已启动" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "启动工作流程失败" });
    }
  });

  // 执行工作流程步骤
  app.post("/api/workflows/:workflowId/execute-step", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { workflowId } = req.params;
      const { stepData, action } = req.body;
      
      const result = await storage.executeWorkflowStep(workflowId, userId, {
        action,
        data: stepData,
        executedAt: new Date()
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "执行步骤失败" });
    }
  });

  // 根据业务角色获取可访问的场景和操作
  app.get("/api/scenes-with-operations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { businessRoleCode } = req.query;
      
      if (!businessRoleCode) {
        return res.status(400).json({ message: "业务角色代码必填" });
      }

      // 从内存配置获取角色信息
      const roleConfig = BUSINESS_ROLE_CONFIGS[businessRoleCode as string];
      if (!roleConfig) {
        return res.status(404).json({ message: "业务角色不存在" });
      }

      // 直接从内存配置获取该角色可访问的场景
      const accessibleScenes = Object.values(SCENE_CONFIGS).filter(scene => 
        roleConfig.availableScenes.includes(scene.sceneCode)
      );

      // 为每个场景添加该角色的操作入口信息
      const scenesWithOperations = accessibleScenes.map(scene => {
        // 过滤出该角色可以使用的操作入口
        const roleOperations = scene.operationPoints?.filter(op => 
          op.businessRoleCode === businessRoleCode
        ) || [];

        return {
          sceneCode: scene.sceneCode,
          sceneName: scene.sceneName,
          description: scene.description,
          imageUrl: scene.imageUrl,
          roleOperations,
          operationCount: roleOperations.length
        };
      });

      res.json({
        businessRole: {
          roleCode: roleConfig.roleCode,
          roleName: roleConfig.roleName,
          description: roleConfig.description
        },
        accessibleScenes: scenesWithOperations,
        totalScenes: accessibleScenes.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取场景操作信息失败" });
    }
  });

  // E-commerce qualification test data routes
  app.get("/api/test-data/ecommerce-qualification", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getEcommerceQualificationTestData();
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取电商企业资质测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  app.get("/api/test-data/ecommerce-qualification/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getEcommerceQualificationTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          success: false,
          message: "测试数据集不存在"
        });
      }
      
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取电商企业资质测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取测试数据失败" 
      });
    }
  });

  // E-commerce qualification filing submission
  app.post("/api/experiments/ecommerce-qualification-filing", 
    authenticateToken, 
    upload.array('files', 10), 
    async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      
      // Validate request body with Zod
      const validationResult = ecommerceQualificationSubmissionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      const formData = validationResult.data;
      
      // Handle uploaded files
      const uploadedFiles = req.files as Express.Multer.File[] || [];
      const fileData = uploadedFiles.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      
      // Create experiment result record
      const experimentResult = await storage.createExperimentResult({
        userId,
        experimentId: 'experiment-003', // E-commerce qualification filing
        submissionData: [{
          ...formData,
          uploadedFiles: fileData
        }]
      });

      res.json({
        success: true,
        message: "电商企业资质备案申请已成功提交",
        data: {
          resultId: experimentResult.id,
          applicationNumber: `EQ${Date.now()}`,
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error("提交电商企业资质备案失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || "提交失败，请稍后重试" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
