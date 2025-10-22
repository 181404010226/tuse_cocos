#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// 项目根目录（本脚本位于 tools/ 下）
const ROOT = path.resolve(__dirname, '..');
const targetDir = path.join(ROOT, 'assets', 'exminiassets', 'level');

// 根节点目标位置与缩放
const desiredPosRoot = { x: 0, y: -200, z: 0 };
const desiredScaleRoot = { x: 0.8, y: 0.8, z: 1 };

// 形如 "数字-2" 的节点目标位置
const desiredPosDash2 = { x: 0, y: 600, z: 0 };
const dash2Pattern = /^\d+-2$/;

function setVec3(target, src) {
  target.__type__ = 'cc.Vec3';
  target.x = src.x; target.y = src.y; target.z = src.z;
}

function updateDash2Nodes(data) {
  let count = 0;
  for (const obj of data) {
    if (obj && obj.__type__ === 'cc.Node' && typeof obj._name === 'string' && dash2Pattern.test(obj._name)) {
      obj._lpos = obj._lpos || { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 };
      setVec3(obj._lpos, desiredPosDash2);
      count++;
    }
  }
  return count;
}

function updatePrefabFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let data;
  try { data = JSON.parse(text); } catch (e) {
    console.error(`\u2716 解析失败: ${path.basename(filePath)} - ${e.message}`);
    return { ok: false, dash2: 0 };
  }
  if (!Array.isArray(data)) {
    console.error(`\u2716 不是数组格式: ${path.basename(filePath)}`);
    return { ok: false, dash2: 0 };
  }

  const prefabIdx = data.findIndex(o => o && o.__type__ === 'cc.Prefab');
  if (prefabIdx === -1) {
    console.error(`\u2716 未找到 cc.Prefab: ${path.basename(filePath)}`);
    return { ok: false, dash2: 0 };
  }
  const rootIdRef = data[prefabIdx]?.data?.__id__;
  const rootNode = typeof rootIdRef === 'number' ? data[rootIdRef] : null;
  if (!rootNode || rootNode.__type__ !== 'cc.Node') {
    console.error(`\u2716 根节点不是 cc.Node: ${path.basename(filePath)}`);
    return { ok: false, dash2: 0 };
  }

  // 写入根节点位置与缩放
  rootNode._lpos = rootNode._lpos || { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 };
  rootNode._lscale = rootNode._lscale || { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 };
  setVec3(rootNode._lpos, desiredPosRoot);
  setVec3(rootNode._lscale, desiredScaleRoot);

  // 更新 "数字-2" 命名的节点位置
  const dash2Updated = updateDash2Nodes(data);

  const out = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, out, 'utf8');
  return { ok: true, dash2: dash2Updated };
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

  let ok = 0, fail = 0, dash2Total = 0;
  for (const f of files) {
    const res = updatePrefabFile(f);
    if (res.ok) {
      ok++;
      dash2Total += res.dash2;
      console.log(`\u2714 已更新: ${path.basename(f)} (dash2节点: ${res.dash2})`);
    } else {
      fail++;
    }
  }
  console.log(`完成。成功 ${ok} 个，失败 ${fail} 个。已设置 "数字-2" 节点 ${dash2Total} 个位置为 (0,600,0)。`);
}

if (require.main === module) {
  main();
}