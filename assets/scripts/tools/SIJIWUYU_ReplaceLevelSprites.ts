import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, assetManager, UITransform, Color, sp } from 'cc';
const { ccclass, property, executeInEditMode, disallowMultiple, menu } = _decorator;
import { SIJIWUYU_MoveOnClick } from '../minibattle/exmini/SIJIWUYU_MoveOnClick';

const DEFAULT_SPRITE_UUID = '01437c3e-ab48-49fb-9a83-06dc547724c0@f9941';
const GROUP_CONTAINER_NAME = 'SIJIWUYU_Group';

// 基于颜色的 Spine SkeletonData 映射（来自 smallPeople/*/待机/ren_hong.json.meta）
const COLOR_SKELETON_UUID_MAP: Record<string, string> = {
  yellow: 'ecd04ce6-f110-4d10-ae4e-5094c38bd1fe',
  red: 'dcbd5fbc-f0cd-45f1-8688-35688a1f2f45',
  green: '9a16ac54-b16d-4a69-8395-0fd883cc62d0',
  blue: 'bbe97224-5f2c-4d36-95a9-8307557fb82f',
  purple: 'e049c8a8-b805-44af-8f4f-089bd720d84c',
  cyan: '3774ea2e-15b9-443c-9507-3b40dc90cd64',
  orange: '1fc230c2-3d43-46b8-a77d-945b35fca990',
  brown: 'c5bc1be3-729f-4e5a-8c72-803f9263559',
  dark_yellow: '0163914c-aefa-43b9-bae4-d2633fe17908',
  olive: '0163914c-aefa-43b9-bae4-d2633fe17908', // 橄榄与深黄使用同一资源
};

// 颜色编码到分类键的精确映射（十六进制 RGB，无 #，大写）
const EXACT_HEX_TO_COLOR_KEY: Record<string, keyof typeof COLOR_SKELETON_UUID_MAP> = {
  'FF0030': 'red',
  'FF9C00': 'orange',
  'FFF605': 'yellow',
  '4BF0CF': 'cyan',
  '96462C': 'brown',
  'DBAE26': 'olive',
  '58B3E7': 'blue',
  '1EFF00': 'green',
  'E42CFF': 'purple',
};

@ccclass('SIJIWUYU_ReplaceLevelSprites')
@executeInEditMode(true)
@disallowMultiple
export class SIJIWUYU_ReplaceLevelSprites extends Component {
  @property({ tooltip: '根据 prefab 名称中的数字匹配（如 level19 -> 19-2）' })
  nameSuffix: string = '-2';

  @property({ type: SpriteFrame, tooltip: '要替换成的 SpriteFrame 资源（统一替换），未设置则自动加载默认' })
  spriteFrame: SpriteFrame | null = null;

  @property({ tooltip: '勾选后为小人替换为骨骼动画（按 togetherNodes 颜色）' })
  runActorsSetupOnce: boolean = false;

  private _loadingDefault = false;

  private ensureDefaultSpriteFrame(cb?: () => void) {
    if (this.spriteFrame) {
      cb && cb();
      return;
    }
    if (this._loadingDefault) return;
    this._loadingDefault = true;
    // 尝试直接获取已加载的资产
    const cached = assetManager.assets.get(DEFAULT_SPRITE_UUID) as SpriteFrame | undefined;
    if (cached) {
      this.spriteFrame = cached;
      if (this.verbose) console.log('[SIJIWUYU_ReplaceLevelSprites] 使用缓存中的默认 SpriteFrame');
      cb && cb();
      return;
    }
    // 正确的加载签名：在 options 中传入 type
    assetManager.loadAny({ uuid: DEFAULT_SPRITE_UUID, type: SpriteFrame }, (err: Error | null, asset: SpriteFrame) => {
      this._loadingDefault = false;
      if (err || !asset) {
        if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 加载默认 SpriteFrame 失败:', err ? err.message : 'asset 为空');
        return;
      }
      this.spriteFrame = asset;
      if (this.verbose) console.log('[SIJIWUYU_ReplaceLevelSprites] 已自动加载默认 SpriteFrame');
      cb && cb();
    });
  }

  @property({ tooltip: '勾选后将执行一次替换操作，并自动恢复为未勾选' })
  runOnce: boolean = false;

  @property({ tooltip: '执行过程打印日志' })
  verbose: boolean = true;

  onEnable() {
    this.reorderGroupAndAdjustWhiteBackground();
  }

  private reorderGroupAndAdjustWhiteBackground(): void {
    const container = this.node.children.find(c => c.name === GROUP_CONTAINER_NAME) || null;
    if (!container) {
      if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 未找到分组容器:', GROUP_CONTAINER_NAME);
      return;
    }
    const findChild = (names: string[]) => container.children.find(c => names.includes(c.name)) || null;

    const white = findChild(['whitebackground', '白色背景']);
    const mask = findChild(['mask']);
    const background = findChild(['background', '背景']);
    const worker = findChild(['worker', 'work']);
    const ordered = [white, mask, background, worker].filter(Boolean) as Node[];

    ordered.forEach((n, i) => n.setSiblingIndex(i));

    if (white) {
      white.setPosition(0, 150, 0);
      const ui = white.getComponent(UITransform) || white.addComponent(UITransform);
      ui.width = 1000;
      ui.height = 1800;
    }

    if (this.verbose) console.log('[SIJIWUYU_ReplaceLevelSprites] 已调整 group 顺序和白色背景属性');
  }

