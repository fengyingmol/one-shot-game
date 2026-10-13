# 玩具小院素材记录

## 运行素材无损压缩（2026-10-13，0.22本地）

新增15张同名`.webp`运行副本：courtyard、player-poses、monster、helmet-v3、shield-v3、barrel、wood、wood-damaged、brick、iron-tile、title、normal、fast、explosive、scatter（均以`toy-`为前缀）。使用本地Sharp的`webp({lossless:true,effort:6})`机械编码，不重新生成、不缩小、不重绘；逐像素验证尺寸、透明度及可见像素一致。运行下载量由11,956,299降至7,212,346字节。PNG原件保留，加载器第三次尝试兼容回退PNG。Sharp仅安装于被忽略的`.local-tools/`，网页运行无需Node依赖或构建。

## 半碎裂木箱（2026-10-13，0.19本地）

`toy-wood-damaged.png`：1254×1254透明PNG，内置 imagegen 基于原 `toy-wood.png` 生成。原素材保留；生成结果复制到本目录，未压缩、未重绘。`drawTerrain` 在木障碍 `hp=1` 时等比平铺此图，`hp=2` 仍显示完整木箱。去掉程序绘制裂缝与缺口；剩余框架仍代表阻挡状态，视觉空隙不改变矩形碰撞。

生成源：`exec-b179ba2e-da3d-4b85-80e8-472c53a38564.png`。提示词全文如下：

```text
Use case: precise-object-edit. Asset type: transparent damaged wooden obstacle tile for a casual 2.5D mobile game. Input image: the existing honey-gold wooden crate tile is the edit target and exact style reference. Generate its half-broken damage state after one bullet hit, NOT fully destroyed: preserve the same square framing, front-facing near-orthographic camera, rounded toy-like 3D wood, golden warm color, four gray rivets, upper-left soft lighting, and original overall square silhouette. The diagonal reinforcing plank must be visibly snapped around the middle into two jagged pieces with exposed pale wood fibers; two vertical interior planks split, with a small irregular dark see-through gap at their broken center. Some edges have chipped splinters, a tiny loose fragment still attached. Retain at least 80 percent of the solid crate so this still reads as a blocking obstacle with one health left. This must look physically broken with dimensional broken pieces and rough wooden ends, not black zigzag lines painted over intact wood. Keep each broken piece aligned within the original tile bounds; no flying debris outside the square. Fill nearly the full square canvas like the supplied original with only a tiny transparent padding, making it usable as a repeated 20px tile without stretching. Genuinely transparent background and see-through holes, no white/checkerboard backdrop, no ground, no cast floor shadow, no UI, no text, no labels, no watermark. One damaged tile only.
```

日期：2026-10-12。使用内置图像生成，未使用 CLI / 外部素材库。素材原图保留；源图与独立裁片均为 PNG，没有有损压缩。

## 方向与参考

用户选择：轻俯视、软质圆润玩具风格、奶油小院、黄紫界面。选定效果图为 `exec-ef0e46fc-85fd-4aa9-9872-db1c493fe143.png`，对照截图与验证见根目录 `design-qa.md`。这是视觉方向，不将效果图当作整关图片使用。

## 提示词要点与消费位置

| 文件 | 图像生成提示词要点 | 消费位置 |
| --- | --- | --- |
| toy-courtyard.png | 参考选定玩具 3D 风格；正交轻俯视空院子，左右平行低石墙、水平顶墙、开放底部；奶油地面，外缘草花；无角色、物体、UI、文字 | drawCourtyard，固定倍率裁片重复 |
| toy-player.png | 黄卫衣、棕发、蓝裤小人背面；轻俯视、圆润 3D 材质、左上柔光；无枪、无地面投影；真实透明背景 | drawPlayer 身体层 |
| toy-gun.png | 蓝色玩具枪、橙枪口、双手黄袖口；枪朝上、轻俯视；独立透明素材，无人物身体 / 场景 / 外部投影 | drawPlayer 瞄准层 |
| toy-monster.png | 独立紫色圆润 3D 团子，两黑眼、小嘴；近俯视、左上柔光；无盔盾引线、无外部投影、透明背景 | drawEnemy，原半径，炸弹 / 盾牌调色 |
| toy-title.png | 严格四字「一发入魂」，前两字金黄后两字奶白；深紫圆润描边、紫蓝玩具底牌；透明独立横标题，无其他文字 | header 标题 |
| toy-props.png | 透明 3×3 精灵网格；从左到右、从上到下：紫色圆头普通弹、蓝尖头高速弹与速度线、橙色爆炸弹与星形；粉色三弹丸、独立金盔、独立蓝盾；橙色带白 X 方桶、木箱方块、红砖方块；左上柔光、玩具 3D、无文字 / 分隔线 / 场景 | 提取下列独立图 |
| toy-iron.png | 独立方形蓝灰金属板、四铆钉、柔和圆角和轻薄厚度、淡银顶边；近正交俯视、左上柔光；无投影、背景、文字，真实透明 | 原始素材保留 |
| toy-iron-tile.png | toy-iron 原图精确裁片 `(85,110,1085,1030)`，无重绘、无拉伸 | drawTerrain 铁墙 |

