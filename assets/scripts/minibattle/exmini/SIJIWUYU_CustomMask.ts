import { _decorator, Component, Node, Graphics, UITransform, Vec3, Vec2, Mask, Color, Sprite } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * 自定义遮罩组件
 * 通过节点数组按顺序构成闭合图形，只在该区域内显示遮罩下的图片
 */
@ccclass('SIJIWUYU_CustomMask')
@executeInEditMode
export class SIJIWUYU_CustomMask extends Component {
    
    @property({
        type: [Node],
        tooltip: '构成遮罩形状的节点数组，按顺序连接形成闭合图形'
    })
    public maskNodes: Node[] = [];
    
    @property({
        tooltip: '是否自动更新遮罩（当节点位置改变时）'
    })
    public autoUpdate: boolean = true;

    @property({
        tooltip: '在编辑器中显示预览（多边形描边）'
    })
    public previewEnabled: boolean = true;

    @property({
        tooltip: '预览线颜色'
    })
    public previewColor: Color = new Color(0, 255, 0, 255);

    @property({
        tooltip: '预览线宽'
    })
    public previewLineWidth: number = 20;

    @property({
        tooltip: '删除预览（设为 true 时执行一次）'
    })
    public deletePreviewOnce: boolean = false;
    
    private _graphics: Graphics = null;
    private _mask: Mask = null;
    private _lastPositions: Vec3[] = [];
    
    private _previewGraphics: Graphics = null;
    private _previewNode: Node = null;
    
    onLoad() {
        this.initMask();
    }
    
    start() {
        this.updateMask();
        
        if (this.autoUpdate) {
            // 记录初始位置
            this.recordNodePositions();
        }
    }
    
    update() {
        if (this.autoUpdate && this.hasNodePositionChanged()) {
            this.updateMask();
            this.recordNodePositions();
        } else if (EDITOR) {
            // 一次性删除预览
            if (this.deletePreviewOnce) {
                this.deletePreview();
                this.deletePreviewOnce = false;
            }
            // 预览显示/隐藏
            if (this.previewEnabled) {
                this.updatePreviewRectFromNodes();
            } else if (this._previewGraphics) {
                this._previewGraphics.clear();
            }
        }
    }
    
    /**
     * 初始化遮罩组件
     */
    private initMask(): void {
        // 添加Graphics组件用于绘制遮罩形状
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        // 添加Mask组件
        this._mask = this.node.getComponent(Mask);
        if (!this._mask) {
            this._mask = this.node.addComponent(Mask);
        }
        
        // 设置遮罩类型为Graphics
        this._mask.type = Mask.Type.GRAPHICS_STENCIL;

        // 编辑器预览节点
        this.ensurePreviewGraphics();
    }
    
    /**
     * 更新遮罩形状
     */
    public updateMask(): void {
        if (!this.isNodesValid()) {
            console.warn('CustomMask: 遮罩节点数组为空或包含无效节点');
            // 清理预览
            if (this._previewGraphics) {
                this._previewGraphics.clear();
            }
            return;
        }
        
        // 获取所有节点的世界坐标
        const positions = this.getNodeWorldPositions();
        
        // 转换为本地坐标
        const localPositions = this.convertToLocalPositions(positions);
        
        // 绘制遮罩形状
        this.drawMaskShape(localPositions);

        // 绘制编辑器预览矩形
        this.updatePreviewRect(localPositions);
    }
    
