import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";
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
  ecommerceQualificationSubmissionSchema,
  insertOverseasWarehouseTestDataSchema,
  insertCustomsDeclarationExportTestDataSchema,
  insertExportDeclarationSchema,
  insertBookingOrderSchema,
  insertImportJobSchema,
  insertSubmissionHistorySchema,
  updateExportDeclarationSchema,
  updateBookingOrderSchema,
  updateImportJobSchema
} from "@shared/schema";
import { BUSINESS_ROLE_CONFIGS, SCENE_CONFIGS } from "@shared/business-roles";
import { seedBasicData } from "./seed-data";

// 通义千问AI API调用函数
async function callQwenAPI(base64Data: string, filename: string, type: 'pdf' | 'image', mimeType: string, apiKey: string) {
  try {
    const isImage = type === 'image';
    const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    
    // 构建通义千问API请求
    const requestBody = {
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: `请分析这个${isImage ? '图片' : 'PDF文档'}，提取其中的报关单或商业文档信息。请识别并提取以下关键字段（如果存在）：

**基本信息：**
- 预录入编号
- 海关编号  
- 收发货人/企业名称
- 申报单位
- 代理申报单位
- 合同协议号
- 发票号
- 提运单号

**货物信息：**
- 商品编码
- 商品名称及规格
- 数量
- 单位
- 单价
- 总价
- 原产国
- 最终目的国

**费用信息：**
- 运费
- 保险费
- 杂费

**运输信息：**
- 运输方式
- 运输工具名称
- 航次号
- 提运单日期
- 启运港
- 入境口岸

**其他信息：**
- 毛重
- 净重
- 件数
- 包装种类
- 标记唛头
- 备注

请以JSON格式返回提取的信息，字段名使用中文，对于没有找到的字段请不要包含在结果中。如果识别出多个商品，请在"goods"数组中列出。`
              },
              {
                [isImage ? 'image' : 'file']: `data:${mimeType};base64,${base64Data}`
              }
            ]
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    };

    console.log(`正在调用通义千问API解析${type}文档: ${filename}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000) // 60秒超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问API错误:', response.status, errorText);
      throw new Error(`通义千问API调用失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // 简化日志输出，避免泄露敏感信息
    if (process.env.NODE_ENV !== 'production') {
      console.log('通义千问API响应状态:', result.output ? '成功' : '失败');
    }

    // 解析API响应
    if (result.output && result.output.choices && result.output.choices[0]) {
      let content = result.output.choices[0].message.content;
      
      // 处理content为数组的情况（DashScope可能返回数组格式）
      if (Array.isArray(content)) {
        content = content
          .filter(item => item.text || typeof item === 'string')
          .map(item => item.text || item)
          .join('\n');
      }
      
      // 确保content是字符串
      if (typeof content !== 'string') {
        console.warn('通义千问API返回的content格式异常:', typeof content);
        content = String(content || '');
      }
      
      // 尝试提取JSON内容
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/\{[\s\S]*\}/) || 
                         [null, content];
        
        if (jsonMatch[1]) {
          const extractedData = JSON.parse(jsonMatch[1]);
          console.log('AI解析成功，提取了', Object.keys(extractedData).length, '个字段');
          return extractedData;
        } else {
          // 如果没有JSON格式，尝试从文本中提取信息
          return parseTextResponse(content);
        }
      } catch (parseError) {
        console.error('JSON解析错误:', parseError);
        // 安全地调用parseTextResponse
        try {
          return parseTextResponse(content);
        } catch (textParseError) {
          console.error('文本解析也失败:', textParseError);
          return {};
        }
      }
    } else {
      console.error('通义千问API响应格式异常:', result);
      throw new Error('AI返回数据格式异常');
    }
  } catch (error: any) {
    console.error('调用通义千问API失败:', error.message);
    throw new Error(`AI解析失败: ${error.message}`);
  }
}

