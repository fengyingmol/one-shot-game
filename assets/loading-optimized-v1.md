# 0.71 加载素材整理（2026-10-17，本地未发布）

沿用现有美术，只整理运行所需像素与编码，不重新生成草地 / 天空。执行根目录`prepare-loading-assets.cjs`可复现，依赖sharp 0.35.5。

- `toy-courtyard-frame-v1`：取自`toy-courtyard-lawn-v1.webp`，保留顶部(0,0,1024,112)、左侧(0,300,96,480)、右侧(928,300,96,480)，按原坐标合成透明1024×800图。原绘制取样与比例不变；WebP quality=90、alphaQuality=100、effort=6，44752字节，PNG作为图片加载失败兼容路径。
- `toy-garden-decor-small-v1`：原`toy-garden-decor-v1.webp`缩为512×512，四个图块各256×256；当前显示62～100 CSS像素。WebP quality=92、alphaQuality=100、effort=6，84268字节，另有PNG。
- `ui/cream-v1/{control,pill,ammo}.webp`：来自同名原PNG，尺寸 / 透明度与切片不变，quality=92、alphaQuality=100、effort=6；分别20982 / 20950 / 27076字节。CSS image-set按格式选图，原PNG声明保留作旧浏览器兼容。
- 上述WebP为有损色彩编码；原素材保留，可重新调整质量。天空和连续草坪不重新编码。
- `player-renderer.js`由根目录`build-player.cjs`通过esbuild 0.28.2生成：ESM、browser、es2020、bundle / minify / tree shaking；源为`player-renderer-source.js`、`player-model.js`及原Three.js，保留完整MIT许可证，不改变模型和材质参数。
