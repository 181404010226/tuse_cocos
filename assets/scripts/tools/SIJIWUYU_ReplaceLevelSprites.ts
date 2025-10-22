import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, assetManager } from 'cc';
const { ccclass, property, executeInEditMode, disallowMultiple, menu } = _decorator;

const DEFAULT_SPRITE_UUID = '01437c3e-ab48-49fb-9a83-06dc547724c0@f9941';

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

  update() {
    if (this.runOnce) {
      const run = () => {
        this.applyReplace();
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