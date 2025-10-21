import { _decorator, AudioClip, Button, Component, Node, randomRangeInt, UIOpacity, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DlgBasicComponent')
export class DlgBasicComponent extends Component {

    /*
    关于弹框的一些想法及要实现的有些未实现的，但是至少目前这些在顶层使用者是不用考虑的，只要在有需求的时候，底层
    加入即可，不影响顶层的coding。
    1.弹框分为两类对话框
        一类是主动型弹框，也就是会自己知道自己要什么数据的，自己去取的。这类型的弹框不需要传参数，自己带主脑的；
        一类是被动型弹框，也就是自己只是个壳子，不知道自己要什么数据的，需要别人传过来才知道的，自己没有主脑的；

    2.为了防止其他的非法调用（比如疯狂点击按钮没有屏蔽），在弹框管理类里面，默认一类型的弹框只有一个，如果检测
    到已经存在了此类的弹框，将直接不再弹框，后续如果检测到，会把这个弹框的层级调到最前面；如果想创建多个，比如
    被动型弹框，直接组DlgMulti即可，检测到有这个组件就会通过多个弹框的检测。
    3.后续会做一个类似队列，队列里面的弹框，只有关闭了一个才会打开另外一个；
    4.后续会做一个参数，关闭是否要打开上一个弹框。
    */

    protected _closeBtn: Node | null = null;

    public tid: string;
    public nextTid: string;

    public bgmName: string = null;
    public bgmMapName: string = null;
    public openSoundEffect: string = null;
    public closeSoundEffect: string = null;
    private preBgm: AudioClip = null;
    private preBgmName: string = null;
    private need: string[] = null;
    public isLoadAllRes: boolean = false;   //是否加载这个弹框所属所有资源，一般活动不加，一般弹框加
    node: any;
    onLoad() {
        this.loadCloseBtn();
        this.openSoundEffect = 'general_openUI';
        this.nextTid = null;

    }

    isUseBg() {
        return true;
    }

    protected loadCloseBtn() {
        this._closeBtn = this.node.getChildByName('closeBtn');
    }

    hide(tweenType: number = -2): void {

    }

    show(data: any = null): void {

    }
    //弹窗动画完成（生命周期晚于show）
    public showTweenFinish() {

    }

    //点击背景是否需要有响应
    public bgClickHandler() {

    }

    public setCurrencyNeed(data: Array<string>): void {

    }

    public checkNeed(): void {
        this.setCurrencyNeed(this.need);
    }

    protected onDestroy(): void {


    }


    public adaptBg(dlgbg: Node): void {

    }

    public showPadLines(): void {

    }
}

