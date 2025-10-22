import { _decorator, Component, Node, Vec3, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_MoveOnClick')
export class SIJIWUYU_MoveOnClick extends Component {
    @property(Node)
    targetNode: Node | null = null;

    @property
    speed: number = 300; // 移动速率，单位：单位/秒（UI中约为像素/秒）

    @property([Node])
    prerequisites: Node[] = []; // 该节点需要在这些节点之后被点击

    @property([Node])
    togetherNodes: Node[] = []; // 与自身一起移动的节点

    public isClicked: boolean = false; // 是否已被点击

    private _moving: boolean = false;
    private _targetWorld: Vec3 | null = null;

    /**
     * 供管理脚本调用的点击入口，也支持直接在其它地方调用
     */
    public onClicked(): void {
        if (this.isClicked) return;
        this.isClicked = true;
        this.startMove();
    }

    /**
     * 开始移动到目标点
     */
    public startMove(): void {
        if (!this.targetNode) return;
        this._targetWorld = this.targetNode.worldPosition.clone();
        this._moving = true;
    }

    /**
     * 停止移动
     */
    public stopMove(): void {
        this._moving = false;
    }

    update(dt: number) {
        if (!this._moving || !this._targetWorld) return;

        const current = this.node.worldPosition.clone();
        const toTarget = new Vec3(
            this._targetWorld.x - current.x,
            this._targetWorld.y - current.y,
            this._targetWorld.z - current.z,
        );
        const dist = toTarget.length();
        if (dist <= 0.5) { // 接近目标
            const delta = v3(
                this._targetWorld.x - current.x,
                this._targetWorld.y - current.y,
                this._targetWorld.z - current.z,
            );
            if (this.togetherNodes && this.togetherNodes.length > 0) {
                for (const n of this.togetherNodes) {
                    if (!n) continue;
                    const p = n.worldPosition.clone();
                    n.setWorldPosition(v3(p.x + delta.x, p.y + delta.y, p.z + delta.z));
                }
            }
            this.node.setWorldPosition(this._targetWorld);
            this._moving = false;
            this.node.emit('MoveOnClick:MoveComplete', this);
            return;
        }

        toTarget.normalize();
        const step = Math.min(this.speed * dt, dist);
        const delta = v3(toTarget.x * step, toTarget.y * step, toTarget.z * step);
        const next = v3(
            current.x + delta.x,
            current.y + delta.y,
            current.z + delta.z,
        );
        // 同步移动“一起移动”的节点
        if (this.togetherNodes && this.togetherNodes.length > 0) {
            for (const n of this.togetherNodes) {
                if (!n) continue;
                const p = n.worldPosition.clone();
                n.setWorldPosition(v3(p.x + delta.x, p.y + delta.y, p.z + delta.z));
            }
        }
        this.node.setWorldPosition(next);
    }

    /**
     * 重置点击状态（可用于重开一局）
     */
    public resetClick(): void {
        this.isClicked = false;
        this._moving = false;
        this._targetWorld = null;
    }
}