## Props 精确裁片

以 1280×1280 预览参考网格坐标记录，按原图宽 / 1280 等比换算裁切（实际 sheet 1254×1254，经图像解码确认）。本地提取脚本 `.local-tools/extract-toy.ps1` 不上传。

| 独立文件 | x,y,w,h |
| --- | --- |
| toy-normal.png | 130,110,200,288 |
| toy-fast.png | 500,90,296,312 |
| toy-explosive.png | 872,124,352,266 |
| toy-scatter.png | 56,502,332,280 |
| toy-helmet.png | 446,504,360,278 |
| toy-shield.png | 852,476,344,328 |
| toy-barrel.png | 64,852,320,326 |
| toy-wood.png | 470,852,322,326 |
| toy-brick.png | 874,852,322,326 |

所有运行资源保存在本目录，不引用 `.codex/generated_images`。旧手绘素材保留方便回溯，不删除、不覆盖。

## 0.12 动画修正素材

内置图像生成，参考原小人和头盔制作 `toy-rig-v2.png`（1254×1254），旧文件保留。提示词要点：透明三部件精灵图；同一棕发黄卫衣蓝裤小人背面、完整头 / 身体 / 脚但完全没有手臂或手；独立竖直黄袖管，两端圆润、无手；金色施工盔严格正面、中心脊居中、水平帽檐、左右对称，不歪斜、完整透明边距；匹配原玩具3D质感、左上柔光，无文字 / 背景 / 外投影。

按实际检查部件边界提取（源坐标 x,y,w,h）：

- `toy-player-v2.png`：`0,73,524,1078`，替换身体层。
- `toy-sleeve.png`：`543,431,204,521`，双臂肩肘手蒙皮，动画中固定粗细、可变长度。
- `toy-helmet-v2.png`：`752,535,502,387`，对称佩戴与掉盔动画。

本地机械裁切脚本 `.local-tools/extract-rig.ps1` 不上传。源 PNG 无有损压缩、没有覆盖原素材。

## 0.13 完整姿势与贴合小帽

内置图像生成，两次生成，旧素材保留但不再绘制：

- `toy-player-poses.png`（2172×724）：提示词为参考原棕发黄卫衣蓝裤白鞋小人，同一角色五个完整双手持蓝色玩具枪姿势，从朝左、左上、正上、右上到朝右；固定轻俯视镜头、自然短臂弯肘贴近身体、手握枪、完整脚与枪，真实透明底；禁止举到头顶、长手臂、独立手、文字和场景。按等宽5帧绘制，所有帧固定0.12比例，不单独拉伸任一部位。实测角度与枪口锚点存于 `game.js / playerPoses`。
- `toy-helmet-v3-source.png`（1635×962）：参考紫色圆形怪的头型，提示词为贴合球头的浅金色圆顶小施工盔、窄而短的弧帽檐、居中对称窄脊，宽高约1.7:1，左上柔光；不输出怪物身体、眼睛、投影、文字，不要成人高帽或宽飞碟帽檐。机械裁出 `(292,158,1049,602)` 为 `toy-helmet-v3.png`；宽34逻辑单位配身体直径36。
- `toy-shield-v3.png`（313×313）：没有重新生成，恢复原 `toy-props.png` 中完整圆盾（原旧裁片右侧过紧），源区域 `(820,440,434,375)` 中主体 `(48,43,313,308)`，等比原像素复制、透明补齐方形，无像素变形或有损压缩。游戏显示48×48，与 `shieldGeometry` 圆盘碰撞共享中心 / 半径；取消0.12辅助范围弧。

精确边界 / 裁切校验脚本 `.local-tools/extract-v3.ps1` 不上传。姿势切换只选择完整帧并补偿整体旋转，旧骨骼蒙皮不再使用。
