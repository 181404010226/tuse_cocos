#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// 项目根目录（本脚本位于 tools/ 下）
const ROOT = path.resolve(__dirname, '..');
const targetDir = path.join(ROOT, 'assets', 'exminiassets', 'level');

// 目标位置与缩放
const desiredPos = { x: 0, y: -200, z: 0 };
const desiredScale = { x: 0.8, y: 0.8, z: 1 };

function updatePrefabFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error(`\u2716 解析失败: ${path.basename(filePath)} - ${e.message}`);
    return false;
  }
  if (!Array.isArray(data)) {
    console.error(`\u2716 不是数组格式: ${path.basename(filePath)}`);
    return false;
  }

  const prefabIdx = data.findIndex(o => o && o.__type__ === 'cc.Prefab');
  if (prefabIdx === -1) {
    console.error(`\u2716 未找到 cc.Prefab: ${path.basename(filePath)}`);
    return false;
  }
  const rootIdRef = data[prefabIdx]?.data?.__id__;
  if (typeof rootIdRef !== 'number') {
    console.error(`\u2716 Prefab.data.__id__ 不合法: ${path.basename(filePath)}`);
    return false;
  }

  const rootNode = data[rootIdRef];
  if (!rootNode || rootNode.__type__ !== 'cc.Node') {
    console.error(`\u2716 根节点不是 cc.Node: ${path.basename(filePath)}`);
    return false;
  }

  // 确保字段存在
  rootNode._lpos = rootNode._lpos || { "__type__": "cc.Vec3", x: 0, y: 0, z: 0 };
  rootNode._lscale = rootNode._lscale || { "__type__": "cc.Vec3", x: 1, y: 1, z: 1 };

  // 写入目标值
  rootNode._lpos.x = desiredPos.x;
  rootNode._lpos.y = desiredPos.y;
  rootNode._lpos.z = desiredPos.z;

  rootNode._lscale.x = desiredScale.x;
  rootNode._lscale.y = desiredScale.y;
  rootNode._lscale.z = desiredScale.z;

  const out = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, out, 'utf8');
  return true;
}

function main() {
  if (!fs.existsSync(targetDir)) {
    console.error(`\u2716 目录不存在: ${targetDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir)
    .filter(name => name.endsWith('.prefab'))
    .map(name => path.join(targetDir, name));

  if (files.length === 0) {
    console.warn('未找到 .prefab 文件。');
    return;
  }

  let ok = 0, fail = 0;
  for (const f of files) {
    const res = updatePrefabFile(f);
    if (res) {
      ok++;
      console.log(`\u2714 已更新: ${path.basename(f)}`);
    } else {
      fail++;
    }
  }
  console.log(`完成。成功 ${ok} 个，失败 ${fail} 个。`);
}

if (require.main === module) {
  main();
}