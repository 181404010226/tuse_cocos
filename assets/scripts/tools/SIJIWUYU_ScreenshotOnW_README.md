# SIJIWUYU_ScreenshotOnW 组件说明

## 功能概述
- 将组件挂载到任意节点后，运行时按下 `W` 键，对当前屏幕进行截图并保存为 PNG 到 `assets/exminiassets/tex/tips` 目录。
- 截图区域支持“以屏幕中心为矩形”的裁剪，裁剪宽高可通过组件参数设置；未设置或为 0 时，默认截取整屏。
- 文件命名按 `levelN.png` 顺序递增（自动读取目录现有最大序号并延续）。

## 使用步骤
1. 在 Cocos Creator 中，将 `SIJIWUYU_ScreenshotOnW.ts` 拖到需要的节点上以添加组件。
2. 可在 Inspector 中设置：
   - `saveDir`：保存目录（默认：项目 `assets/exminiassets/tex/tips`）。
   - `cropWidth`：裁剪宽度（像素）。<= 0 表示整屏。
   - `cropHeight`：裁剪高度（像素）。<= 0 表示整屏。
3. 运行/预览游戏，按 `W` 键进行截图，即在 `saveDir` 路径下生成 `level1.png`、`level2.png`...

## 工作原理
- 通过监听键盘事件 `KEY_W`，在引擎一帧绘制完成 (`Director.EVENT_AFTER_DRAW`) 后再进行截图，避免画布尚未完成渲染导致的黑屏。
- 使用 `game.canvas` 获取最终合成的屏幕画面。
- 当设置了裁剪尺寸时，在屏幕中心计算裁剪矩形并使用临时 `canvas` 进行绘制与导出 `PNG`；未设置裁剪时导出整屏。
- 在编辑器（Electron/Node 环境）下使用 `fs` 写入 PNG 到项目目录。

## 注意事项
- 在纯 Web 构建环境运行时（非编辑器），无法直接写入到项目目录；该组件主要用于编辑器预览下的快速抓图。
- 若 `cropWidth/cropHeight` 大于屏幕尺寸，会自动裁剪到屏幕大小范围内。
- 若你的项目使用多摄像机叠加，截图结果为最终合成画面；如需仅截取指定摄像机输出，可改为基于 `RenderTexture.readPixels()` 的方式，我可以帮助你升级实现。

## 常见问题
- 黑屏截图：已通过在 `EVENT_AFTER_DRAW` 之后再截图规避，但若 WebGL 的 `preserveDrawingBuffer=false`，极少数情况下仍可能受影响，推荐改用渲染纹理读取方案以绝对稳定。
- 命名序号不连续：组件启动时会读取现有 `level*.png` 并从最大值开始递增，确保不会覆盖旧文件。

## 版本变更
- v1.0：支持按 `W` 进行整屏截图并保存 PNG。
- v1.1：新增中心裁剪区域截图，宽/高通过参数控制。