// 解析文本响应，提取关键信息
function parseTextResponse(text: string): any {
  const extractedData: any = {};
  
  // 定义关键字段的正则模式
  const patterns = {
    '预录入编号': /预录入编号[：:]\s*([^\s\n，,。.]+)/i,
    '海关编号': /海关编号[：:]\s*([^\s\n，,。.]+)/i,
    '企业名称': /(?:企业名称|公司名称|收发货人)[：:]\s*([^\n，,。.]+)/i,
    '申报单位': /申报单位[：:]\s*([^\n，,。.]+)/i,
    '合同协议号': /(?:合同协议号|合同号)[：:]\s*([^\s\n，,。.]+)/i,
    '发票号': /(?:发票号|发票编号)[：:]\s*([^\s\n，,。.]+)/i,
    '提运单号': /(?:提运单号|运单号)[：:]\s*([^\s\n，,。.]+)/i,
    '商品名称': /(?:商品名称|货物名称)[：:]\s*([^\n，,。.]+)/i,
    '数量': /数量[：:]\s*([0-9]+)/i,
    '单价': /单价[：:]\s*([0-9.]+)/i,
    '总价': /(?:总价|金额)[：:]\s*([0-9.]+)/i,
    '运费': /运费[：:]\s*([0-9.]+)/i,
    '保险费': /保险费[：:]\s*([0-9.]+)/i,
    '毛重': /毛重[：:]\s*([0-9.]+)/i,
    '净重': /净重[：:]\s*([0-9.]+)/i,
    '件数': /件数[：:]\s*([0-9]+)/i,
    '目的国': /(?:目的国|最终目的国)[：:]\s*([^\n，,。.]+)/i,
    '启运港': /启运港[：:]\s*([^\n，,。.]+)/i,
    '备注': /(?:备注|说明)[：:]\s*([^\n]+)/i
  };

  // 应用正则模式提取信息
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      extractedData[key] = match[1].trim();
    }
  }

  console.log('从文本中提取的数据:', extractedData);
  return extractedData;
}

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
      'image/gif',
      'image/bmp',
      'image/webp',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

  // 获取特定实验的用户提交结果
  app.get("/api/experiment-results/:experimentId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { experimentId } = req.params;
      const userId = req.user!.id;
      
      // 获取该用户在该实验的所有提交结果，按提交时间降序排列
      const results = await storage.getExperimentResults(userId, experimentId);
      
      // 返回最新的提交结果，如果没有则返回null
      const latestResult = results.length > 0 ? results[0] : null;
      
      res.json(latestResult);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "获取实验结果失败" });
    }
  });

  // 重启实验 - 重置进度和清除相关数据
  app.post("/api/experiments/:experimentId/restart", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { experimentId } = req.params;
      const userId = req.user!.id;
      
      // 验证实验是否存在
      const experiment = await storage.getExperiment(experimentId);
      if (!experiment) {
        return res.status(404).json({ message: "实验不存在" });
      }
      
      // 获取当前用户在该实验的进度记录
      const currentProgress = await storage.getStudentProgressByExperiment(userId, experimentId);
      
      if (currentProgress) {
        // 重置进度状态为初始状态
        const resetProgressData = {
          status: "not_started" as const,
          progress: 0,
          currentStep: 0,
          startedAt: null,
          completedAt: null
        };
        
        await storage.updateProgress(currentProgress.id, resetProgressData);
        
        // 获取更新后的进度数据
        const updatedProgress = await storage.getStudentProgressByExperiment(userId, experimentId);
        
        res.json({
          message: "实验已重启，进度已重置",
          progress: updatedProgress
        });
      } else {
        // 如果没有进度记录，创建一个新的初始记录
        const newProgress = await storage.createOrUpdateProgress({
          userId,
          experimentId,
          status: "not_started",
          progress: 0,
          currentStep: 0
        });
        
        res.json({
          message: "实验已重启，已创建新的进度记录",
          progress: newProgress
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "重启实验失败" });
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

  // AI解析API端点
  app.post("/api/ai-parse", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { file, filename, type, mimeType } = req.body;
      
      if (!file || !filename || !type) {
        return res.status(400).json({ message: "缺少必要的参数" });
      }

      // 验证文件类型
      const supportedTypes = ['pdf', 'image'];
      if (!supportedTypes.includes(type)) {
        return res.status(400).json({ message: "不支持的文件类型" });
      }

      // 检查QWEN_API_KEY环境变量
      const qwenApiKey = process.env.QWEN_API_KEY;
      if (!qwenApiKey) {
        console.error('QWEN_API_KEY未配置');
        return res.status(500).json({ message: "AI服务未配置" });
      }

      // 调用通义千问API进行文档解析
      const aiResponse = await callQwenAPI(file, filename, type, mimeType, qwenApiKey);
      
      res.json({
        success: true,
        extractedData: aiResponse,
        message: `AI解析完成，识别${type === 'pdf' ? 'PDF文档' : '图片'}内容成功`
      });

    } catch (error: any) {
      console.error('AI解析错误:', error);
      res.status(500).json({ 
        message: "AI解析失败", 
        error: error.message 
      });
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

  // File download route
  app.get("/api/files/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // 获取文件信息
      const uploadedFile = await storage.getUploadedFile(id);
      if (!uploadedFile) {
        return res.status(404).json({ message: "文件不存在" });
      }
      
      // 权限检查：只有文件上传者、老师或管理员可以下载
      const user = req.user!;
      const canDownload = 
        uploadedFile.uploadedBy === user.id || 
        user.role === "teacher" || 
        user.role === "admin";
      
      if (!canDownload) {
        return res.status(403).json({ message: "无权限下载该文件" });
      }
      
      // 检查文件是否在磁盘上存在
      const filePath = path.join(process.cwd(), "attached_assets", "uploads", uploadedFile.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "文件在服务器上不存在" });
      }
      
      // 设置响应头
      res.setHeader('Content-Type', uploadedFile.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(uploadedFile.originalName)}"`);
      res.setHeader('Content-Length', uploadedFile.size || 0);
      
      // 流式传输文件
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('文件流错误:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "文件下载失败" });
        }
      });
      
    } catch (error: any) {
      console.error('文件下载错误:', error);
      res.status(500).json({ message: error.message || "文件下载失败" });
    }
  });

  // Template download route
  app.get("/api/templates/customs-declaration.docx", async (req, res) => {
    try {
      const templatePath = path.join(process.cwd(), "attached_assets", "templates", "海关出口货物报关单模板.docx");
      
      // 检查模板文件是否存在
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ message: "模板文件不存在" });
      }
      
      // 获取文件信息
      const stats = fs.statSync(templatePath);
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent('海关出口货物报关单模板.docx') + '"');
      res.setHeader('Content-Length', stats.size);
      
      // 流式传输文件
      const fileStream = fs.createReadStream(templatePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('模板文件流错误:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "模板下载失败" });
        }
      });
      
    } catch (error: any) {
      console.error('模板下载错误:', error);
      res.status(500).json({ message: error.message || "模板下载失败" });
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

  // 传输ID申请测试数据端点
  app.get("/api/test-data/transmission-id", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getTransmissionIdTestData();
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取传输ID测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取传输ID测试数据失败" 
      });
    }
  });

  app.get("/api/test-data/transmission-id/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getTransmissionIdTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          success: false,
          message: "传输ID测试数据集不存在"
        });
      }
      
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取传输ID测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取传输ID测试数据失败" 
      });
    }
  });

  // 海外仓业务模式备案测试数据端点
  app.get("/api/test-data/overseas-warehouse", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getOverseasWarehouseTestData();
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取海外仓备案测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取海外仓备案测试数据失败" 
      });
    }
  });

  app.get("/api/test-data/overseas-warehouse/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getOverseasWarehouseTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          success: false,
          message: "海外仓备案测试数据集不存在"
        });
      }
      
      res.json({
        success: true,
        data: testData
      });
    } catch (error: any) {
      console.error("获取海外仓备案测试数据失败:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "获取海外仓备案测试数据失败" 
      });
    }
  });

  // 报关单模式出口申报测试数据端点
  app.get("/api/test-data/customs-declaration-export", authenticateToken, async (req, res) => {
    try {
      const testData = await storage.getCustomsDeclarationExportTestData();
      res.json(testData);
    } catch (error: any) {
      console.error("获取报关单出口申报测试数据失败:", error);
      res.status(500).json({ 
        message: "获取报关单出口申报测试数据失败" 
      });
    }
  });

  app.get("/api/test-data/customs-declaration-export/:dataSetName", authenticateToken, async (req, res) => {
    try {
      const { dataSetName } = req.params;
      const testData = await storage.getCustomsDeclarationExportTestDataByName(dataSetName);
      
      if (!testData) {
        return res.status(404).json({
          message: "报关单出口申报测试数据集不存在"
        });
      }

      res.json(testData);
    } catch (error: any) {
      console.error("获取报关单出口申报测试数据失败:", error);
      res.status(500).json({ 
        message: "获取报关单出口申报测试数据失败" 
      });
    }
  });

  // 报关单模式出口申报提交端点
  app.post("/api/experiments/customs-declaration-export/submit", 
    authenticateToken, 
    requireRole(["student"]),
    async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      
      // 查找实验ID - 使用稳定的category和name组合
      const experiments = await storage.getExperimentsByCategory("customs");
      const experiment = experiments.find(e => e.name === "报关单模式出口申报");
      
      if (!experiment) {
        return res.status(404).json({ 
          message: "实验不存在" 
        });
      }

      // 验证实验结果数据
      const resultValidation = insertExperimentResultSchema.safeParse({
        userId: userId,
        experimentId: experiment.id,
        submissionData: req.body,
        feedback: null,
        evaluatedBy: null,
        evaluatedAt: null,
        score: null,
        taskId: null
      });

      if (!resultValidation.success) {
        return res.status(400).json({ 
          message: "数据验证失败" 
        });
      }

      // 验证学生进度数据
      const progressValidation = insertStudentProgressSchema.safeParse({
        userId: userId,
        experimentId: experiment.id,
        status: "completed",
        completedAt: new Date(),
        businessRoleId: null,
        sceneId: null,
        progress: 100,
        currentStep: 6,
        startedAt: new Date()
      });

      if (!progressValidation.success) {
        return res.status(400).json({ 
          message: "进度数据验证失败" 
        });
      }
      
      // 创建实验结果记录
      const result = await storage.createExperimentResult(resultValidation.data);

      // 更新学生进度
      await storage.createOrUpdateProgress(progressValidation.data);

      res.status(201).json(result);
    } catch (error: any) {
      console.error("报关单模式出口申报提交失败:", error);
      res.status(500).json({ 
        message: "提交失败，请重试" 
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

  // ==========================================================================
  // 跨境电商出口申报两阶段流程 API (Cross-border E-commerce Export Declaration)
  // ==========================================================================

  // 1. 获取用户的出口申报列表
  app.get("/api/export-declarations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const declarations = await storage.getExportDeclarations(userId);
      res.json(declarations);
    } catch (error: any) {
      console.error("获取出口申报列表失败:", error);
      res.status(500).json({ 
        message: error.message || "获取申报列表失败" 
      });
    }
  });

  // 2. 创建新的出口申报
  app.post("/api/export-declarations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // 调试日志：查看接收到的数据
      console.log('🔍 服务器接收到的申报数据:', {
        title: req.body.title,
        titleType: typeof req.body.title,
        bodyKeys: Object.keys(req.body),
        hasTitle: 'title' in req.body
      });
      
      // 🛠️ 服务器端fallback保护：确保title字段始终有效
      if (!req.body.title || req.body.title === 'undefined' || typeof req.body.title !== 'string') {
        const fallbackTitle = `出口申报-${Date.now()}`;
        console.log('🔧 服务器端使用fallback title:', fallbackTitle);
        req.body.title = fallbackTitle;
      }
      
      const declarationData = insertExportDeclarationSchema.parse({
        ...req.body,
        userId
      });
      
      const declaration = await storage.createExportDeclaration(declarationData);
      res.status(201).json(declaration);
    } catch (error: any) {
      console.error("创建出口申报失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        message: error.message || "创建申报失败" 
      });
    }
  });

  // 3. 获取特定申报详情
  app.get("/api/export-declarations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const declaration = await storage.getExportDeclaration(id, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      res.json(declaration);
    } catch (error: any) {
      console.error("获取申报详情失败:", error);
      res.status(500).json({ 
        message: error.message || "获取申报详情失败" 
      });
    }
  });

  // 4. 更新申报状态和数据
  app.put("/api/export-declarations/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // 验证请求数据
      const updateData = updateExportDeclarationSchema.parse(req.body);
      
      // 首先验证申报是否存在且属于当前用户
      const existing = await storage.getExportDeclaration(id, userId);
      if (!existing) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const declaration = await storage.updateExportDeclaration(id, updateData, userId);
      res.json(declaration);
    } catch (error: any) {
      console.error("更新申报失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "更新申报失败" 
      });
    }
  });

  // 5. 订仓单管理 - 获取申报的订仓单列表
  app.get("/api/export-declarations/:declarationId/booking-orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const orders = await storage.getBookingOrders(declarationId, userId);
      res.json(orders);
    } catch (error: any) {
      console.error("获取订仓单列表失败:", error);
      res.status(500).json({ 
        message: error.message || "获取订仓单列表失败" 
      });
    }
  });

  // 6. 创建订仓单
  app.post("/api/export-declarations/:declarationId/booking-orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const orderData = insertBookingOrderSchema.parse({
        ...req.body,
        declarationId
      });
      
      const order = await storage.createBookingOrder(orderData, userId);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("创建订仓单失败:", error);
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        message: error.message || "创建订仓单失败" 
      });
    }
  });

  // 7. 更新订仓单状态
  app.put("/api/booking-orders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // 验证请求数据
      const updateData = updateBookingOrderSchema.parse(req.body);
      
      // 验证订仓单是否存在且属于当前用户
      const existing = await storage.getBookingOrder(id, userId);
      if (!existing) {
        return res.status(404).json({ 
          message: "订仓单不存在或无权访问" 
        });
      }
      
      const order = await storage.updateBookingOrder(id, updateData, userId);
      res.json(order);
    } catch (error: any) {
      console.error("更新订仓单失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "订仓单不存在或无权访问" 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "更新订仓单失败" 
      });
    }
  });

  // 8. 数据导入任务管理 - 获取申报的导入任务列表
  app.get("/api/export-declarations/:declarationId/import-jobs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const jobs = await storage.getImportJobs(declarationId, userId);
      res.json(jobs);
    } catch (error: any) {
      console.error("获取导入任务列表失败:", error);
      res.status(500).json({ 
        message: error.message || "获取导入任务列表失败" 
      });
    }
  });

  // 9. 创建数据导入任务
  app.post("/api/export-declarations/:declarationId/import-jobs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const jobData = insertImportJobSchema.parse({
        ...req.body,
        declarationId
      });
      
      const job = await storage.createImportJob(jobData, userId);
      res.status(201).json(job);
    } catch (error: any) {
      console.error("创建导入任务失败:", error);
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        message: error.message || "创建导入任务失败" 
      });
    }
  });

  // 10. 更新导入任务状态
  app.put("/api/import-jobs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // 验证请求数据
      const updateData = updateImportJobSchema.parse(req.body);
      
      // 验证导入任务是否存在且属于当前用户
      const existing = await storage.getImportJob(id, userId);
      if (!existing) {
        return res.status(404).json({ 
          message: "导入任务不存在或无权访问" 
        });
      }
      
      const job = await storage.updateImportJob(id, updateData, userId);
      res.json(job);
    } catch (error: any) {
      console.error("更新导入任务失败:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "导入任务不存在或无权访问" 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "更新导入任务失败" 
      });
    }
  });

  // 11. 提交历史记录 - 获取申报的提交历史
  app.get("/api/export-declarations/:declarationId/submission-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      const { type } = req.query;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      let history;
      if (type) {
        history = await storage.getSubmissionHistoryByType(declarationId, type as string, userId);
      } else {
        history = await storage.getSubmissionHistory(declarationId, userId);
      }
      
      res.json(history);
    } catch (error: any) {
      console.error("获取提交历史失败:", error);
      res.status(500).json({ 
        message: error.message || "获取提交历史失败" 
      });
    }
  });

  // 12. 创建提交历史记录
  app.post("/api/export-declarations/:declarationId/submission-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      const historyData = insertSubmissionHistorySchema.parse({
        ...req.body,
        declarationId
      });
      
      const history = await storage.createSubmissionHistory(historyData, userId);
      res.status(201).json(history);
    } catch (error: any) {
      console.error("创建提交历史失败:", error);
      
      if (error.message.includes("not found or access denied")) {
        return res.status(403).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "数据验证失败",
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        message: error.message || "创建提交历史失败" 
      });
    }
  });

  // 13. 模板下载端点
  app.get("/api/export-templates/:templateType", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { templateType } = req.params;
      
      // 白名单模板类型
      const allowedTemplates = ['booking-order', 'customs-declaration', 'goods-info'];
      if (!allowedTemplates.includes(templateType)) {
        return res.status(404).json({ 
          message: "模板类型不存在" 
        });
      }
      
      // 模拟模板文件路径（实际部署时应该是真实的模板文件）
      const templatePaths: Record<string, string> = {
        'booking-order': '/templates/booking-order-template.xlsx',
        'customs-declaration': '/templates/customs-declaration-template.xlsx',
        'goods-info': '/templates/goods-info-template.xlsx'
      };
      
      res.json({
        templateType,
        downloadUrl: templatePaths[templateType],
        filename: `${templateType}-template.xlsx`,
        description: `${templateType}数据导入模板`
      });
    } catch (error: any) {
      console.error("获取模板失败:", error);
      res.status(500).json({ 
        message: error.message || "获取模板失败" 
      });
    }
  });

  // 14. 海关审核状态模拟端点
  app.post("/api/customs/simulate-review", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { forceTrigger } = req.body; // 可选：强制触发审核
      
      // 获取所有状态为 "under_review" 的申报记录
      const declarations = await storage.getExportDeclarations(userId);
      const underReviewDeclarations = declarations.filter(d => d.status === "under_review");
      
      if (underReviewDeclarations.length === 0) {
        return res.json({ 
          message: "没有待审核的申报记录",
          processed: 0
        });
      }
      
      const results = [];
      
      for (const declaration of underReviewDeclarations) {
        // 检查申报是否已经提交足够长时间（模拟审核时间）
        const submittedTime = new Date(declaration.generatedData?.submittedAt || declaration.readyAt);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - submittedTime.getTime()) / (1000 * 60);
        
        // 模拟审核条件：提交超过5分钟或强制触发
        if (timeDiffMinutes >= 5 || forceTrigger) {
          // 随机决定审核结果（70%通过，30%拒绝）
          const isApproved = Math.random() > 0.3;
          const newStatus = isApproved ? "approved" : "rejected";
          
          // 更新申报状态
          await storage.updateExportDeclaration(declaration.id, {
            status: newStatus
          }, userId);
          
          // 创建审核历史记录
          const auditResult = {
            submissionType: "customs_audit",
            platform: "single_window",
            status: "success",
            requestData: {
              declarationId: declaration.id,
              auditType: "automated_review"
            },
            responseData: {
              result: newStatus,
              auditTime: now.toISOString(),
              auditScore: isApproved ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 60) + 20,
              feedback: isApproved 
                ? "申报数据完整，符合海关要求，准予放行" 
                : "申报数据存在问题，需要补充相关材料后重新申报",
              auditOfficer: `审核员${Math.floor(Math.random() * 999) + 1}`,
              riskLevel: isApproved ? "低风险" : "高风险"
            }
          };
          
          try {
            await storage.createSubmissionHistory({
              ...auditResult,
              declarationId: declaration.id
            }, userId);
          } catch (historyError) {
            console.warn('创建审核历史记录失败:', historyError);
          }
          
          results.push({
            declarationId: declaration.id,
            title: declaration.title,
            oldStatus: "under_review",
            newStatus,
            auditTime: now.toISOString(),
            timeTaken: `${Math.round(timeDiffMinutes)}分钟`
          });
        }
      }
      
      res.json({
        message: `处理了 ${results.length} 个申报记录`,
        processed: results.length,
        results
      });
    } catch (error: any) {
      console.error("海关审核模拟失败:", error);
      res.status(500).json({ 
        message: error.message || "审核模拟失败" 
      });
    }
  });

  // 15. 单一窗口状态查询端点
  app.get("/api/single-window/status/:declarationId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { declarationId } = req.params;
      
      // 验证申报是否属于当前用户
      const declaration = await storage.getExportDeclaration(declarationId, userId);
      if (!declaration) {
        return res.status(404).json({ 
          message: "申报记录不存在或无权访问" 
        });
      }
      
      // 模拟中国国际单一窗口查询结果
      const mockStatus = {
        declarationId,
        status: declaration.status === 'approved' ? 'approved' : 'pending',
        customsNumber: declaration.status === 'approved' ? `CUSTOMS-${Date.now()}` : null,
        processTime: new Date().toISOString(),
        results: [
          {
            step: '海关接收',
            status: 'completed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            message: '申报单据已接收'
          },
          {
            step: '数据校验',
            status: declaration.customsValidated ? 'completed' : 'processing',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            message: declaration.customsValidated ? '数据校验通过' : '正在进行数据校验'
          },
          {
            step: '风险分析',
            status: declaration.status === 'approved' ? 'completed' : 'pending',
            timestamp: declaration.status === 'approved' ? new Date().toISOString() : null,
            message: declaration.status === 'approved' ? '风险分析完成，准予放行' : '等待风险分析结果'
          }
        ]
      };
      
      res.json(mockStatus);
    } catch (error: any) {
      console.error("查询单一窗口状态失败:", error);
      res.status(500).json({ 
        message: error.message || "查询状态失败" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
