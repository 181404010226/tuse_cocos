import { _decorator, Collider2D, Component, ERaycast2DType, EventTouch, Node, PhysicsSystem2D, randomRangeInt, Vec2 } from 'cc';
import { SIJIWUYU_GameManager } from './SIJIWUYU_GameManager';
import { SIJIWUYU_UIPanel } from './SIJIWUYU_UIPanel';
import { SIJIWUYU_Skirt } from './SIJIWUYU_Skirt';
import { SIJIWUYU_Player } from './SIJIWUYU_Player';
import { SIJIWUYU_Aud } from './SIJIWUYU_Aud';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_Level')
export class SIJIWUYU_Level extends Component {
    @property({ displayName: "正确数量", type: Number })
    maxNum: number = 0;
    @property({ displayName: "当前数量", type: Number })
    currNum: number = 0;
    @property({ displayName: "裙子父物体", type: Node })
    skirtParent: Node = null
    @property({ displayName: "玩家父物体", type: Node })
    playerParent: Node = null;
    @property({ displayName: "触摸点", type: Node })
    touchPos: Node = null;

    @property([Node])
    allSkirt: Node[] = [];
    @property([Node])
    allPlayer: Node[] = [];
    //当前的裙子
    @property(Node)
    currSkirt: Node = null;
    //是否结束
    @property(Boolean)
    isOver: boolean = false;
    //正在触摸
    @property(Boolean)
    isDrag: boolean = false;
    //当前时间
    @property
    currTimer: number = 90;

    onLoad() {
        //获取最大数量
        this.maxNum = this.skirtParent.children.length;
        this.GetAllItem();

        this.touchPos.on(Node.EventType.TOUCH_START, this.onBeginDrag, this);
        this.touchPos.on(Node.EventType.TOUCH_MOVE, this.onDrag, this);
        this.touchPos.on(Node.EventType.TOUCH_END, this.onEndDrag, this);

        //随机裙子层级
        this.onRandomSkirt();
    }
    onDisable() {

        if (this.touchPos == null) return;
        this.touchPos.off(Node.EventType.TOUCH_START, this.onBeginDrag, this);
        this.touchPos.off(Node.EventType.TOUCH_MOVE, this.onDrag, this);
        this.touchPos.off(Node.EventType.TOUCH_END, this.onEndDrag, this);
    }
    //更新秒数
    onUpdateTimer(deltaTime: number) {
        if (this.isOver) return;

        this.currTimer -= deltaTime;
        if (this.currTimer <= 0) {
            this.onFail();
        }
        SIJIWUYU_GameManager.instance.uiPanel.getComponent(SIJIWUYU_UIPanel).timer.string = Math.floor(this.currTimer).toString();
    }
    update(deltaTime: number) {
        this.onUpdateTimer(deltaTime);
    }
    //随机裙子层级
    onRandomSkirt() {
        let nums: number[] = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
        let currNum: number[]=[];
        while (nums.length > 0) {
            let index = randomRangeInt(0, nums.length);
            currNum.push(nums[index]);
            nums.splice(index, 1);
        }
        for (let i = 0; i < currNum.length; i++) {
            this.allSkirt[i].setSiblingIndex(currNum[i]);
        }
    }
    //获取所有物品
    GetAllItem() {
        //获取所有裙子
        for (let i = 0; i < this.skirtParent.children.length; i++) {
            this.allSkirt.push(this.skirtParent.children[i]);
        }
        for (let i = 0; i < this.playerParent.children.length; i++) {
            this.allPlayer.push(this.playerParent.children[i]);
        }
    }
    //数量增加
    onAddNum(amount: number) {

        if (this.isOver) return;

        this.currNum += amount;
        if (this.currNum >= this.maxNum) {
            this.onWin();
        }
    }
    //胜利
    onWin() {

        //关卡增加
        SIJIWUYU_GameManager.instance.onAddLevel(SIJIWUYU_GameManager.instance.currId+1);

        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.winAud);
        this.isOver = true;
        SIJIWUYU_GameManager.instance.uiPanel.getComponent(SIJIWUYU_UIPanel).win.active = true;
    }
    //失败
    onFail() {
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.failAud);
        this.isOver = true;
        SIJIWUYU_GameManager.instance.uiPanel.getComponent(SIJIWUYU_UIPanel).fail.active = true;
    }
    //开始触摸
    onBeginDrag(event: EventTouch) {
        if (this.isDrag) return;
        if (this.isOver) return;

        this.isDrag = true;

        //射线检测
        //获取触摸点
        const pos = event.getUILocation();

        this.currSkirt = this.onSeekSkirt(pos);
        if (this.currSkirt != null) {
            SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
        }
    }
    //触摸中
    onDrag(event: EventTouch) {
        if (this.isOver) return;
        if (this.currSkirt == null) return;
        let pos = event.getUILocation();
        this.currSkirt.setWorldPosition(pos.x,pos.y,0);
    }
    //结束触摸
    onEndDrag(event: EventTouch) {
        this.isDrag = false;
        if (this.currSkirt == null) return;
        //获取玩家
        let player = this.onSeekPlayer(event.getUILocation());
        if (player != null) {
            //检测是否相同
            if (player.getComponent(SIJIWUYU_Player).onMath(this.currSkirt.getChildByName("Icon").getComponent(SIJIWUYU_Skirt).myName)) {
                //增加胜利数量
                this.onAddNum(1);
                this.currSkirt.active = false;
                SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.rightAud);
            }
        }
        this.currSkirt = null;
    }
    //进行查看最上层的裙子
    onSeekSkirt(pos: Vec2): Node {
        let clickItem: Node[] = [];
        //找到点击的裙子
        for (let i = 0; i < this.allSkirt.length; i++) {
            const sPos = this.allSkirt[i].getWorldPosition();
            const index = 50;
            if (this.allSkirt[i].active == false) continue;
            if (pos.x < sPos.x + index && pos.x > sPos.x - index && pos.y > sPos.y - index && pos.y < sPos.y + index) {
                clickItem.push(this.allSkirt[i]);
            }
        }
        if (clickItem == null) return null;
        //找到点击里面最上层的裙子
        let maxSkirt: Node = null;
        for (let i = 0; i < clickItem.length; i++) {
            if (maxSkirt == null) maxSkirt = clickItem[i];
            else {
                if (maxSkirt.getSiblingIndex() < clickItem[i].getSiblingIndex()) {
                    maxSkirt = clickItem[i];
                }
            }
        }
        if (maxSkirt == null) return null;
        //将此裙子设置为最上层裙子
        maxSkirt.setSiblingIndex(this.allSkirt.length - 1);

        return maxSkirt;
    }
    //进行查看是否点击到玩家、
    onSeekPlayer(pos: Vec2): Node {
        let player: Node = null;
        for (let i = 0; i < this.allPlayer.length; i++) {
            let sPos = this.allPlayer[i].getWorldPosition();
            const index = 50;
            if (pos.x < sPos.x + index && pos.x > sPos.x - index && pos.y > sPos.y - index && pos.y < sPos.y + index) {
                player = this.allPlayer[i];
                break;
            }
        }

        return player;
    }
}

