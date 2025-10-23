import { _decorator, Button, Component, instantiate, Label, Node, Prefab, sys, Sprite, SpriteFrame } from 'cc';
import { SIJIWUYU_Aud } from './SIJIWUYU_Aud';
import { SIJIWUYU_UIPanel } from './SIJIWUYU_UIPanel';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_GameManager')
export class SIJIWUYU_GameManager extends Component {
    static instance: SIJIWUYU_GameManager;

    @property({ displayName: "解锁的数据", type: [Boolean] })
    unLockLevel: boolean[] = [];
    @property({ displayName: "当前关卡id" })
    currId: number = 1;
    @property({ displayName: "当前关卡", type: Node })
    currLevelObj: Node = null;
    @property({ displayName: "所有按钮", type: [Node] })
    allLevelBu: Node[] = [];
    @property({ displayName: "广告", type: Node })
    adPanel: Node = null;
    @property({ displayName: "关卡预制体", type:[Prefab]})
    levels: Prefab[] = [];
    @property({ displayName: "关卡图标", type: [SpriteFrame] })
    levelIcons: SpriteFrame[] = [];
    @property({ displayName: "UIPanel", type: Node })
    uiPanel: Node = null;
    @property({ displayName: "关卡父物体", type: Node })
    lvParent: Node = null;

    onLoad() {
        SIJIWUYU_GameManager.instance = this;

        //加载数据
        this.onLoadData();
        //按钮赋值
        this.onSetAllLevelBut();
        //更新数据
        this.onCheckLock();
    }
    //赋值所有按钮
    onSetAllLevelBut() {
        for (let i = 0; i < this.allLevelBu.length; i++) {
            this.allLevelBu[i].name = (i + 1).toString();
            this.allLevelBu[i].getChildByName("Name").getComponent(Label).string = "第 " + (i + 1).toString() +" 关"
            const iconNode = this.allLevelBu[i].getChildByName("Bg")?.getChildByName("Mask")?.getChildByName("Icon");
            if (iconNode) {
                const sp = iconNode.getComponent(Sprite);
                if (sp && this.levelIcons && this.levelIcons[i]) {
                    sp.spriteFrame = this.levelIcons[i];
                }
            }
            this.allLevelBu[i].on(Button.EventType.CLICK, () => { this.onLoadLevel((Number)(this.allLevelBu[i].name)); }, this);
        }
    }
    //解锁关卡
    onUnLockLevel(id: number) {
        if (id > 50) id = 50;
        this.unLockLevel[id - 1] = true;
        //更新数据
        this.onCheckLock();
        //保存数据
        this.onSaveData();
    }
    //关卡增加
    onAddLevel(_id: number) {
        let id = _id;
        for (let i = 0; i < _id; i++) {
            if (this.unLockLevel[i] == false) {
                id = i + 1;
                break;
            }
        }
        if (id == _id) {
            this.onUnLockLevel(id);
        }
    }
    //加载关卡
    onLoadLevel(id: number) {
        //卸载关卡
        this.onUnLoadLevel();
        //此时点击的关卡
        this.currId = id;
        this.uiPanel.getComponent(SIJIWUYU_UIPanel).onClose();
        //如果关卡没有解锁
        if (!this.unLockLevel[id - 1]) {
            //打开广告面板
            this.adPanel.active = true;
            SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
            return;
        }

        //加载
        this.currLevelObj = instantiate(this.levels[id - 1]);
        this.currLevelObj.parent = this.lvParent;
        this.currLevelObj.setPosition(0, 0, 0);

        //打开UI
        this.onOpenUI();
        SIJIWUYU_Aud.instance.onPlayBgm(SIJIWUYU_Aud.instance.gameAud);
    }
    //卸载关卡
    onUnLoadLevel() {
        if (this.currLevelObj != null) {
            this.currLevelObj.destroy();
            this.currLevelObj = null;
            //关闭UI
            this.onCloseUI();
            SIJIWUYU_Aud.instance.onPlayBgm(SIJIWUYU_Aud.instance.mainAud);
        }
    }
    //关闭广告面板
    onCloseAdPanel() {
        this.adPanel.active = false;
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
    }
    //更新锁
    onCheckLock() {
        for (let i = 0; i < this.allLevelBu.length; i++) {
            if (this.unLockLevel[i]) {
                this.allLevelBu[i].getChildByName("Lock").active = false;
            }
            else {
                this.allLevelBu[i].getChildByName("Lock").active = true;
            }
        }
    }
    //广告解锁
    onAdUnLock() {

        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);

        if (this.onShowAd()) {
            this.onUnLockLevel(this.currId);
            this.onCheckLock();
            this.onCloseAdPanel();
        }
    }
    //观看广告
    onShowAd() :boolean{

        //测试返回true
        return true;
    }
    //打开UI
    onOpenUI() {
        this.uiPanel.active = true;
        //赋值关卡
        this.uiPanel.getComponent(SIJIWUYU_UIPanel).levelLabel.string = "第 " + this.currId + " 关";
    }
    //关闭UI
    onCloseUI() {
        this.uiPanel.active = false;
    }
    //保存数据
    onSaveData() {
        let str = JSON.stringify(this.unLockLevel);
        sys.localStorage.setItem("SIJIWUYU_", str);
    }
    //获取数据
    onLoadData() {
        let data = sys.localStorage.getItem("SIJIWUYU_");
        if (data == null || data == "") {
            this.unLockLevel = new Array(50).fill(false);
            this.unLockLevel[0] = true;
        }
        else {
            this.unLockLevel = JSON.parse(data) as boolean[];
        }
    }
}