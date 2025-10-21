import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_Skirt')
export class SIJIWUYU_Skirt extends Component {
    @property({ displayName: "名称", type: String})
    myName: string = "";

    onLoad() {
        this.myName = this.node.parent.name;
    }
}

