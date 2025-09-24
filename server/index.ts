import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, IStorage } from "./storage";

const app = express();
app.use(express.json({ limit: '15mb' })); // 增加body size限制以支持AI文档解析
app.use(express.urlencoded({ extended: false, limit: '15mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    // Skip logging HEAD requests to reduce noise from monitoring health checks
    if (path.startsWith("/api") && req.method !== "HEAD") {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // 启动后台海关审核定时任务
    startCustomsReviewScheduler(storage);
  });
})();

// 后台海关审核定时任务
function startCustomsReviewScheduler(storage: IStorage) {
  log("🏛️ 启动海关审核后台定时任务...");
  
  // 每120秒（2分钟）检查一次待审核的申报
  const reviewInterval = setInterval(async () => {
    try {
      // 获取所有待审核的申报记录 - 暂时通过直接数据库查询实现
      // TODO: 后续可以在storage接口中添加getAllDeclarations方法
      const underReviewDeclarations = await storage.getAllUnderReviewDeclarations();
      
      if (underReviewDeclarations.length === 0) {
        return; // 没有待审核的申报
      }
      
      let processedCount = 0;
      
      for (const declaration of underReviewDeclarations) {
        try {
          // 检查申报是否已经提交足够长时间（模拟审核时间）
          const submittedTimeStr = declaration.generatedData?.submittedAt || 
                                 (declaration.readyAt ? declaration.readyAt.toISOString() : null);
          
          if (!submittedTimeStr) {
            log(`⚠️ 申报 ${declaration.id} 缺少提交时间，跳过审核`);
            continue;
          }
          
          const submittedTime = new Date(submittedTimeStr);
          const now = new Date();
          
          // 检查日期是否有效
          if (isNaN(submittedTime.getTime())) {
            log(`⚠️ 申报 ${declaration.id} 提交时间无效: ${submittedTimeStr}`);
            continue;
          }
          
          const timeDiffMinutes = (now.getTime() - submittedTime.getTime()) / (1000 * 60);
          
          // 模拟审核条件：提交超过5分钟
          if (timeDiffMinutes >= 5) {
            // 随机决定审核结果（70%通过，30%拒绝）
            const isApproved = Math.random() > 0.3;
            const newStatus = isApproved ? "approved" : "rejected";
            
            // 更新申报状态
            await storage.updateExportDeclaration(declaration.id, {
              status: newStatus
            }, declaration.userId);
            
            // 创建审核历史记录
            try {
              await storage.createSubmissionHistory({
                declarationId: declaration.id,
                submissionType: "customs_audit",
                platform: "single_window", 
                status: "success",
                requestData: {
                  declarationId: declaration.id,
                  auditType: "automated_background_review"
                },
                responseData: {
                  result: newStatus,
                  auditTime: now.toISOString(),
                  auditScore: isApproved ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 60) + 20,
                  feedback: isApproved 
                    ? "申报数据完整，符合海关要求，准予放行" 
                    : "申报数据存在问题，需要补充相关材料后重新申报",
                  auditOfficer: `审核员${Math.floor(Math.random() * 999) + 1}`,
                  riskLevel: isApproved ? "低风险" : "高风险",
                  processedBy: "background_scheduler"
                }
              }, declaration.userId);
            } catch (historyError: any) {
              log(`⚠️ 创建审核历史记录失败 (${declaration.id}):`, historyError?.message || historyError);
            }
            
            processedCount++;
            log(`✅ 后台审核完成: ${declaration.title} -> ${newStatus} (耗时${Math.round(timeDiffMinutes)}分钟)`);
          }
        } catch (declarationError: any) {
          log(`❌ 处理申报失败 (${declaration.id}):`, declarationError?.message || declarationError);
        }
      }
      
      if (processedCount > 0) {
        log(`🏛️ 后台海关审核任务完成，处理了 ${processedCount} 个申报记录`);
      }
    } catch (error: any) {
      log(`❌ 海关审核定时任务失败:`, error?.message || error);
    }
  }, 120000); // 每120秒检查一次
  
  log("✅ 海关审核后台定时任务已启动 (每120秒检查一次)");
  
  // 优雅关闭时清理定时器
  process.on('SIGTERM', () => {
    clearInterval(reviewInterval);
    log("🔄 海关审核定时任务已停止");
  });
  
  process.on('SIGINT', () => {
    clearInterval(reviewInterval);
    log("🔄 海关审核定时任务已停止");
  });
}
