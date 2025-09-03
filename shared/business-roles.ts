// 双层角色体系的业务逻辑定义
// 采用内存配置方式，避免数据库迁移复杂度

export const PRODUCT_ROLES = {
  STUDENT: "student",    // 实训学生
  TEACHER: "teacher",    // 实训教师
  ADMIN: "admin"         // 系统管理员
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

// 业务角色配置（内存存储）
export interface BusinessRoleConfig {
  roleCode: string;
  roleName: string;
  description: string;
  availableScenes: string[];
  availableOperations: string[];
  isSystemRole?: boolean; // 是否为系统自动角色
}

export const BUSINESS_ROLE_CONFIGS: Record<string, BusinessRoleConfig> = {
  [BUSINESS_ROLES.ENTERPRISE_OPERATOR]: {
    roleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
    roleName: "跨境电商企业操作员",
    description: "负责发起实训流程，填写备案表、申报单、退税单，查看订单/物流数据",
    availableScenes: [SCENES.ENTERPRISE],
    availableOperations: ["备案申报", "出口申报", "退税申报", "查看订单数据"],
  },
  [BUSINESS_ROLES.CUSTOMS_OFFICER]: {
    roleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
    roleName: "海关审核员",
    description: "审核备案材料、执行货物查验、反馈审核结果",
    availableScenes: [SCENES.CUSTOMS, SCENES.CUSTOMS_SUPERVISION],
    availableOperations: ["审核备案材料", "布控查验", "货物查验", "出具查验通知书"],
  },
  [BUSINESS_ROLES.LOGISTICS_OPERATOR]: {
    roleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
    roleName: "物流企业操作员",
    description: "执行货物运抵、海外仓拣货打包、配送签收",
    availableScenes: [SCENES.CUSTOMS_SUPERVISION, SCENES.OVERSEAS_WAREHOUSE, SCENES.BUYER_HOME],
    availableOperations: ["货物运抵登记", "海外仓拣货", "打包配送", "买家签收", "清关材料提交"],
  },
  [BUSINESS_ROLES.PLATFORM_SPECIALIST]: {
    roleCode: BUSINESS_ROLES.PLATFORM_SPECIALIST,
    roleName: "跨境电商平台专员",
    description: "向企业操作员提供订单数据（系统自动推送）",
    availableScenes: [],
    availableOperations: ["订单数据推送"],
    isSystemRole: true,
  },
  [BUSINESS_ROLES.SERVICE_SPECIALIST]: {
    roleCode: BUSINESS_ROLES.SERVICE_SPECIALIST,
    roleName: "综合服务企业专员",
    description: "接收申报数据并推送至海关（系统自动执行）",
    availableScenes: [],
    availableOperations: ["申报数据推送"],
    isSystemRole: true,
  },
};

// 场景配置（基于业务角色的操作入口）
export interface SceneConfig {
  sceneCode: string;
  sceneName: string;
  description: string;
  imageUrl?: string;
  operationPoints: {
    businessRoleCode: string;
    entryName: string;
    entryDescription: string;
    allowedOperations: string[];
  }[];
}

export const SCENE_CONFIGS: Record<string, SceneConfig> = {
  [SCENES.ENTERPRISE]: {
    sceneCode: SCENES.ENTERPRISE,
    sceneName: "电商企业场景",
    description: "模拟企业办公室，含电脑操作端（备案/申报系统入口）、材料提交区",
    imageUrl: "/attached_assets/generated_images/enterprise-office_b8f9c4d2.png",
    operationPoints: [
      {
        businessRoleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
        entryName: "电脑操作端",
        entryDescription: "备案系统、申报系统、退税系统入口",
        allowedOperations: ["备案申报", "出口申报", "退税申报"]
      }
    ]
  },
  [SCENES.CUSTOMS]: {
    sceneCode: SCENES.CUSTOMS,
    sceneName: "海关场景",
    description: "模拟海关办事窗口、审核区、公告栏（查验通知书展示）",
    imageUrl: "/attached_assets/generated_images/customs-office_c5a8b3e1.png",
    operationPoints: [
      {
        businessRoleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        entryName: "办事窗口",
        entryDescription: "备案材料审核、通知书出具",
        allowedOperations: ["审核备案材料", "出具查验通知书"]
      }
    ]
  },
  [SCENES.CUSTOMS_SUPERVISION]: {
    sceneCode: SCENES.CUSTOMS_SUPERVISION,
    sceneName: "海关监管作业场所场景",
    description: "模拟查验区、机查区、货物出入口（运抵登记入口）",
    imageUrl: "/attached_assets/generated_images/inspection-facility_a9d7e2f3.png",
    operationPoints: [
      {
        businessRoleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        entryName: "查验区",
        entryDescription: "布控查验、人工/机查操作",
        allowedOperations: ["布控查验", "货物查验"]
      },
      {
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        entryName: "货物出入口",
        entryDescription: "运抵登记、配合查验",
        allowedOperations: ["货物运抵登记"]
      }
    ]
  },
  [SCENES.OVERSEAS_WAREHOUSE]: {
    sceneCode: SCENES.OVERSEAS_WAREHOUSE,
    sceneName: "海外仓库场景",
    description: "模拟拣货区、复检区、打包区，含货架、扫码设备模型（拣货操作入口）",
    imageUrl: "/attached_assets/generated_images/overseas-warehouse_d4e1f9a8.png",
    operationPoints: [
      {
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        entryName: "拣货区",
        entryDescription: "扫码设备、拣货打包操作",
        allowedOperations: ["海外仓拣货", "打包配送"]
      }
    ]
  },
  [SCENES.BUYER_HOME]: {
    sceneCode: SCENES.BUYER_HOME,
    sceneName: "买家居家场景",
    description: "模拟门铃提示、包裹接收弹窗（签收确认入口）",
    imageUrl: "/attached_assets/generated_images/buyer-home_e7f2a1b9.png",
    operationPoints: [
      {
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        entryName: "配送入口",
        entryDescription: "配送包裹、买家签收确认",
        allowedOperations: ["买家签收"]
      }
    ]
  }
};

// 工作流程配置（6大协作流程）
export interface WorkflowConfig {
  workflowCode: string;
  workflowName: string;
  description: string;
  requiredBusinessRoles: string[];
  steps: {
    stepName: string;
    businessRoleCode: string;
    sceneCode: string;
    operations: string[];
    description: string;
  }[];
  prerequisites?: string[]; // 前置流程要求
}

export const WORKFLOW_CONFIGS: Record<string, WorkflowConfig> = {
  [WORKFLOWS.PREPARATION]: {
    workflowCode: WORKFLOWS.PREPARATION,
    workflowName: "前期准备",
    description: "完成5项备案（企业操作员填报→海关审核员审核）",
    requiredBusinessRoles: [BUSINESS_ROLES.ENTERPRISE_OPERATOR, BUSINESS_ROLES.CUSTOMS_OFFICER],
    steps: [
      {
        stepName: "企业备案申请",
        businessRoleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
        sceneCode: SCENES.ENTERPRISE,
        operations: ["备案申报"],
        description: "在电商企业场景填写5类备案表：海关资质备案、商品备案等"
      },
      {
        stepName: "海关审核备案",
        businessRoleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        sceneCode: SCENES.CUSTOMS,
        operations: ["审核备案材料"],
        description: "在海关场景审核企业提交的备案材料，出具审核结果"
      }
    ]
  },
  [WORKFLOWS.EXPORT_DECLARATION]: {
    workflowCode: WORKFLOWS.EXPORT_DECLARATION,
    workflowName: "出口申报",
    description: "企业操作员填单→平台专员推订单→综合服务专员推申报→海关审核员校验",
    requiredBusinessRoles: [BUSINESS_ROLES.ENTERPRISE_OPERATOR, BUSINESS_ROLES.CUSTOMS_OFFICER],
    prerequisites: [WORKFLOWS.PREPARATION],
    steps: [
      {
        stepName: "企业申报填单",
        businessRoleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
        sceneCode: SCENES.ENTERPRISE,
        operations: ["出口申报"],
        description: "填写出口报关单，系统自动获取平台订单数据和服务商协助"
      },
      {
        stepName: "海关审单校验",
        businessRoleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        sceneCode: SCENES.CUSTOMS,
        operations: ["审核备案材料"],
        description: "校验申报数据，决定是否布控查验"
      }
    ]
  },
  [WORKFLOWS.INSPECTION_RELEASE]: {
    workflowCode: WORKFLOWS.INSPECTION_RELEASE,
    workflowName: "查验放行",
    description: "海关审核员布控查验→企业操作员配合→物流企业操作员运货",
    requiredBusinessRoles: [BUSINESS_ROLES.CUSTOMS_OFFICER, BUSINESS_ROLES.LOGISTICS_OPERATOR],
    prerequisites: [WORKFLOWS.EXPORT_DECLARATION],
    steps: [
      {
        stepName: "布控查验",
        businessRoleCode: BUSINESS_ROLES.CUSTOMS_OFFICER,
        sceneCode: SCENES.CUSTOMS_SUPERVISION,
        operations: ["布控查验", "货物查验"],
        description: "在海关监管场所执行查验，选择人工查验或机器查验"
      },
      {
        stepName: "货物运抵",
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        sceneCode: SCENES.CUSTOMS_SUPERVISION,
        operations: ["货物运抵登记"],
        description: "物流企业配合查验，完成运抵登记手续"
      }
    ]
  },
  [WORKFLOWS.DESTINATION_CLEARANCE]: {
    workflowCode: WORKFLOWS.DESTINATION_CLEARANCE,
    workflowName: "目的国入境清关",
    description: "物流企业操作员提交清关材料→目的国海关（系统自动审核）",
    requiredBusinessRoles: [BUSINESS_ROLES.LOGISTICS_OPERATOR],
    prerequisites: [WORKFLOWS.INSPECTION_RELEASE],
    steps: [
      {
        stepName: "清关材料提交",
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        sceneCode: SCENES.OVERSEAS_WAREHOUSE,
        operations: ["清关材料提交"],
        description: "在海外仓场景提交目的国清关所需材料，系统自动处理"
      }
    ]
  },
  [WORKFLOWS.OVERSEAS_DELIVERY]: {
    workflowCode: WORKFLOWS.OVERSEAS_DELIVERY,
    workflowName: "境外配送",
    description: "物流企业操作员拣货打包→买家居家场景签收",
    requiredBusinessRoles: [BUSINESS_ROLES.LOGISTICS_OPERATOR],
    prerequisites: [WORKFLOWS.DESTINATION_CLEARANCE],
    steps: [
      {
        stepName: "海外仓拣货",
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        sceneCode: SCENES.OVERSEAS_WAREHOUSE,
        operations: ["海外仓拣货", "打包配送"],
        description: "在海外仓库场景扫码拣货，完成打包"
      },
      {
        stepName: "买家签收",
        businessRoleCode: BUSINESS_ROLES.LOGISTICS_OPERATOR,
        sceneCode: SCENES.BUYER_HOME,
        operations: ["买家签收"],
        description: "在买家居家场景完成最后一公里配送和签收"
      }
    ]
  },
  [WORKFLOWS.TAX_REFUND]: {
    workflowCode: WORKFLOWS.TAX_REFUND,
    workflowName: "退税申报",
    description: "企业操作员填退税单→系统自动审核（简化实训）",
    requiredBusinessRoles: [BUSINESS_ROLES.ENTERPRISE_OPERATOR],
    prerequisites: [WORKFLOWS.OVERSEAS_DELIVERY],
    steps: [
      {
        stepName: "退税单填报",
        businessRoleCode: BUSINESS_ROLES.ENTERPRISE_OPERATOR,
        sceneCode: SCENES.ENTERPRISE,
        operations: ["退税申报"],
        description: "在电商企业场景填写出口退税申报单，系统自动审核"
      }
    ]
  }
};

// 工具函数
export function getBusinessRolesByProductRole(productRole: string): BusinessRoleConfig[] {
  // 只有学生可以选择业务角色
  if (productRole !== PRODUCT_ROLES.STUDENT) {
    return [];
  }
  
  // 返回非系统自动的业务角色
  return Object.values(BUSINESS_ROLE_CONFIGS).filter(role => !role.isSystemRole);
}

export function getAvailableScenes(businessRoleCode: string): SceneConfig[] {
  const role = BUSINESS_ROLE_CONFIGS[businessRoleCode];
  if (!role) return [];
  
  return role.availableScenes
    .map(sceneCode => SCENE_CONFIGS[sceneCode])
    .filter(Boolean);
}

export function getWorkflowsByBusinessRole(businessRoleCode: string): WorkflowConfig[] {
  return Object.values(WORKFLOW_CONFIGS).filter(workflow =>
    workflow.requiredBusinessRoles.includes(businessRoleCode)
  );
}

export function canAccessScene(businessRoleCode: string, sceneCode: string): boolean {
  const role = BUSINESS_ROLE_CONFIGS[businessRoleCode];
  return role ? role.availableScenes.includes(sceneCode) : false;
}

export function getSceneOperationPoints(sceneCode: string, businessRoleCode: string) {
  const scene = SCENE_CONFIGS[sceneCode];
  if (!scene) return [];
  
  return scene.operationPoints.filter(point => 
    point.businessRoleCode === businessRoleCode
  );
}