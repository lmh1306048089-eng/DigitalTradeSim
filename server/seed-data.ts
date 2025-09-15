import { db } from './db.js';
import * as schema from '../shared/schema.js';

// 基础数据种子脚本
export async function seedBasicData() {
  try {
    console.log('开始初始化基础数据...');

    // 1. 创建5大虚拟场景
    const virtualScenes = [
      {
        id: 'enterprise_scene',
        name: '电商企业场景',
        description: '跨境电商企业操作环境，进行备案申报、单证制作等业务操作',
        imageUrl: '/images/enterprise-scene.jpg',
        operationPoints: [
          {
            businessRoleCode: 'enterprise_operator',
            entryName: '企业操作台',
            entryDescription: '进行备案申报、单证制作、订单管理等操作',
            allowedOperations: ['customs_filing', 'document_preparation', 'order_management']
          }
        ],
        interactiveElements: ['filing_form', 'document_upload', 'status_monitor'],
        status: 'active',
        order: 1
      },
      {
        id: 'customs_scene',
        name: '海关场景',
        description: '海关审核监管环境，进行单证审核、放行操作',
        imageUrl: '/images/customs-scene.jpg',
        operationPoints: [
          {
            businessRoleCode: 'customs_officer',
            entryName: '海关审核台',
            entryDescription: '审核企业备案信息、单证材料等',
            allowedOperations: ['review_filing', 'approve_documents', 'inspection_control']
          }
        ],
        interactiveElements: ['review_panel', 'approval_system', 'status_update'],
        status: 'active',
        order: 2
      },
      {
        id: 'customs_supervision_scene',
        name: '海关监管作业场所场景',
        description: '海关监管作业场所操作环境，进行货物监管作业',
        imageUrl: '/images/supervision-scene.jpg',
        operationPoints: [
          {
            businessRoleCode: 'logistics_operator',
            entryName: '监管作业台',
            entryDescription: '进行货物入库、出库、监管等作业',
            allowedOperations: ['cargo_supervision', 'warehouse_operation', 'compliance_check']
          }
        ],
        interactiveElements: ['cargo_system', 'supervision_monitor', 'operation_log'],
        status: 'active',
        order: 3
      },
      {
        id: 'overseas_warehouse_scene',
        name: '海外仓库场景',
        description: '海外仓储物流环境，进行商品存储和配送操作',
        imageUrl: '/images/overseas-warehouse.jpg',
        operationPoints: [
          {
            businessRoleCode: 'logistics_operator',
            entryName: '仓储操作台',
            entryDescription: '进行商品入库、出库、配送等操作',
            allowedOperations: ['warehouse_management', 'inventory_control', 'shipping_operation']
          }
        ],
        interactiveElements: ['inventory_system', 'shipping_panel', 'tracking_monitor'],
        status: 'active',
        order: 4
      },
      {
        id: 'buyer_home_scene',
        name: '买家居家场景',
        description: '消费者接收和验收商品的家庭环境',
        imageUrl: '/images/buyer-home.jpg',
        operationPoints: [
          {
            businessRoleCode: 'consumer',
            entryName: '收货确认台',
            entryDescription: '接收商品、验收质量、确认收货',
            allowedOperations: ['receive_goods', 'quality_check', 'confirm_delivery']
          }
        ],
        interactiveElements: ['delivery_confirmation', 'quality_assessment', 'feedback_system'],
        status: 'active',
        order: 5
      }
    ];

    // 2. 创建业务角色
    const businessRoles = [
      {
        id: 'enterprise_operator',
        roleCode: 'enterprise_operator',
        roleName: '跨境电商企业操作员',
        description: '负责企业资质备案、商品申报、单证制作等业务操作',
        availableScenes: ['enterprise_scene', 'customs_scene'],
        availableOperations: ['customs_filing', 'document_preparation', 'order_management', 'status_inquiry'],
        isActive: true
      },
      {
        id: 'customs_officer',
        roleCode: 'customs_officer',
        roleName: '海关审核员',
        description: '负责审核企业备案信息、单证材料、监管合规等',
        availableScenes: ['customs_scene', 'customs_supervision_scene'],
        availableOperations: ['review_filing', 'approve_documents', 'inspection_control', 'compliance_monitor'],
        isActive: true
      },
      {
        id: 'logistics_operator',
        roleCode: 'logistics_operator',
        roleName: '物流企业操作员',
        description: '负责货物监管、仓储管理、配送操作等物流业务',
        availableScenes: ['customs_supervision_scene', 'overseas_warehouse_scene'],
        availableOperations: ['cargo_supervision', 'warehouse_operation', 'shipping_operation', 'inventory_control'],
        isActive: true
      }
    ];

    // 3. 创建实验任务 - 海关企业资质备案
    const experiments = [
      {
        id: '873e1fe1-0430-4f47-9db2-c4f00e2b048f',
        name: '海关企业资质备案',
        description: '跨境电商企业进行海关企业资质备案，完成线上填报和材料提交',
        category: 'preparation',
        steps: [
          {
            id: 'step_1',
            title: '了解备案要求',
            description: '学习海关企业资质备案的相关法规和要求',
            type: 'instruction',
            content: '根据《海关企业资质备案管理办法》，跨境电商企业需要完成企业基本信息、经营范围、财务状况等资质备案。',
            estimatedTime: 5
          },
          {
            id: 'step_2',
            title: '填写企业基本信息',
            description: '在线填写企业基本信息表单',
            type: 'form',
            required: true,
            formFields: [
              { name: 'companyName', label: '企业名称', type: 'text', required: true },
              { name: 'unifiedCreditCode', label: '统一社会信用代码', type: 'text', required: true },
              { name: 'legalRepresentative', label: '法定代表人', type: 'text', required: true },
              { name: 'registeredAddress', label: '注册地址', type: 'text', required: true },
              { name: 'businessScope', label: '经营范围', type: 'textarea', required: true },
              { name: 'registeredCapital', label: '注册资本（万元）', type: 'number', required: true },
              { name: 'contactPerson', label: '联系人', type: 'text', required: true },
              { name: 'contactPhone', label: '联系电话', type: 'tel', required: true },
              { name: 'contactEmail', label: '联系邮箱', type: 'email', required: true }
            ],
            estimatedTime: 15
          },
          {
            id: 'step_3',
            title: '上传备案材料',
            description: '上传报关单位备案信息表（已盖章）',
            type: 'upload',
            required: true,
            uploadConfig: {
              acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
              maxSize: 10,
              maxFiles: 1,
              description: '请上传报关单位备案信息表（已盖章），支持PDF、JPG、PNG格式，大小不超过10MB'
            },
            estimatedTime: 10
          },
          {
            id: 'step_4',
            title: '提交备案申请',
            description: '确认信息无误后提交备案申请',
            type: 'submit',
            required: true,
            submitAction: 'customs_filing_submit',
            estimatedTime: 2
          }
        ],
        requirements: [
          '企业具有合法的经营资质',
          '准备好企业营业执照、法人身份证等基本材料',
          '报关单位备案信息表需加盖企业公章'
        ],
        order: 1,
        isActive: true
      },
      {
        id: 'b2e8f3c1-1234-4567-8901-234567890abc',
        name: '电子口岸IC卡申请',
        description: '企业入网申请，办理中国电子口岸数据中心IC卡，用于海关申报等业务操作',
        category: 'preparation',
        steps: [
          {
            id: 'step_1',
            title: '了解IC卡申请要求',
            description: '学习中国电子口岸数据中心IC卡申请的相关要求和流程',
            type: 'instruction',
            content: '根据《中国电子口岸数据中心管理办法》，进出口企业需要申请IC卡用于海关申报、检验检疫等电子口岸业务办理。IC卡是企业进行电子口岸业务的必要工具。',
            estimatedTime: 5
          },
          {
            id: 'step_2',
            title: '填写企业基本信息',
            description: '填写企业入网申请基本信息',
            type: 'form',
            required: true,
            formFields: [
              { name: 'companyName', label: '企业名称', type: 'text', required: true },
              { name: 'unifiedCreditCode', label: '统一社会信用代码', type: 'text', required: true },
              { name: 'legalRepresentative', label: '法定代表人', type: 'text', required: true },
              { name: 'registeredAddress', label: '注册地址', type: 'text', required: true },
              { name: 'businessLicense', label: '营业执照注册号', type: 'text', required: true },
              { name: 'registeredCapital', label: '注册资本（万元）', type: 'number', required: true },
              { name: 'contactPerson', label: '联系人', type: 'text', required: true },
              { name: 'contactPhone', label: '联系电话', type: 'tel', required: true },
              { name: 'contactEmail', label: '联系邮箱', type: 'email', required: true },
              { name: 'businessScope', label: '经营范围', type: 'textarea', required: true }
            ],
            estimatedTime: 15
          },
          {
            id: 'step_3',
            title: '填写操作员信息',
            description: '填写IC卡操作员信息和申请说明',
            type: 'form',
            required: true,
            formFields: [
              { name: 'operatorName', label: '操作员姓名', type: 'text', required: true },
              { name: 'operatorIdCard', label: '操作员身份证号', type: 'text', required: true },
              { name: 'customsDeclarantCertificate', label: '报关员证书编号', type: 'text', required: true },
              { name: 'foreignTradeRegistration', label: '对外贸易经营者备案登记表编号', type: 'text', required: true },
              { name: 'customsImportExportReceipt', label: '海关进出口货物收发货人备案回执编号', type: 'text', required: true },
              { name: 'applicationReason', label: '申请原因', type: 'textarea', required: true },
              { name: 'expectedCardQuantity', label: '申请IC卡数量', type: 'number', required: true }
            ],
            estimatedTime: 10
          },
          {
            id: 'step_4',
            title: '上传申请材料',
            description: '上传企业营业执照、操作员身份证等必要材料',
            type: 'upload',
            required: true,
            uploadConfig: {
              acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
              maxSize: 10,
              maxFiles: 5,
              description: '请依次上传：1.企业营业执照 2.操作员身份证 3.海关注册登记证书 4.对外贸易经营者备案登记表 5.海关进出口货物收发货人备案回执（支持PDF、JPG、PNG格式，单个文件不超过10MB）'
            },
            estimatedTime: 15
          },
          {
            id: 'step_5',
            title: '提交IC卡申请',
            description: '确认信息无误后提交IC卡申请',
            type: 'submit',
            required: true,
            submitAction: 'ic_card_application_submit',
            estimatedTime: 2
          }
        ],
        requirements: [
          '企业已完成海关进出口货物收发货人备案',
          '企业具有对外贸易经营者备案登记',
          '指定操作员具有报关员资格证书',
          '准备好企业营业执照、操作员身份证等材料'
        ],
        order: 2,
        isActive: true
      }
    ];

    // 4. 插入数据到数据库
    console.log('插入虚拟场景数据...');
    for (const scene of virtualScenes) {
      try {
        await db.insert(schema.virtualScenes).values(scene);
      } catch (error) {
        console.log(`场景 ${scene.name} 可能已存在，跳过插入`);
      }
    }

    console.log('插入业务角色数据...');
    for (const role of businessRoles) {
      try {
        await db.insert(schema.businessRoles).values(role);
      } catch (error) {
        console.log(`业务角色 ${role.roleName} 可能已存在，跳过插入`);
      }
    }

    console.log('插入实验任务数据...');
    for (const experiment of experiments) {
      try {
        await db.insert(schema.experiments).values(experiment);
      } catch (error) {
        console.log(`实验 ${experiment.name} 可能已存在，跳过插入`);
      }
    }

    // 7. 创建海关企业资质备案测试数据
    console.log('创建海关企业资质备案测试数据...');
    const customsTestDatasets = [
      {
        dataSetName: '默认测试企业',
        companyName: '深圳市跨境通电子商务有限公司',
        unifiedCreditCode: '91440300MA5DA1234X',
        registeredAddress: '深圳市南山区科技园南区高新中一道9号软件大厦A座15楼',
        legalRepresentative: '张三',
        businessLicense: 'GL440300123456789012345',
        contactPerson: '李四',
        contactPhone: '13800138001',
        contactEmail: 'contact@crossborder.com',
        businessScope: ['跨境电商零售进出口', '一般贸易进出口', '技术进出口', '货物进出口'],
        importExportLicense: 'IE4403001234567',
        registeredCapital: '1000000.00',
        isActive: true
      },
      {
        dataSetName: '示例电商企业',
        companyName: '上海全球购贸易股份有限公司',
        unifiedCreditCode: '91310000567890123Y',
        registeredAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦36楼',
        legalRepresentative: '王五',
        businessLicense: 'GL310000567890123456789',
        contactPerson: '赵六',
        contactPhone: '13900139002',
        contactEmail: 'service@globalmarket.com',
        businessScope: ['跨境电商零售进出口', '保税区仓储服务', '供应链管理服务'],
        importExportLicense: 'IE3100005678901',
        registeredCapital: '5000000.00',
        isActive: true
      }
    ];

    for (const testData of customsTestDatasets) {
      try {
        await db.insert(schema.customsTestData).values(testData);
        console.log(`✅ 测试数据集创建成功: ${testData.dataSetName}`);
      } catch (error) {
        console.error(`❌ 测试数据集创建失败: ${testData.dataSetName}`, error);
      }
    }

    // 8. 创建电子口岸IC卡申请测试数据
    console.log('创建电子口岸IC卡申请测试数据...');
    const icCardTestDatasets = [
      {
        dataSetName: '默认测试企业',
        companyName: '深圳市跨境通电子商务有限公司',
        unifiedCreditCode: '91440300MA5DA1234X',
        registeredAddress: '深圳市南山区科技园南区高新中一道9号软件大厦A座15楼',
        legalRepresentative: '张三',
        businessLicense: 'GL440300123456789012345',
        registeredCapital: '1000000.00',
        contactPerson: '李四',
        contactPhone: '13800138001',
        contactEmail: 'contact@crossborder.com',
        businessScope: ['跨境电商零售进出口', '一般贸易进出口', '技术进出口', '货物进出口'],
        operatorName: '李四',
        operatorIdCard: '440300199001011234',
        customsDeclarantCertificate: 'BG440300202400001',
        foreignTradeRegistration: 'FT440300202400001',
        customsImportExportReceipt: 'IE440300202400001',
        applicationReason: '企业新设立，需申请电子口岸IC卡用于进出口业务办理，包括海关申报、检验检疫等相关业务操作',
        expectedCardQuantity: 1,
        isActive: true
      },
      {
        dataSetName: '示例电商企业',
        companyName: '上海全球购贸易股份有限公司',
        unifiedCreditCode: '91310000567890123Y',
        registeredAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦36楼',
        legalRepresentative: '王五',
        businessLicense: 'GL310000567890123456789',
        registeredCapital: '5000000.00',
        contactPerson: '赵六',
        contactPhone: '13900139002',
        contactEmail: 'service@globalmarket.com',
        businessScope: ['跨境电商零售进出口', '保税区仓储服务', '供应链管理服务'],
        operatorName: '赵六',
        operatorIdCard: '310000199002022345',
        customsDeclarantCertificate: 'BG310000202400002',
        foreignTradeRegistration: 'FT310000202400002',
        customsImportExportReceipt: 'IE310000202400002',
        applicationReason: '业务扩展需要，申请电子口岸IC卡用于办理跨境电商相关海关业务，提高业务处理效率',
        expectedCardQuantity: 2,
        isActive: true
      }
    ];

    for (const testData of icCardTestDatasets) {
      try {
        await db.insert(schema.icCardTestData).values(testData);
        console.log(`✅ IC卡测试数据集创建成功: ${testData.dataSetName}`);
      } catch (error) {
        console.error(`❌ IC卡测试数据集创建失败: ${testData.dataSetName}`, error);
      }
    }

    console.log('基础数据初始化完成！');

    // 返回插入的数据用于验证
    return {
      scenes: virtualScenes.length,
      roles: businessRoles.length,
      experiments: experiments.length,
      testDatasets: customsTestDatasets.length,
      icCardTestDatasets: icCardTestDatasets.length
    };

  } catch (error) {
    console.error('初始化数据时出错:', error);
    throw error;
  }
}

