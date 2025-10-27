import { _decorator, Component, input, Input, KeyCode, game, EventKeyboard, director, Director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_ScreenshotOnW')
export class SIJIWUYU_ScreenshotOnW extends Component {
    @property
    saveDir: string = 'd:\\CocosProject\\fenqunzi_cocos\\SIJIWUYU_cocos\\assets\\exminiassets\\tex\\tips';
    @property({ tooltip: '裁剪宽度（像素），<=0 表示整屏' })
    cropWidth: number = 0;
    @property({ tooltip: '裁剪高度（像素），<=0 表示整屏' })
    cropHeight: number = 0;
    @property({ tooltip: '中心偏移X（像素，右为正）' })
    offsetX: number = 0;
    @property({ tooltip: '中心偏移Y（像素，下为正）' })
    offsetY: number = 0;

    private _count: number = 0;
    private _fs: any = null;
    private _path: any = null;
    private _bufferCtor: any = null;
    private _pendingCapture: boolean = false;

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.initFileSystem();
        this.ensureDirExists();
        this._count = this.getExistingMaxIndex();
        console.log(`[ScreenshotOnW] 初始计数: ${this._count}`);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private initFileSystem() {
        try {
            // @ts-ignore
            const req = (window as any).require || require;
            this._fs = req('fs');
            this._path = req('path');
            const bufferModule = req('buffer');
            this._bufferCtor = bufferModule.Buffer;
        } catch (e) {
            console.warn('[ScreenshotOnW] 无法加载 Node 模块。当前平台可能不支持写入到项目目录。', e);
        }
    }

    private ensureDirExists() {
        if (!this._fs) return;
        try {
            if (!this._fs.existsSync(this.saveDir)) {
                this._fs.mkdirSync(this.saveDir, { recursive: true });
                console.log('[ScreenshotOnW] 已创建目录:', this.saveDir);
            }
        } catch (e) {
            console.error('[ScreenshotOnW] 创建目录失败:', this.saveDir, e);
        }
    }

    private getExistingMaxIndex(): number {
        if (!this._fs) return 0;
        let max = 0;
        try {
            const files: string[] = this._fs.readdirSync(this.saveDir);
            const reg = /^level(\d+)\.png$/i;
            for (const f of files) {
                const m = f.match(reg);
                if (m) {
                    const n = parseInt(m[1], 10);
                    if (!isNaN(n) && n > max) {
                        max = n;
                    }
                }
            }
        } catch (e) {
            console.warn('[ScreenshotOnW] 读取目录失败:', e);
        }
        return max;
    }

    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_W) {
            this.queueCapture();
        }
    }

    private queueCapture() {
        if (this._pendingCapture) return;
        this._pendingCapture = true;
        director.once(Director.EVENT_AFTER_DRAW, () => {
            this.captureAndSave();
            this._pendingCapture = false;
        }, this);
    }

    private captureAndSave() {
        if (!this._fs || !this._bufferCtor) {
            console.warn('[ScreenshotOnW] fs/Buffer 不可用，无法保存截图。');
            return;
        }
        const canvas: HTMLCanvasElement = game.canvas as any;
        if (!canvas || !canvas.toDataURL) {
            console.error('[ScreenshotOnW] 未找到画布或不支持截图。');
            return;
        }

        try {
            const cw = (canvas as any).width;
            const ch = (canvas as any).height;
            const w = Math.max(0, Math.floor(this.cropWidth));
            const h = Math.max(0, Math.floor(this.cropHeight));
            let dataURL: string;
            const hasDocument = typeof document !== 'undefined' && !!(document as any).createElement;
            if (hasDocument && w > 0 && h > 0) {
                const srcW = Math.min(w, cw);
                const srcH = Math.min(h, ch);
                const centerX = Math.floor(cw / 2 + this.offsetX);
                const centerY = Math.floor(ch / 2 + this.offsetY);
                let sx = centerX - Math.floor(srcW / 2);
                let sy = centerY - Math.floor(srcH / 2);
                sx = Math.max(0, Math.min(sx, cw - srcW));
                sy = Math.max(0, Math.min(sy, ch - srcH));
                const tmp = (document as any).createElement('canvas');
                tmp.width = srcW;
                tmp.height = srcH;
                const ctx = tmp.getContext('2d');
                if (ctx) {
                    ctx.drawImage(canvas, sx, sy, srcW, srcH, 0, 0, srcW, srcH);
                    dataURL = tmp.toDataURL('image/png');
                } else {
                    dataURL = (canvas as any).toDataURL('image/png');
                }
            } else {
                dataURL = (canvas as any).toDataURL('image/png');
            }
            const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
            this._count += 1;
            const filename = `level${this._count}.png`;
            const fullPath = this._path ? this._path.join(this.saveDir, filename) : (this.saveDir + '\\' + filename);
            const buffer = this._bufferCtor.from(base64Data, 'base64');
            this._fs.writeFileSync(fullPath, buffer);
            console.log('[ScreenshotOnW] 截图已保存:', fullPath);
        } catch (e) {
            console.error('[ScreenshotOnW] 保存截图失败:', e);
        }
    }
}