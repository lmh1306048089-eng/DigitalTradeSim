import { useState, useEffect } from "react";
import { 
  BUSINESS_ROLE_CONFIGS,
  SCENE_CONFIGS,
  WORKFLOW_CONFIGS,
  getAvailableScenes,
  getWorkflowsByBusinessRole,
  canAccessScene,
  getSceneOperationPoints,
  type BusinessRoleConfig,
  type SceneConfig,
  type WorkflowConfig
} from "@shared/business-roles";

// 业务角色会话管理（使用 localStorage）
const BUSINESS_ROLE_KEY = "selected_business_role";
const TASK_CONTEXT_KEY = "current_task_context";

export interface TaskContext {
  taskId?: string;
  workflowCode?: string;
  currentStep?: number;
}

export function useBusinessRole() {
  const [selectedRoleCode, setSelectedRoleCode] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<TaskContext | null>(null);

  // 初始化时从 localStorage 恢复状态
  useEffect(() => {
    const savedRole = localStorage.getItem(BUSINESS_ROLE_KEY);
    const savedContext = localStorage.getItem(TASK_CONTEXT_KEY);
    
    
    if (savedRole && BUSINESS_ROLE_CONFIGS[savedRole]) {
      setSelectedRoleCode(savedRole);
    } else {
      // 如果没有保存的角色，确保状态为null
      setSelectedRoleCode(null);
    }
    
    if (savedContext) {
      try {
        setTaskContext(JSON.parse(savedContext));
      } catch (e) {
        console.warn("Failed to parse task context from localStorage");
      }
    }
  }, []);

  // 选择业务角色
  const selectBusinessRole = (roleCode: string) => {
    if (!BUSINESS_ROLE_CONFIGS[roleCode]) {
      throw new Error(`Invalid business role: ${roleCode}`);
    }
    
    setSelectedRoleCode(roleCode);
    localStorage.setItem(BUSINESS_ROLE_KEY, roleCode);
  };

  // 清除业务角色选择
  const clearBusinessRole = () => {
    setSelectedRoleCode(null);
    setTaskContext(null);
    localStorage.removeItem(BUSINESS_ROLE_KEY);
    localStorage.removeItem(TASK_CONTEXT_KEY);
  };

  // 设置任务上下文
  const setCurrentTask = (context: TaskContext) => {
    setTaskContext(context);
    localStorage.setItem(TASK_CONTEXT_KEY, JSON.stringify(context));
  };

  // 获取当前角色配置
  const getCurrentRole = (): BusinessRoleConfig | null => {
    return selectedRoleCode ? BUSINESS_ROLE_CONFIGS[selectedRoleCode] : null;
  };

  // 获取可访问的场景
  const getAccessibleScenes = (): SceneConfig[] => {
    if (!selectedRoleCode) return [];
    return getAvailableScenes(selectedRoleCode);
  };

  // 获取相关的工作流程
  const getRelevantWorkflows = (): WorkflowConfig[] => {
    if (!selectedRoleCode) return [];
    return getWorkflowsByBusinessRole(selectedRoleCode);
  };

  // 检查是否可以访问特定场景
  const canAccessSpecificScene = (sceneCode: string): boolean => {
    if (!selectedRoleCode) return false;
    return canAccessScene(selectedRoleCode, sceneCode);
  };

  // 获取场景中的操作入口
  const getSceneOperations = (sceneCode: string) => {
    if (!selectedRoleCode) return [];
    return getSceneOperationPoints(sceneCode, selectedRoleCode);
  };

  // 检查角色是否已选择
  const hasSelectedRole = (): boolean => {
    return selectedRoleCode !== null && selectedRoleCode !== undefined;
  };

  // 获取角色状态摘要
  const getRoleStatus = () => {
    const currentRole = getCurrentRole();
    const accessibleScenes = getAccessibleScenes();
    const relevantWorkflows = getRelevantWorkflows();

    return {
      hasRole: hasSelectedRole(),
      currentRole,
      selectedRoleCode,
      accessibleScenes,
      relevantWorkflows,
      taskContext,
      stats: {
        scenesCount: accessibleScenes.length,
        workflowsCount: relevantWorkflows.length,
        operationsCount: currentRole?.availableOperations.length || 0,
      }
    };
  };

  return {
    // 状态
    selectedRoleCode,
    taskContext,
    hasSelectedRole: selectedRoleCode !== null && selectedRoleCode !== undefined,
    
    // 操作
    selectBusinessRole,
    clearBusinessRole,
    setCurrentTask,
    
    // 查询方法
    getCurrentRole,
    getAccessibleScenes,
    getRelevantWorkflows,
    canAccessSpecificScene,
    getSceneOperations,
    getRoleStatus,
  };
}