    /**
     * 检查所有节点是否有效
     */
    private isNodesValid(): boolean {
        if (!this.maskNodes || this.maskNodes.length < 3) {
            return false;
        }
        
        // 检查数组中是否有无效节点
        for (const node of this.maskNodes) {
            if (!node || !node.isValid) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 获取所有节点的世界坐标
     */
    private getNodeWorldPositions(): Vec3[] {
        const positions: Vec3[] = [];
        
        for (const node of this.maskNodes) {
            if (node && node.isValid) {
                positions.push(node.worldPosition.clone());
            }
        }
        
        return positions;
    }
    
    /**
     * 将世界坐标转换为本地坐标
     */
    private convertToLocalPositions(worldPositions: Vec3[]): Vec2[] {
        const localPositions: Vec2[] = [];
        const transform = this.node.getComponent(UITransform);
        
        for (const worldPos of worldPositions) {
            const localPos = new Vec3();
            transform.convertToNodeSpaceAR(worldPos, localPos);
            localPositions.push(new Vec2(localPos.x, localPos.y));
        }
        
        return localPositions;
    }
    
    /**
     * 绘制遮罩形状
     */
    private drawMaskShape(positions: Vec2[]): void {
        if (positions.length < 3) {
            console.warn('CustomMask: 至少需要3个点才能构成闭合图形');
            return;
        }
        
        // 清除之前的绘制
        this._graphics.clear();
        
        // 按节点数组顺序绘制闭合路径
        this._graphics.moveTo(positions[0].x, positions[0].y);
        
        for (let i = 1; i < positions.length; i++) {
            this._graphics.lineTo(positions[i].x, positions[i].y);
        }
        
        // 闭合路径
        this._graphics.close();
        
        // 填充遮罩区域
        this._graphics.fill();
    }
    
    /**
     * 记录节点位置
     */
    private recordNodePositions(): void {
        this._lastPositions = this.getNodeWorldPositions();
    }
    
    /**
     * 检查节点位置是否发生变化
     */
    private hasNodePositionChanged(): boolean {
        if (this._lastPositions.length === 0) {
            return true;
        }
        
        const currentPositions = this.getNodeWorldPositions();
        
        for (let i = 0; i < currentPositions.length; i++) {
            if (!currentPositions[i].equals(this._lastPositions[i])) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 手动刷新遮罩
     */
    public refreshMask(): void {
        this.updateMask();
    }
    
    /**
     * 设置遮罩节点数组
     */
    public setMaskNodes(nodes: Node[]): void {
        this.maskNodes = nodes || [];
        this.updateMask();
    }
    
    /**
     * 添加遮罩节点
     */
    public addMaskNode(node: Node): void {
        if (node && node.isValid) {
            this.maskNodes.push(node);
            this.updateMask();
        }
    }
    
    /**
     * 移除遮罩节点
     */
    public removeMaskNode(node: Node): void {
        const index = this.maskNodes.indexOf(node);
        if (index >= 0) {
            this.maskNodes.splice(index, 1);
            this.updateMask();
        }
    }
    
    /**
     * 清空所有遮罩节点
     */
    public clearMaskNodes(): void {
        this.maskNodes = [];
        this._graphics.clear();
        if (this._previewGraphics) {
            this._previewGraphics.clear();
        }
    }

    /**
     * 确保预览 Graphics 存在
     * 解决脚本重新编译时重复创建预览节点的问题：
     * 如果当前节点已有同名子节点，则复用而不再创建。
     */
    private ensurePreviewGraphics(): void {
        if (!EDITOR) return;
        // 若已缓存并有效，直接使用
        if (this._previewGraphics && this._previewGraphics.isValid) return;

        // 先尝试在子节点中查找同名预览节点，避免重复创建
        if (!this._previewNode || !this._previewNode.isValid) {
            const existing = this.node.getChildByName('__CustomMask_Preview__');
            if (existing && existing.isValid) {
                this._previewNode = existing;
            }
        }

        // 若不存在同名子节点，则创建一次
        if (!this._previewNode || !this._previewNode.isValid) {
            this._previewNode = new Node('__CustomMask_Preview__');
            this._previewNode.parent = this.node;
        }

        // 绑定/获取 Graphics 组件
        this._previewGraphics = this._previewNode.getComponent(Graphics);
        if (!this._previewGraphics) {
            this._previewGraphics = this._previewNode.addComponent(Graphics);
        }
        // 同步样式
        this._previewGraphics.lineWidth = this.previewLineWidth;
        this._previewGraphics.strokeColor = this.previewColor;
    }

    /**
     * 从当前节点集合刷新预览矩形
     */
    private updatePreviewRectFromNodes(): void {
        if (!this.isNodesValid()) {
            if (this._previewGraphics) this._previewGraphics.clear();
            return;
        }
        
        // 自动重命名子节点中的图片节点
        this.renameChildImageNodes();
        
        const positions = this.getNodeWorldPositions();
        const localPositions = this.convertToLocalPositions(positions);
        this.updatePreviewRect(localPositions);
    }

    /**
     * 根据局部坐标点集绘制预览包围矩形
     */
    private updatePreviewRect(positions: Vec2[]): void {
        if (!EDITOR || !this.previewEnabled) return;
        this.ensurePreviewGraphics();
        if (!this._previewGraphics) return;

        this._previewGraphics.clear();
        if (!positions || positions.length < 2) return;

        // 绘制多边形描边（按节点顺序连接并闭合）
        this._previewGraphics.lineWidth = this.previewLineWidth;
        this._previewGraphics.strokeColor = this.previewColor;

        this._previewGraphics.moveTo(positions[0].x, positions[0].y);
        for (let i = 1; i < positions.length; i++) {
            this._previewGraphics.lineTo(positions[i].x, positions[i].y);
        }
        this._previewGraphics.close();
        this._previewGraphics.stroke();
    }

    /**
     * 删除预览节点与绘制
     */
    private deletePreview(): void {
        if (this._previewGraphics) {
            this._previewGraphics.clear();
            this._previewGraphics.destroy();
            this._previewGraphics = null;
        }
        if (this._previewNode) {
            this._previewNode.destroy();
            this._previewNode = null;
        }
    }

    /**
     * 查找子节点中的图片节点并重命名
     */
    private renameChildImageNodes(): void {
        // 遍历所有子节点
        for (let i = 0; i < this.node.children.length; i++) {
            const child = this.node.children[i];
            // 检查子节点是否有Sprite组件
            const sprite = child.getComponent(Sprite);
            if (sprite) {
                // 将图片节点重命名为与自身节点名称一致
                child.name = this.node.name;
            }
        }
    }
}