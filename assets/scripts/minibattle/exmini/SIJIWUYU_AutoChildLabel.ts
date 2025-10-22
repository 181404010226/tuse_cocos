import { _decorator, Component, Node, Label, UITransform, Color } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('SIJIWUYU_AutoChildLabel')
@executeInEditMode
export class SIJIWUYU_AutoChildLabel extends Component {
    @property({ tooltip: 'Label 字体大小' })
    public fontSize: number = 20;

    @property({ tooltip: '是否递归遍历所有子孙节点' })
    public recursive: boolean = false;
    
    @property({ tooltip: 'Label 字体颜色' })
    public fontColor: Color = new Color(255, 255, 255, 255);

    @property({ tooltip: '仅在编辑器模式下添加/更新 Label' })
    public editorModeOnly: boolean = true;

    @property({ tooltip: '显示所有子节点的 Label（关闭则仅禁用）' })
    public showLabels: boolean = true;

    @property({ tooltip: '删除所有子节点的 Label（设为 true 时执行一次）' })
    public deleteAllLabels: boolean = false;

    onLoad() {
        // 运行时（非编辑器）禁用已存在的 Label，以免影响正式表现
        if (!EDITOR && this.editorModeOnly) {
            const targets = this.collectTargets();
            for (const node of targets) {
                const label = node.getComponent(Label);
                if (label) label.enabled = false;
            }
        }
    }

    onEnable() {
        if (EDITOR || !this.editorModeOnly) {
            this.applyLabels();
        }
    }

    update() {
        if (EDITOR || !this.editorModeOnly) {
            this.applyLabels();
            if (EDITOR && this.deleteAllLabels) {
                this.removeAllChildLabels();
                this.deleteAllLabels = false;
            }
        }
    }
    
    private applyLabels(): void {
        const targets = this.collectTargets();
        for (const node of targets) {
            let label = node.getComponent(Label);
            if (this.showLabels) {
                if (!label) {
                    label = node.addComponent(Label);
                    // 确保有 UITransform 以便正确渲染与布局
                    if (!node.getComponent(UITransform)) {
                        node.addComponent(UITransform);
                    }
                }
                // 更新文字为节点名
                if (label.string !== node.name) {
                    label.string = node.name;
                }
                // 更新字体大小（顺带调整行高与颜色）
                if (label.fontSize !== this.fontSize) {
                    label.fontSize = this.fontSize;
                    label.lineHeight = Math.ceil(this.fontSize * 1.2);
                }
                label.color = this.fontColor;
                label.enabled = true;
            } else {
                if (label) {
                    label.enabled = false;
                }
            }
        }
    }

    private removeAllChildLabels(): void {
        const targets = this.collectTargets();
        for (const node of targets) {
            const label = node.getComponent(Label);
            if (label) {
                label.destroy();
            }
        }
    }

    private collectTargets(): Node[] {
        const result: Node[] = [];
        if (!this.node) return result;
        if (this.recursive) {
            this.walk(this.node, result);
            // 不对根节点自身添加 Label，仅对子节点生效
            if (result.length > 0 && result[0] === this.node) {
                result.shift();
            }
        } else {
            for (const c of this.node.children) {
                result.push(c);
            }
        }
        return result;
    }
    
    private walk(n: Node, out: Node[]): void {
        out.push(n);
        for (const c of n.children) {
            this.walk(c, out);
        }
    }
}