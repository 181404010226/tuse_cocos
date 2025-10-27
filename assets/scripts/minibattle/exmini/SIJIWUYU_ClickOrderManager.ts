import { _decorator, Component, Node } from 'cc';
import { SIJIWUYU_GameManager } from './SIJIWUYU_GameManager';
import { SIJIWUYU_MoveOnClick } from './SIJIWUYU_MoveOnClick';
const { ccclass, property } = _decorator;

// 通过 toggle 控制是否必须等待前一个填色完成（代码写死）
const ENFORCE_WAIT_PREVIOUS_COMPLETE = true;

@ccclass('SIJIWUYU_ClickOrderManager')
export class SIJIWUYU_ClickOrderManager extends Component {
    @property([SIJIWUYU_MoveOnClick])
    moveItems: SIJIWUYU_MoveOnClick[] = [];

    @property
    autoCollectOnStart: boolean = true; // 启动时自动收集场景中的 MoveOnClick 组件

    @property(Node)
    collectRoot: Node | null = null; // 自动收集的根节点，若为空则使用当前组件节点


    @property({ displayName: '点击顺序', tooltip: '按点击顺序显示', readonly: true, serializable: false })
    clickOrderReadonly: string = '';

    private _clickedOrder: SIJIWUYU_MoveOnClick[] = [];
    private _callbacks = new Map<SIJIWUYU_MoveOnClick, (ev?: any) => void>();
    private _evaluated: boolean = false;
    private _layerOrderMap = new Map<Node, Node[]>(); // grandparent -> ordered parent layers
    private _moveCompleteCallbacks = new Map<SIJIWUYU_MoveOnClick, (ev?: any) => void>();
    private _moveCompleteSet = new Set<SIJIWUYU_MoveOnClick>();
    private _pendingResult: boolean | null = null;
    private _allClicked: boolean = false;

    start() {
        if (this.autoCollectOnStart && this.moveItems.length === 0) {
            const root = this.collectRoot ?? this.node;
            this.moveItems = root.getComponentsInChildren(SIJIWUYU_MoveOnClick);
        }
        this.bindEvents();
    }

    private bindEvents() {
        for (const move of this.moveItems) {
            const clickCb = () => this.onNodeClick(move);
            move.node.on(Node.EventType.TOUCH_END, clickCb, this);
            this._callbacks.set(move, clickCb);

            const completeCb = () => this.onMoveComplete(move);
            move.node.on('MoveOnClick:MoveComplete', completeCb, this);
            this._moveCompleteCallbacks.set(move, completeCb);
        }
    }

    private unbindEvents() {
        for (const [move, cb] of this._callbacks) {
            move.node.off(Node.EventType.TOUCH_END, cb, this);
        }
        this._callbacks.clear();

        for (const [move, cb] of this._moveCompleteCallbacks) {
            move.node.off('MoveOnClick:MoveComplete', cb, this);
        }
        this._moveCompleteCallbacks.clear();
    }

    private onNodeClick(move: SIJIWUYU_MoveOnClick) {
        if (this._evaluated) return; // 已评估则忽略
        if (move.isClicked) return;  // 防重复

        // 必须等待前一个小人填色完成后才能开始下一个（按点击顺序）
        if (ENFORCE_WAIT_PREVIOUS_COMPLETE) {
            if (this._clickedOrder.length > 0) {
                const last = this._clickedOrder[this._clickedOrder.length - 1];
                if (!this._moveCompleteSet.has(last)) {
                    return; // 前一个未完成，直接忽略本次点击
                }
            }
        }

        move.onClicked();
        this._clickedOrder.push(move);
        this.reorderTogetherNodesByClick(move);
        this.updateClickOrderReadonly();

        if (this._clickedOrder.length === this.moveItems.length) {
            this._allClicked = true;
            const ok = this.evaluateOrder();
            this._pendingResult = ok;
            if (this._moveCompleteSet.size === this.moveItems.length) {
                SIJIWUYU_GameManager.instance?.onShowResult(ok);
                this._evaluated = true;
                this.unbindEvents();
            }
        }
    }

    private reorderTogetherNodesByClick(move: SIJIWUYU_MoveOnClick) {
        // 目标：调整 togetherNodes 的“父节点”的图层顺序，
        // 保持“先点击的图层在最前面（更大的 siblingIndex）”
        const parentsByGrand = new Map<Node, Node[]>();
        for (const n of move.togetherNodes) {
            if (!n || !n.parent || !n.parent.parent) continue;
            const parent = n.parent;
            const grand = parent.parent;
            let list = parentsByGrand.get(grand);
            if (!list) {
                list = [];
                parentsByGrand.set(grand, list);
            }
            if (!list.includes(parent)) {
                list.push(parent);
            }
        }

        for (const [grand, newParents] of parentsByGrand) {
            let order = this._layerOrderMap.get(grand);
            if (!order) {
                order = [];
                this._layerOrderMap.set(grand, order);
            }
            for (const p of newParents) {
                if (!order.includes(p)) {
                    order.push(p); // 记录点击顺序
                }
            }
            // 依据点击顺序设置 siblingIndex：先点击的更靠前
            const top = grand.children.length - 1;
            for (let i = 0; i < order.length; i++) {
                order[i].setSiblingIndex(top);
            }
        }
    }

    private onMoveComplete(move: SIJIWUYU_MoveOnClick) {
        if (this._evaluated) return;
        this._moveCompleteSet.add(move);
        if (this._allClicked && this._moveCompleteSet.size === this.moveItems.length) {
            const ok = this._pendingResult ?? this.evaluateOrder();
            this._pendingResult = ok;
            SIJIWUYU_GameManager.instance?.onShowResult(ok);
            this._evaluated = true;
            this.unbindEvents();
        }
    }

    private evaluateOrder(): boolean {
        const indexMap = new Map<Node, number>();
        for (let i = 0; i < this._clickedOrder.length; i++) {
            indexMap.set(this._clickedOrder[i].node, i);
        }

        for (const move of this.moveItems) {
            const myIndex = indexMap.get(move.node);
            if (myIndex === undefined) return false; // 有未点击的节点
            for (const pre of move.prerequisites) {
                const preIndex = indexMap.get(pre);
                if (preIndex === undefined) return false; // 前置未点击
                if (preIndex >= myIndex) return false;    // 前置未在当前之前
            }
        }
        return true;
    }

    private updateClickOrderReadonly(): void {
        this.clickOrderReadonly = this._clickedOrder.map(m => m.node.name).join(' -> ');
    }

    /**
     * 重置一局：清除结果、重置点击状态并重新绑定事件
     */
    public resetAll(): void {
        this._evaluated = false;
        this._clickedOrder.length = 0;
        this._layerOrderMap.clear();
        this._moveCompleteSet.clear();
        this._moveCompleteCallbacks.clear();
        this._pendingResult = null;
        this._allClicked = false;
        this.clickOrderReadonly = '';
        SIJIWUYU_GameManager.instance?.onResetResult();
        for (const move of this.moveItems) {
            move.resetClick();
        }
        this.unbindEvents();
        this.bindEvents();
    }
}