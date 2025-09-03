import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
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
  insertUserBusinessRoleSchema
} from "@shared/schema";
import { BUSINESS_ROLE_CONFIGS, SCENE_CONFIGS } from "@shared/business-roles";

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
      
      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user!.id,
        experimentId: experimentId || null,
        resultId: resultId || null,
      };
      
      const uploadedFile = await storage.createUploadedFile(fileData);
      res.json(uploadedFile);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
