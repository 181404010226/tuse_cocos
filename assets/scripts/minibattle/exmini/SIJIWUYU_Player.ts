import { _decorator, Component, Node, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_Player')
export class SIJIWUYU_Player extends Component {
    @property({ displayName: "背影", type: Node })
    bg: Node = null;
    @property({ displayName: "玩家", type: Node })
    player: Node = null;
    @property({ displayName: "名称", type: String })
    myName: string = "";

    onLoad() {
        this.myName = this.node.name;
        this.bg.active = true;
        this.player.active = false;
    }

    //匹配
    onMath(str: String): boolean {
        if (str == this.myName) {
            this.onRight();
            return true;
        }

        return false;
    }
    //正确
    onRight() {
        this.bg.active = false;
        this.player.active = true;
        //播放一下动画
        this.player.getComponent(Animation).play("showPlayer");
    }
}