  update() {
    if (this.runOnce) {
      // 1) 将第一级子节点归入新容器
      this.groupFirstLevelChildrenIntoContainer();

      // 2) 确保默认 SpriteFrame 后执行替换与对齐
      const run = () => {
        this.applyReplace();
        this.snapMarksNodes();
        this.runOnce = false;
      };
      this.ensureDefaultSpriteFrame(run);
    }

    // 新增：勾选一次性为小人替换骨骼动画
    if (this.runActorsSetupOnce) {
      this.setupActorsWithColorSkeletons();
      this.runActorsSetupOnce = false;
    }
  }

  // 在 togetherNodes 中寻找 Sprite 颜色
  private getSpriteColorFromTogetherNodes(mover: SIJIWUYU_MoveOnClick): Color | null {
    const nodes = mover.togetherNodes || [];
    for (const n of nodes) {
      if (!n) continue;
      const s = n.getComponent(Sprite);
      if (s && s.color) return s.color.clone();
      // 深度查找子节点的 Sprite
      const stack: Node[] = [...n.children];
      while (stack.length) {
        const cur = stack.pop()!;
        const ss = cur.getComponent(Sprite);
        if (ss && ss.color) return ss.color.clone();
        for (const c of cur.children) stack.push(c);
      }
    }
    return null;
  }

  // 使用简单规则将颜色分类到预设的九种颜色（优先精确匹配提供的编码）
  private classifyColor(c: Color): keyof typeof COLOR_SKELETON_UUID_MAP {
    // 先尝试匹配用户提供的精确颜色编码，允许少量容差
    const tol = 18; // 每个通道允许的偏差（0-255）
    for (const hex in EXACT_HEX_TO_COLOR_KEY) {
      const key = EXACT_HEX_TO_COLOR_KEY[hex];
      const rHex = parseInt(hex.slice(0, 2), 16);
      const gHex = parseInt(hex.slice(2, 4), 16);
      const bHex = parseInt(hex.slice(4, 6), 16);
      if (Math.abs(c.r - rHex) <= tol && Math.abs(c.g - gHex) <= tol && Math.abs(c.b - bHex) <= tol) {
        return key;
      }
    }

    // 若未命中精确映射，则回退到启发式分类
    const r = c.r, g = c.g, b = c.b;
    const bright = (r + g + b) / 3;

    // 明显主色
    if (r > g + 30 && r > b + 30) return 'red';
    if (g > r + 30 && g > b + 30) return 'green';
    if (b > r + 30 && b > g + 30) return 'blue';

    // 复合色
    if (r > 150 && g > 150 && b < 100) {
      return bright < 160 ? 'olive' : 'yellow';
    }
    if (g > 150 && b > 150 && r < 110) return 'cyan';
    if (r > 150 && b > 150 && g < 110) return 'purple';

    // 橙/棕通过亮度区分
    if (r > 170 && g > 110 && g < 190 && b < 90) return bright < 140 ? 'brown' : 'orange';

    // 兜底：按最大分量
    if (Math.max(r, g, b) === r) return bright < 140 ? 'brown' : 'orange';
    if (Math.max(r, g, b) === g) return bright < 160 ? 'olive' : 'yellow';
    return 'purple';
  }

  private loadSkeletonByUuid(uuid: string, cb: (data: sp.SkeletonData | null) => void) {
    const cached = assetManager.assets.get(uuid) as sp.SkeletonData | undefined;
    if (cached) {
      cb(cached);
      return;
    }
    assetManager.loadAny({ uuid, type: sp.SkeletonData }, (err: Error | null, asset: sp.SkeletonData) => {
      if (err || !asset) {
        if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 加载 SkeletonData 失败:', err?.message || 'asset 空');
        cb(null);
        return;
      }
      cb(asset);
    });
  }