// 创建默认测试数据
export async function seedTestData() {
  try {
    console.log('开始创建测试数据...');

    // 创建测试用户（如果不存在）
    const testUsers = [
      {
        phone: '13800000001',
        password: '$2a$10$8K1p/a0dUrziIWlgIm4Vx.A/c0T8EjkqOt.w2x1QJ5eLRGxkQjP9C', // password: 123456
        username: '测试企业操作员',
        role: 'student'
      },
      {
        phone: '13800000002',
        password: '$2a$10$8K1p/a0dUrziIWlgIm4Vx.A/c0T8EjkqOt.w2x1QJ5eLRGxkQjP9C', // password: 123456
        username: '测试海关审核员',
        role: 'student'
      }
    ];

    console.log('创建测试用户...');
    for (const user of testUsers) {
      try {
        await db.insert(schema.users).values(user);
      } catch (error) {
        // 用户可能已存在，跳过
        console.log(`用户 ${user.username} 已存在，跳过创建`);
      }
    }

    // 创建测试的海关企业资质备案数据
    const testFilingData = {
      companyName: '深圳市跨境贸易有限公司',
      unifiedCreditCode: '91440300123456789X',
      legalRepresentative: '张三',
      registeredAddress: '深圳市南山区科技园南区高新南一道999号',
      businessScope: '跨境电商零售进出口；电子商务；国际货运代理；供应链管理',
      registeredCapital: 1000,
      contactPerson: '李四',
      contactPhone: '0755-12345678',
      contactEmail: 'test@company.com'
    };

    console.log('测试数据创建完成！');
    console.log('默认测试数据：', testFilingData);

    return {
      users: testUsers.length,
      testData: testFilingData
    };

  } catch (error) {
    console.error('创建测试数据时出错:', error);
    throw error;
  }
}

// 主函数：运行完整的数据初始化流程
async function runSeeding() {
  try {
    console.log('=== 开始数据库数据初始化 ===\n');
    
    // 1. 初始化基础数据
    const basicResult = await seedBasicData();
    console.log(`✅ 基础数据创建完成：`);
    console.log(`   - 虚拟场景: ${basicResult.scenes}个`);
    console.log(`   - 业务角色: ${basicResult.roles}个`);
    console.log(`   - 实验任务: ${basicResult.experiments}个\n`);
    
    // 2. 创建测试数据
    const testResult = await seedTestData();
    console.log(`✅ 测试数据创建完成：`);
    console.log(`   - 测试用户: ${testResult.users}个\n`);
    
    console.log('=== 数据初始化完成！ ===');
    console.log('\n📋 接下来可以：');
    console.log('1. 登录系统测试海关企业资质备案功能');
    console.log('2. 使用测试账号：13800000001 / 密码：123456');
    console.log('3. 进入电商企业场景完成备案流程\n');
    
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// 如果直接运行此文件，执行种子数据初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding();
}