import { _decorator, Button, Component, Label, Node } from 'cc';
import { SIJIWUYU_GameManager } from './SIJIWUYU_GameManager';
import { SIJIWUYU_Aud } from './SIJIWUYU_Aud';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_UIPanel')
export class SIJIWUYU_UIPanel extends Component {
    @property(Label)
    levelLabel: Label = null;
    @property(Label)
    timer: Label = null;
    @property(Button)
    reClose: Button = null;
    @property(Button)
    reOneClose: Button = null;
    @property(Button)
    winNext: Button = null;
    @property(Node)
    win: Node = null;
    @property(Node)
    fail: Node = null;
    onLoad() {
        //赋值按钮
        this.onSetButton();
    }
    //苏醒
    onEnable() {
        if (SIJIWUYU_GameManager.instance.currId >= 50) {
            this.winNext.node.active = false;
        }
        else {
            this.winNext.node.active = true;
        }
    }
    //按钮赋值
    onSetButton() {
        let winRe = this.win.getChildByName("Re").getComponent(Button);
        let failRe = this.fail.getChildByName("Re").getComponent(Button);
        let failReOne = this.fail.getChildByName("ReOne").getComponent(Button);

        winRe.node.on(Button.EventType.CLICK, this.onRe, this);
        failRe.node.on(Button.EventType.CLICK, this.onRe, this);
        failReOne.node.on(Button.EventType.CLICK, this.onReOne, this);
        this.winNext.node.on(Button.EventType.CLICK, this.onNext, this);
        this.reClose.node.on(Button.EventType.CLICK, this.onRe, this);
        this.reOneClose.node.on(Button.EventType.CLICK, this.onReOne, this);
    }
    //下一关
    onNext() {
        let index = SIJIWUYU_GameManager.instance.currId + 1;
        for (let i = 0; i < SIJIWUYU_GameManager.instance.currId; i++) {
            if (SIJIWUYU_GameManager.instance.unLockLevel[i] == false) {
                index = i;
                break;
            }
        }
        SIJIWUYU_GameManager.instance.onLoadLevel(index);
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);

        this.onClose();
    }
    //上一关
    onPre() {
        SIJIWUYU_GameManager.instance.onLoadLevel(SIJIWUYU_GameManager.instance.currId - 1);
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
        this.onClose();
    }
    //重玩
    onReOne() {
        //直接加载此关
        SIJIWUYU_GameManager.instance.onLoadLevel(SIJIWUYU_GameManager.instance.currId);
        this.onClose();
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
    }
    //退出
    onRe() {
        //直接卸载
        SIJIWUYU_GameManager.instance.onUnLoadLevel();

        this.onClose();
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
    }
    //关闭WinFail
    onClose() {
        this.win.active = false;
        this.fail.active = false;
    }
}