  private setupActorsWithColorSkeletons(): number {
    const movers: SIJIWUYU_MoveOnClick[] = [];
    const stack: Node[] = [this.node];
    while (stack.length) {
      const n = stack.pop()!;
      const comp = n.getComponent(SIJIWUYU_MoveOnClick);
      if (comp) movers.push(comp);
      for (const c of n.children) stack.push(c);
    }

    let scheduled = 0;
    for (const m of movers) {
      const color = this.getSpriteColorFromTogetherNodes(m);
      if (!color) {
        if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 未在 togetherNodes 找到 Sprite 颜色:', m.node.name);
        continue;
      }
      const key = this.classifyColor(color);
      const uuid = COLOR_SKELETON_UUID_MAP[key];
      if (!uuid) {
        if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 未匹配到颜色 UUID:', key, m.node.name);
        continue;
      }

      // 删除 Sprite 组件，添加/获取 Skeleton 组件
      const sprite = m.node.getComponent(Sprite);
      if (sprite) {
        sprite.destroy();
      }
      // 在子节点上创建/复用骨骼组件，而不是绑在移动节点上
      const childName = 'SpineActor';
      let skeletonNode = m.node.children.find(c => c.name === childName) || null;
      if (!skeletonNode) {
        skeletonNode = new Node(childName);
        m.node.addChild(skeletonNode);
        skeletonNode.setPosition(0, 0, 0);
      }
      const skeleton = skeletonNode.getComponent(sp.Skeleton) || skeletonNode.addComponent(sp.Skeleton);

      this.loadSkeletonByUuid(uuid, (data) => {
        if (!data) return;
        skeleton.skeletonData = data;
        // 动画默认为 "idle"
        skeleton.animation = 'idle';
        if (this.verbose) console.log(`[SIJIWUYU_ReplaceLevelSprites] ${m.node.name} 颜色(${key}) 子节点骨骼已设置，uuid=${uuid}，默认动画=idle`);
      });
      scheduled++;
    }

    if (this.verbose) console.log(`[SIJIWUYU_ReplaceLevelSprites] 已计划替换 ${scheduled} 个移动小人骨骼动画`);
    return scheduled;
  }

  private findNodeByPath(root: Node, path: string): Node | null {
    const parts = path.split('/').filter(p => p.length > 0);
    let cur: Node | null = root;
    for (const p of parts) {
      if (!cur) return null;
      cur = cur.children.find(child => child.name === p) || null;
    }
    return cur;
  }

  private findNodeByName(root: Node, name: string): Node | null {
    const stack: Node[] = [root];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.name === name) return n;
      for (const c of n.children) stack.push(c);
    }
    return null;
  }

  private groupFirstLevelChildrenIntoContainer(): number {
    let container = this.node.children.find(c => c.name === GROUP_CONTAINER_NAME) || null;
    if (!container) {
      container = new Node(GROUP_CONTAINER_NAME);
      this.node.addChild(container);
    }

    const children = this.node.children.slice();
    let moved = 0;
    for (const child of children) {
      if (child === container) continue;
      // 重新挂载到容器，保持世界变换不变
      // @ts-ignore: 第二个参数为 keepWorldTransform，某些版本类型未声明
      child.setParent(container, true);
      moved++;
    }
    container.setPosition(0, -200, 0);
    if (this.verbose) console.log(`[SIJIWUYU_ReplaceLevelSprites] 已将第一级子节点归入 ${GROUP_CONTAINER_NAME}，移动 ${moved} 个。`);
    return moved;
  }

  private snap5(v: number): number { return Math.round(v / 5) * 5; }

  private snapMarksNodes(): number {
    const marks = this.findNodeByName(this.node, 'Marks');
    if (!marks) {
      if (this.verbose) console.warn('[SIJIWUYU_ReplaceLevelSprites] 未找到 Marks 节点');
      return 0;
    }
    let snapped = 0;
    const stack: Node[] = [...marks.children];
    const isTarget = (name: string) => /^Node(?:-\d+)?$/.test(name);
    while (stack.length) {
      const n = stack.pop()!;
      if (isTarget(n.name)) {
        const p = n.getPosition();
        n.setPosition(this.snap5(p.x), this.snap5(p.y), this.snap5(p.z));
        snapped++;
      }
      for (const c of n.children) stack.push(c);
    }
    if (this.verbose) console.log(`[SIJIWUYU_ReplaceLevelSprites] 已对齐 Marks 下节点 ${snapped} 个到 5 的倍数`);
    return snapped;
  }

  public applyReplace(): void {
    const scale = new Vec3(1.2, 1.2, 1);
    const rootName = this.node.name || '';
    const match = rootName.match(/(\d+)/);
    if (!match) {
      if (this.verbose) console.warn(`[SIJIWUYU_ReplaceLevelSprites] 根节点名称未包含数字: ${rootName}`);
      return;
    }
    const targetName = `${match[1]}${this.nameSuffix}`;

    let replacedCount = 0;
    let missingSpriteCount = 0;
    let foundCount = 0;

    const stack: Node[] = [this.node];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.name === targetName) {
        foundCount++;
        n.setScale(scale);
        const sprite = n.getComponent(Sprite);
        if (!sprite) {
          missingSpriteCount++;
          if (this.verbose) console.warn(`[SIJIWUYU_ReplaceLevelSprites] 无 Sprite 组件: ${n.name}`);
        } else if (!this.spriteFrame) {
          missingSpriteCount++;
          if (this.verbose) console.warn(`[SIJIWUYU_ReplaceLevelSprites] 替换时资源尚未就绪: ${n.name}`);
        } else {
          sprite.spriteFrame = this.spriteFrame;
          replacedCount++;
        }
      }
      for (const c of n.children) stack.push(c);
    }

    if (this.verbose) {
      console.log(`[SIJIWUYU_ReplaceLevelSprites] 完成。目标名 ${targetName}，找到 ${foundCount} 个；已替换 ${replacedCount}，缺少组件/资源 ${missingSpriteCount}。`);
    }
  }
}