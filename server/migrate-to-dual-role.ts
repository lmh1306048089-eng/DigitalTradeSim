import { db } from "./db";
import { users, businessRoles, BUSINESS_ROLES, PRODUCT_ROLES } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function migrateToDualRoleSystem() {
  console.log("开始迁移到双层角色体系...");

  try {
    // 1. 首先创建5个基础业务角色
    const businessRoleData = [
      {
        roleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
        roleName: "跨境电商企业操作员",
        description: "负责发起实训流程，填写备案表、申报单、退税单，查看订单/物流数据",
        availableScenes: ["enterprise_scene"],
        availableOperations: ["备案申报", "出口申报", "退税申报", "查看订单"],
      },
      {
        roleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        roleName: "海关审核员",
        description: "审核备案材料、执行货物查验、反馈审核结果",
        availableScenes: ["customs_scene", "customs_supervision_scene"],
        availableOperations: ["审核备案", "货物查验", "布控查验", "出具通知书"],
      },
      {
        roleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        roleName: "物流企业操作员", 
        description: "执行货物运抵、海外仓拣货打包、配送签收",
        availableScenes: ["customs_supervision_scene", "overseas_warehouse_scene", "buyer_home_scene"],
        availableOperations: ["货物运抵", "拣货打包", "配送签收", "清关材料"],
      },
      {
        roleCode: BUSINESS_ROLES.PLATFORM_SPECIALIST,
        roleName: "跨境电商平台专员",
        description: "向企业操作员提供订单数据（系统自动推送）",
        availableScenes: [],
        availableOperations: ["订单推送"],
      },
      {
        roleCode: BUSINESS_ROLES.SERVICE_SPECIALIST,
        roleName: "综合服务企业专员",
        description: "接收申报数据并推送至海关（系统自动执行）",
        availableScenes: [],
        availableOperations: ["申报推送"],
      }
    ];

    console.log("插入业务角色数据...");
    for (const roleData of businessRoleData) {
      await db.insert(businessRoles).values(roleData).onConflictDoNothing();
    }

    console.log("双层角色体系迁移完成！");
    
    return {
      success: true,
      message: "成功创建了5个基础业务角色"
    };

  } catch (error) {
    console.error("迁移过程中出现错误:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

// 如果直接运行此文件则执行迁移
if (require.main === module) {
  migrateToDualRoleSystem()
    .then((result) => {
      if (result.success) {
        console.log("✅ 迁移成功:", result.message);
        process.exit(0);
      } else {
        console.error("❌ 迁移失败:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("❌ 迁移过程中发生错误:", error);
      process.exit(1);
    });
}