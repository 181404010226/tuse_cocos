import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, assetManager, UITransform } from 'cc';
const { ccclass, property, executeInEditMode, disallowMultiple, menu } = _decorator;

const DEFAULT_SPRITE_UUID = '01437c3e-ab48-49fb-9a83-06dc547724c0@f9941';
const GROUP_CONTAINER_NAME = 'SIJIWUYU_Group';

@ccclass('SIJIWUYU_ReplaceLevelSprites')
@executeInEditMode(true)
@disallowMultiple
export class SIJIWUYU_ReplaceLevelSprites extends Component {
  @property({ tooltip: '根据 prefab 名称中的数字匹配（如 level19 -> 19-2）' })
  nameSuffix: string = '-2';

  @property({ type: SpriteFrame, tooltip: '要替换成的 SpriteFrame 资源（统一替换），未设置则自动加载默认' })
  spriteFrame: SpriteFrame | null = null;

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
      ui.width = 750;
      ui.height = 1200;
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