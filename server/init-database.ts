import { db } from "./db";
import { sql } from "drizzle-orm";
import { BUSINESS_ROLE_CONFIGS } from "@shared/business-roles";

export async function initializeDatabase() {
  console.log("正在初始化数据库架构...");

  try {
    // 1. 为 virtual_scenes 表添加缺失字段（检查后添加）
    try {
      await db.execute(sql`ALTER TABLE virtual_scenes ADD COLUMN operation_points JSON`);
    } catch (e) {
      console.log("operation_points 字段可能已存在");
    }
    try {
      await db.execute(sql`ALTER TABLE virtual_scenes ADD COLUMN interactive_elements JSON`);
    } catch (e) {
      console.log("interactive_elements 字段可能已存在");
    }
    console.log("✅ virtual_scenes 表字段已更新");

    // 2. 为 student_progress 表添加缺失字段
    try {
      await db.execute(sql`ALTER TABLE student_progress ADD COLUMN business_role_id VARCHAR(36)`);
    } catch (e) {
      console.log("business_role_id 字段可能已存在");
    }
    try {
      await db.execute(sql`ALTER TABLE student_progress ADD COLUMN scene_id VARCHAR(36)`);
    } catch (e) {
      console.log("scene_id 字段可能已存在");
    }
    console.log("✅ student_progress 表字段已更新");

    // 3. 创建 business_roles 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_roles (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        role_code VARCHAR(50) UNIQUE NOT NULL,
        role_name VARCHAR(100) NOT NULL,
        description TEXT,
        available_scenes JSON,
        available_operations JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ business_roles 表已创建");

    // 4. 创建 user_business_roles 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_business_roles (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        business_role_id VARCHAR(36) NOT NULL,
        task_id VARCHAR(36),
        is_active BOOLEAN DEFAULT TRUE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (business_role_id) REFERENCES business_roles(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ user_business_roles 表已创建");

    // 5. 创建 collaboration_data 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collaboration_data (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        task_id VARCHAR(36) NOT NULL,
        from_user_id VARCHAR(36) NOT NULL,
        from_role_code VARCHAR(50) NOT NULL,
        to_user_id VARCHAR(36),
        to_role_code VARCHAR(50) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSON,
        status VARCHAR(20) DEFAULT 'pending',
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ collaboration_data 表已创建");

    // 6. 初始化基础业务角色数据
    console.log("正在初始化业务角色数据...");
    
    for (const roleConfig of Object.values(BUSINESS_ROLE_CONFIGS)) {
      await db.execute(sql`
        INSERT IGNORE INTO business_roles (id, role_code, role_name, description, available_scenes, available_operations, is_active)
        VALUES (UUID(), ${roleConfig.roleCode}, ${roleConfig.roleName}, ${roleConfig.description}, 
                ${JSON.stringify(roleConfig.availableScenes)}, ${JSON.stringify(roleConfig.availableOperations)}, TRUE)
      `);
    }
    console.log("✅ 业务角色数据已初始化");

    console.log("🎉 数据库初始化完成！");
    return { success: true };

  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
    return { success: false, error };
  }
}

// 自动执行初始化
initializeDatabase()
  .then((result) => {
    if (result.success) {
      console.log("数据库初始化成功");
      process.exit(0);
    } else {
      console.error("数据库初始化失败:", result.error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("初始化过程中发生错误:", error);
    process.exit(1);
  });