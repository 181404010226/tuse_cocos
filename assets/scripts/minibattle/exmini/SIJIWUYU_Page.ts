import { _decorator, Component, Label, Node, PageView } from 'cc';
import { SIJIWUYU_Aud } from './SIJIWUYU_Aud';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_Page')
export class SIJIWUYU_Page extends Component {
    @property({ displayName: "page", type: PageView })
    page: PageView = null;
    @property([Label])
    currText: Label = null;
    @property([Label])
    maxText: Label = null;
    @property({ displayName: "所有Page", type: [Node] })
    allPage: Node[] = [];

    currNum: number = 0;

    start() {
        //起始更新UI
        this.onUpdateIndex();
    }
    update(deltaTime: number) {
        if (this.currNum != this.page.getCurrentPageIndex()) {
            this.onUpdateIndex();
        }
    }

    //下一页
    onNextPage() {
        //获取索引
        if (this.currNum >= (Number)(this.maxText.string)) return;

        //设置
        this.page.scrollToPage(this.currNum + 1, 0.3);
        this.currNum += 1;
        this.onUpdateIndex();
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
    }
    //上一页
    onPrePage() {
        //获取索引
        if (this.currNum <= 0) return;

        //设置
        this.page.scrollToPage(this.currNum - 1,0.3);
        this.currNum -= 1;
        this.onUpdateIndex();
        SIJIWUYU_Aud.instance.onPlayAud(SIJIWUYU_Aud.instance.clickAud);
    }
    //更新索引
    onUpdateIndex() {
        this.maxText.string = this.page.content.children.length.toString();
        this.currNum = this.page.getCurrentPageIndex();
        this.currText.string = (this.currNum + 1).toString();

        this.HideUI();
    }
    //影藏UI
    HideUI() {
        if (this.currNum == 0) {
            //打开两页
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < this.allPage[i].children.length; j++) {
                    if (i == 0 || i == 1) {
                        this.allPage[i].children[j].active = true;
                    }
                    else {
                        this.allPage[i].children[j].active = false;
                    }
                }
            }
        }
        else if (this.currNum == 8) {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < this.allPage[i].children.length; j++) {
                    if (i == 8 || i == 7) {
                        this.allPage[i].children[j].active = true;
                    }
                    else {
                        this.allPage[i].children[j].active = false;
                    }
                }
            }
        }
        else {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < this.allPage[i].children.length; j++) {
                    if (i == this.currNum - 1 || i == this.currNum + 1 || i==this.currNum) {
                        this.allPage[i].children[j].active = true;
                    }
                    else {
                        this.allPage[i].children[j].active = false;
                    }
                }
            }
        }
    }
}

