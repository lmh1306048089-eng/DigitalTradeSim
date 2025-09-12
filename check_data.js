import { db } from './server/db.ts';
import * as schema from './shared/schema.ts';

async function checkDatabaseData() {
  try {
    console.log('=== 检查数据库连接和表数据 ===\n');
    
    // 检查实验表数据
    console.log('1. 检查实验表 (experiments):');
    const experiments = await db.select().from(schema.experiments);
    console.log(`   - 实验总数: ${experiments.length}`);
    if (experiments.length > 0) {
      experiments.forEach(exp => {
        console.log(`   - ${exp.name} (${exp.category})`);
      });
    } else {
      console.log('   - 没有实验数据');
    }
    
    console.log('\n2. 检查虚拟场景表 (virtual_scenes):');
    const scenes = await db.select().from(schema.virtualScenes);
    console.log(`   - 场景总数: ${scenes.length}`);
    if (scenes.length > 0) {
      scenes.forEach(scene => {
        console.log(`   - ${scene.name}: ${scene.description || '无描述'}`);
      });
    } else {
      console.log('   - 没有场景数据');
    }
    
    console.log('\n3. 检查业务角色表 (business_roles):');
    const businessRoles = await db.select().from(schema.businessRoles);
    console.log(`   - 业务角色总数: ${businessRoles.length}`);
    if (businessRoles.length > 0) {
      businessRoles.forEach(role => {
        console.log(`   - ${role.roleName} (${role.roleCode}): ${role.description || '无描述'}`);
      });
    } else {
      console.log('   - 没有业务角色数据');
    }
    
    console.log('\n4. 检查训练任务表 (training_tasks):');
    const tasks = await db.select().from(schema.trainingTasks);
    console.log(`   - 训练任务总数: ${tasks.length}`);
    if (tasks.length > 0) {
      tasks.forEach(task => {
        console.log(`   - ${task.title}: ${task.description || '无描述'}`);
      });
    } else {
      console.log('   - 没有训练任务数据');
    }
    
    console.log('\n5. 检查用户表 (users):');
    const users = await db.select().from(schema.users);
    console.log(`   - 用户总数: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - 手机: ${user.phone}`);
    });
    
    console.log('\n=== 数据库检查完成 ===');
    
  } catch (error) {
    console.error('查询数据库时出错:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseData();