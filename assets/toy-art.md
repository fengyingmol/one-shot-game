# 玩具小院素材记录

## 草坪庭院与木石材质（2026-10-15，0.42本地）

内置imagegen按原图编辑，不是CLI。庭院参考toy-courtyard-satin-v2.png，浅石材参考toy-brick-satin-v2.png，深石材参考toy-iron-satin-v2.png。保留暖左上光，木纹及受损木纹复用。

| 项目素材（PNG / WebP） | 生成源文件 | 运行PNG尺寸 / 字节 | WebP字节 |
| --- | --- | --- | --- |
| assets/toy-courtyard-lawn-v1 | exec-7f1b360d-24dc-4d10-9544-165fc31e63df.png | 1024×1536 / 3394617 | 2189882 |
| assets/toy-limestone-v1 | exec-50f5f166-9410-41f0-9e19-1283d8f64816.png | 627×627 / 994134 | 506690 |
| assets/toy-basalt-v1 | exec-13ff67bb-1ed0-421f-8863-30c5614b8c43.png | 627×627 / 966261 | 523670 |

生成源目录：C:/Users/LENOVO/.codex/generated_images/01a0d233-627f-7be3-8ce8-882181e1a80f/。两石材原图1254×1254保存在assets/toy-limestone-v1-source.png与assets/toy-basalt-v1-source.png；运行图仅用System.Drawing高质量双三次等比归一到627，不重画 / 修色 / 裁切造型。Pillow仅无损编码，运行PNG / WebP完整RGBA一致。三份运行WebP共3,220,242字节；石材归一避免下载无必要的大纹理，旧素材保留。

草地沿用源裁片320,420,320,320和18/96倍率，石材按32逻辑单位平铺，不拉伸。墙根草丛 / 三叶草与连续光影为静态缓存装饰，不新增障碍、物理或下载项，加载仍19项。

### 草坪庭院完整提示词

```text
Use case: precise-object-edit. Asset: mobile game courtyard environment texture, EDIT provided courtyard image. Preserve EXACT 1024x1536 portrait composition and framing: warm cream stone top wall, left and right stone walls at same positions and thickness, exterior soft toy-style leaves and little white flowers, bottom OPEN, no bottom wall. Change ONLY all interior sandy yellow ground to an EVEN SOFT LIGHT SAGE GREEN manicured garden LAWN. It must read as short soft grass, not sand painted green: small understated rounded grass blades, tightly cropped turf, low contrast, subtle tactile toy diorama material. Large central lawn empty and UNIFORM lighting/color with very subtle microtexture; no large patches or alternating light bands, no paths, no stripes, no flowers, mushrooms, rocks, characters or objects in center. We sample a 320x320 square at x320 y420 as a repeatable lawn tile, so that entire central region must be clean consistent turf without distinctive features. Color pale muted garden green, not neon/lime, not dark forest, keep game bullets and purple/blue enemies readable. Side-wall inward shadows softly tint lawn green, never yellow dirt strips. Same refined rounded casual 3D toy aesthetic, warm upper-left sunlight, soft shadows. No perspective widening/narrowing, no scene layout edits, no UI, text or watermark. Opaque full image.
```

### 浅色石灰岩完整提示词

```text
Use case: precise-object-edit. Input is existing square red brick texture for toy garden game walls. Replace red fired bricks with LIGHT WARM LIMESTONE garden masonry, preserve square full-bleed opaque repeatable material tile, orthographic straight-on surface only, no entire wall object or transparent margins. Large softly rounded irregular stone blocks, pale warm grey and cream with shallow beige mortar seams, a few tiny weathered nicks; refined cozy toy diorama material, smooth softly sculpted forms, NOT gritty photoreal rock, no chunky black cracks. Pale grey must be clearly distinct from the dark blue-grey reinforced stone other wall type, and from warm brown wood. Very tiny sage moss in a FEW mortar corners (not green overall). Warm upper-left soft illumination, low-contrast detail, no outer frame, nails, handles, lettering, icons or watermark. No cast shadow or perspective. Desired source 627x627 or equivalent square, texture reaches every edge. Keep readable when uniformly repeated in a long thin garden wall.
```

### 深色加固石材完整提示词

```text
Use case: precise-object-edit. Asset: square full-bleed game wall material tile. Input is OLD solid blue steel wall. Replace broad metal plate with DARK BLUE-GREY BASALT GARDEN STONE reinforced by TWO narrow charcoal iron straps with small simple rivets. Mostly stone surface, NOT metal plate. Large rounded solid stone slabs, much darker and cooler than pale cream limestone, strong sturdy unbreakable identity. Restrained surface texture, subtle weathering and a hint of moss in one joint, clean sculpted cozy toy-diorama 3D material, no major cracks that suggest damage. Warm soft upper-left lighting, broad bevel highlights, no glittery reflections. Orthographic straight-on surface, no perspective, outer object silhouette, floor shadow, or transparent margin. Square texture reaches all edges and repeats along thin horizontal/vertical obstacles. No labels, text, numbers, icons, logos, or watermark. Desired equivalent square627x627 texture. Keep simple low-frequency shapes readable on phone.
```


## 双手扶盾与左右偷瞄图集（2026-10-15，0.41本地）

内置imagegen生成，非CLI；使用获选简化偷瞄图`exec-3f145f2c-2753-4358-be8d-ca1c5510d6e7.png`作身份 / 配色 / 材质参考，按动画需要生成同一套玩具的前后两层，而不是把旧盾、手和普通怪随意拼起来。没有生成或接入新的3D模型。

- 生成源：`C:/Users/LENOVO/.codex/generated_images/01a0d233-627f-7be3-8ce8-882181e1a80f/exec-f3827168-edb2-46c6-9b61-887aedbd56fb.png`。
- 项目：`assets/toy-shield-peek-v1.png`、`assets/toy-shield-peek-v1.webp`，1774×887，PNG 1,252,879字节，WebP 762,722字节；Pillow仅机械无损编码，RGBA全字节相同，无脚本重绘 / 修色。
- 左格(0,0,887,887)为完整蓝色裸球；圆体源中心450,462 / 半径365；右格(887,0,887,887)为圆盾与双小圆手，格内圆心438,453 / 半径354。后层23/365，前层24/354，均等比；只移动后层，不翻转暖左上光，前层不随探眼变化。源边缘存在抗锯齿杂色，尚不宣称成品美术边缘完美。

完整生成提示词：

```text
Use case: stylized-concept. Production game animation asset atlas on genuinely transparent background, TWO equal square cells side-by-side, wide 2:1 image. Input is approved shield monster reference for identity/material/colors only. LEFT CELL: complete bare round sky-blue toy ball, no hands, no shield, no wheels/legs/clothes, faint molded seam at side, tiny cream wind-up tip behind upper-right, TWO small inset dark bead eyes symmetrically about 40% of ball radius left/right and 40% of radius ABOVE body center (eyes will peek out over shield upper-side edges), tiny mouth optional below eyes. Clean circular silhouette, soft refined satin plastic, sphere centered in its square cell, diameter about 75% of cell side. RIGHT CELL: ONLY matching front circular powder-blue toy shield with slender cream bumper rim and TWO tiny blue rounded mitten hands naturally gripping left and right outer edges at about 10 and 2 o'clock. No arms, no body, no eyes/face behind shield, no legs/feet, no boss/pattern/emblem, no central bump, no metal. Shield a true front-on circle centered in right square cell, diameter about 75% of cell side, hands may extend a little outside circle. Both cells same scale/center height, generous transparent margins, don't overlap cell boundary. Consistent warm upper-left lighting in BOTH cells, broad soft highlights and soft self-shadow, no ground or baked cast shadow. This is a coherent two-layer animation kit of the SAME toy character, not two assembled unrelated styles. We will put left layer behind right layer in game so body mostly hidden with one eye peeking alternately left/right. Preserve minimal cute rounded toy identity from reference, don't add details. No text, labels, dividers or watermark.
```

## 单臂持盾发条怪（2026-10-15，0.40本地）

- 使用内置imagegen，非CLI。项目素材：`toy-windup-shield-v1.png / .webp`，1254×1254，PNG 1,090,226字节，WebP 708,106字节；Pillow仅机械无损格式转换，RGBA逐像素一致，无脚本修色 / 重绘。透明背景，旧素材不覆盖。
- 输入1 `assets/toy-shield-satin-v2.png`仅作旧盾布局参考，输入2 `assets/toy-windup-bare-v1.png`作获选圆球玩具的壳体 / 发条 / 材质参考。第一稿`exec-dc943995-0fcf-49fb-8e31-17c69434f62e.png`，校正稿`exec-14176381-b76a-4c48-8ad2-4806952f87bb.png`；源目录`C:/Users/LENOVO/.codex/generated_images/01a0d233-627f-7be3-8ce8-882181e1a80f/`。仅校正稿接入游戏。
- 单张完整蓝色发条球，短关节臂握盾背把手，取消左侧抱盾手；象牙白盾边，不另画手或盾。源盾中心608,837，半径314，等比映射到原中心y+28 / 半径24。生成图的身体轮廓与装饰不作逐像素碰撞，碰撞身体半径23不变。

最终使用的生成提示词（第一稿）：

```text
Use case: stylized-concept. Asset type: complete transparent game character sprite. Image 1 is the OLD shield enemy layout reference ONLY: replace its organic blob and two-hand hugging pose. Image 2 is the APPROVED wind-up toy identity/material reference. Create ONE complete BLUE spherical wind-up toy shield enemy in the same refined rounded satin molded-plastic style as image 2, with molded shell seam, cute inset dark eyes, small playful smile, ivory wind-up key at rear, two tiny recessed teal rollers. NOT humanoid, no head/torso/legs/clothes, no helmet. Critical pose: ONE short hinged toy arm extends out from the body's screen-right side and visibly holds a handle behind the circular shield, arm separated from the body; do NOT hug, clutch or embrace the rim with two hands. The shield is held forward, not glued against the face. No hand on left rim. Shield front is a circular blue toy disk with a thick pale ivory rim and small central boss, softly bevelled, no realistic shiny steel. Camera slightly elevated front orthographic, shield front nearly perfectly circular in image, body centered above and behind shield. Warm upper-left lighting, soft self-shadowing, clear depth, NO baked floor/cast shadow. Composition on square transparent canvas: circular shield center approximately (50% width,64.5% height), radius28% width; body center around (50%,32%), body radius27% width; windup key and short holding arm must fit within canvas. Entire character isolated, generous transparent border, no floor, no background, no text, no watermark. A single coherent rendered asset, not a sprite sheet. Keep cheerful casual toy-game feel.
```

校正提示词（以上第一稿作edit target）：

```text
Use case: precise-object-edit. Edit this complete transparent toy character sprite with ONE targeted geometry correction. Preserve blue wind-up toy identity, material, ivory key, face, the single screen-right hinged arm clearly holding rear handle (NOT hugging, no second hand), warm upper-left lighting, transparent background. Align circular shield center exactly vertically below spherical body center: both center x=50% canvas. Shield must be truly circular front-on, outer radius27% canvas width; center y=65% canvas height. Blue spherical body radius26% canvas width, center y=33.5% canvas height. Shield-to-body vertical center distance31.5% canvas width. Body must remain round not stretched. In the input shield is offset left; move shield right below body and adapt only the short gripping arm to retain coherent one-hand holding. Tiny recessed rollers below body not long legs; do not place wheels below the shield. Entire coherent character isolated with transparent margins, no ground shadow, no text.
```

## 圆球发条护甲怪（2026-10-15，0.38本地）

用户选定第三版“原创圆球发条怪”：简洁壳体，凭拼缝 / 发条 / 滚轮体现玩具身份，不做人形，不直接搬用车辆等现成玩具。先替换头盔怪一类；普通、盾牌和炸弹怪未替换。使用内置imagegen，不是CLI；PNG真实透明，不含地面或投影。整体护甲角色与裸壳角色分别完整生成，掉落盖子仅用于脱离后的动画。

| 项目内路径（均含PNG / WebP） | 生成源 | PNG字节 | 无损WebP字节 |
| --- | --- | --- | --- |
| `toy-windup-armored-v1` | `exec-4c95d7d4-a122-4dd6-ac39-adc2982ad509.png` | 1141270 | 742054 |
| `toy-windup-bare-v1` | `exec-119338f9-0ff4-4fa5-b6e5-a30e44599cf6.png` | 1038287 | 632732 |
| `toy-windup-cover-v1` | `exec-8add20e7-4896-42b8-93f0-a7ba3cc815bc.png` | 1071294 | 682570 |

三图均1254×1254，Pillow仅做无损WebP格式编码和读取透明度 / 边界，不重绘、不改色、不改变alpha。PNG和解码WebP逐RGBA像素一致。旧素材与生成源保留；运行时等比取片 / 合成与统一阴影参数见游戏说明0.38。生成仍保留极少轮廓抗锯齿杂色，不把“生成已完成”等同于精细度终审。

设计来源：用户选择的第三张`exec-8d6e2599-466e-4d84-bebe-949f49a837fc.png`，先得到透明样板`exec-93a5a142-8103-47b2-9930-e361cce52bd3.png`，然后以该透明样板为以下三次图像编辑的参考。提示词共享前缀加各自任务构成实际最终提示词：

```text
Edit target Image 1 is the APPROVED third-direction round wind-up toy monster. Preserve its exact original character identity: round lavender plastic housing, inset glossy dark oval toy eyes and tiny smiling mouth, ivory double-loop wind-up key at rear right, tiny recessed teal rollers underneath, warm upper-left light, mildly overhead orthographic 3/4 view. User rejects human forms and recognizable toy vehicles. No added arms, feet, clothing or clutter. Output ONE clean centered game sprite on genuine transparent RGBA background, comfortable margins, high fidelity satin molded plastic, no ground, no shadows on a ground plane, no backdrop, no text or labels, no checkerboard baked into image. Clean antialiased contour with no white halo, stray specks, or opaque fringe.

ARMORED:
Task: EDGE CLEANUP ONLY. Keep the COMPLETE character including its same butter-yellow protective upper housing, round top button, 3 broad molded channels and notched seam. Preserve geometry, pose, relative scale, facial spacing and colors. Repair the isolated edge specks and pale matte fringes around the toy / winding key, preserve true solid opacity on body. This is one whole armored character, not a separate sphere + accessory and not an atlas.

BARE:
Task: create the SAME character AFTER its yellow outer protective cover was knocked off. Remove ONLY the yellow dome / top button / armor cover; underneath reveal a complete smooth lavender rounded upper body of the SAME size and shape. It is a complete bare lavender spherical molded toy housing, not a cut-open bowl and not a tiny lower hemisphere. One subtle seam line across the newly revealed lavender upper housing is enough; do not invent machinery or a different face. Keep all existing lavender lower body, face, rear ivory winding key and recessed teal rollers identical in proportion and position. No yellow anywhere. The purple ball remains a full round creature after armor loss. Same viewing angle, no pose or expression change. SINGLE full bare toy sprite.

CAP:
Task: extract ONLY the DETACHED BUTTER-YELLOW PROTECTIVE UPPER SHELL, matching the original upper half of the toy. Include the original round top button, 3 broad molded channels, small front notch and smooth fitted seam edge. Remove ALL purple body, face, teal rollers and wind-up key. Output a single loose hollow yellow hemispherical plastic protective dome seen in the same 3/4 overhead orientation. It is the shell that will tumble away after being hit, not a construction helmet: no external hat brim. No extra pieces, no duplicated dome, no stand and no ground shadow. Keep the original distinctive shell design precisely.
```

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

## 0.35 外缘石柱与花丛（2026-10-14，本地未发布）

内置imagegen生成`toy-garden-decor-v1.png / .webp`，1254×1254真实透明2×2图集：两种圆润奶油石柱与基部绿植，两种白色小雏菊 / 绿叶 / 石子花丛。每格627×627，固定等比取片；透明边缘和可见RGB与无损WebP一致。旧素材与生成原图保留。它只用于可玩边界之外的装饰，不是新的障碍、怪物或场景3D化。

生成提示词：

Use case: stylized-concept. Asset type: production game decorative sprite atlas for a warm clay miniature courtyard, real transparent background. Reference image is art direction and lighting reference ONLY. Generate ONE square atlas with exactly FOUR separate self-contained assets, arranged in a strict 2x2 grid with generous TRANSPARENT gutters. Each subject entirely stays inside its own quadrant, no overlap. Upper-left: small stout cream sandstone corner pillar with a square rounded cap, carved soft bevels and a short stack of 3 stone courses; leafy rounded green plants and 3 white yellow-center daisies at its base. Upper-right: another same-sized cream corner pillar, different natural chips, succulent foliage and little golden pebbles at base. Lower-left: broad dense low cluster of round sculpted grass-green and yellow-green leaves, 5 small white daisies and 2 pale stones, no pot. Lower-right: a differently shaped taller leafy shrub with 4 small white daisies and warm cream pebbles, no pot. Premium toy/clay 3D pre-rendered game art with gentle satin finish, clear rounded volume, warm upper-left soft sunshine and warm bounce, camera same light top-down frontal orthographic courtyard angle as reference, no outlines, no wet glossy glare. NO ground, NO cast ground shadow, no background paint, no characters, no guns, no UI, no text, no numbers, no frame around atlas. All four assets have crisp genuine transparent alpha around silhouettes, including between the leaves. Pillars should occupy middle ~65% width and ~80% height of each upper quadrant; foliage clusters occupy ~80% width and ~65% height of their lower quadrant. These will decorate OUTSIDE the playable rectangle so avoid large protruding horizontal stone ledges. Output square high quality sprite atlas.

## 0.34 材质统一与模型人物（2026-10-14，本地未发布）

使用内置imagegen，参考已选暖色小院风格图；实际运行仍是Canvas场地 / 怪物材质，不迁移3D场景。只将人物小样模型经透明离屏WebGL渲染合成到原画布。旧素材全部保留，不覆盖。

- `toy-courtyard-satin-v2.png / .webp`：1024×1536不透明场地，保留裁片结构与底部开放。
- `toy-helmet-satin-v2.png / .webp`、`toy-shield-satin-v2.png / .webp`：1254×1254真实透明完整怪物，原几何锚点不变。
- `toy-bomb-satin-v1.png / .webp`：1254×1254完整红怪与引线，替代紫色怪调色；本体中心约639,700、直径912。
- `toy-wood-satin-v2`、`toy-wood-damaged-satin-v2`、`toy-brick-satin-v2`、`toy-iron-satin-v2`：各627×627，内置生成1254方图2×2材质atlas机械等分裁切，无缩放 / 拼装；只替换材质，原地形规则不变。
- PNG与无损WebP逐像素核对可见RGB / alpha一致。生成原图保留；本地机械提取与检查脚本在忽略目录`.local-tools/`，不上传。最终素材全部在项目assets中，不运行时读取生成目录。

### 最终生成提示词（内置工具）

#### courtyard

Use case: style-transfer. Image 1 is edit target, an empty production game courtyard background; image 2 is style and lighting reference ONLY. Improve material quality on image 1 to match reference: warm cream sandstone blocks with sculpted rounded beveled corners, subtle individual stone surface variation and tiny mineral pores, lush rounded clay leaves with a few small white daisies along OUTSIDE walls, warm sandy softly textured floor, warm soft sunlight from upper left and clear gentle inward wall cast shadows. Preserve EXACT empty rectangular framing and camera of image 1: side walls occupy left/right 96/1024 width, top wall occupies112/1536 height; bottom OPEN with no cross wall. Preserve these dimensions and all blank center region. The center floor must be UNIFORMLY lit fine pale golden sand with subtle seamless-compatible small surface pattern, NO objects, no obvious large illumination gradient, no dirt patches or floor obstacles. Camera is the same slightly elevated orthographic angle, NOT an isometric diamond or vanishing point view. Premium casual toy courtyard, smooth polished render with subdued satin materials, organic warm bounce, stronger sculpted relief than flat illustration. No characters, gun, HUD, UI, lettering, signs, watermarks. Output portrait 1024x1536 fully opaque.

#### helmet

Use case: lighting-weather. Image 1 is edit target, complete helmet monster sprite. Image 2 is target matte monster surface finish; image 3 is scene art direction. Change ONLY material and lighting: cohesive soft satin/clay toy sculpture, softly illuminated golden yellow helmet, violet body with rich curved form shadow lower-right and warm upper-left soft key, fine pristine finish. Remove oversized white specular glare entirely from helmet and purple body, tiny eye glints only. Keep exact original silhouette, pose, placement, face, equipment and body/helmet sizes and framing as image 1. Shallow snug helmet fits round monster, narrow level brim; NOT a separately pasted hat. Purple body diameter about76.6% of canvas, center49.8%,55.8%, same original. Genuine transparent background, no ground or baked cast shadow. No limbs, scene, text or extra props. Single complete high quality coherent character render on square canvas.

#### shield

Use case: lighting-weather. Image 1 is complete shield monster edit target. Image 2 is target surface finish; image 3 is scene mood reference ONLY. Preserve original full blue round monster holding a large blue/silver circular shield, exact original silhouette, proportions, SHORT hands, framing and shield alignment. Change ONLY lighting/material to premium warm softly lit satin/clay miniature, subdued blue lacquer shield with brushed satin silver rim, rounded volumetric cheeks and contact occlusion at hands. Remove huge white glare spots, eyes have tiny glints, deep but soft lower-right curved body shadow, warm upper-left key. CRITICAL shield remains a PERFECT circular front view disk, center about49.8%,65% of canvas, radius32.7% canvas, body stays higher above it. No perspective oval, no shifted shield or elongated limbs. Genuine transparent background, no floor or baked cast shadow, no text/scene. Whole coherent character, not separate parts.

#### bomb

Use case: stylized-concept. Image 1 is character identity and framing reference; image 2 is game style/light reference ONLY. Generate ONE complete round warm coral-red bomb monster, same tiny dark raised oval eyes and small recessed mischievous smile as the purple monster. Same plump near-spherical satin clay silhouette, body center about50%,54% of canvas, body diameter74% canvas. It wears only a short dark fuse attached naturally on the top, bent slightly toward upper-right, with tiny amber glowing tip. Soft upper-left warm key, strong soft curved lower-right form shadow, warm sand reflected bounce on underside. No huge white glossy patches, no sharp outlined cartoon, no separate parts. Orthographic slightly elevated frontal camera matching purple reference. Body/face/fuse fit fully in a square image with margin. Genuine transparent background, NO ground or baked cast shadow, no extra props/limbs, text or scene.

#### terrain

Use case: stylized-concept. Asset type: ONE production material texture atlas, square 1024x1024, exactly 2x2 equal square cells, no gutters. For a warm premium casual toy courtyard game, reference image is ART DIRECTION only. Strictly orthographic TOP-DOWN material surfaces, no cube sides or perspective, no standalone objects, no external drop shadows or backgrounds. Upper-left cell: honey-gold natural wooden plank surface, 4 wide vertical planks, gentle fine grain and round edge highlights, small inset silver rivets near four corners, warm wood not chocolate. Upper-right cell: same honey wood but first-hit damaged, two authentic irregular splintered diagonal breaks and fractured grain, pale broken inner fibers, still largely intact, no written crack marks. Lower-left cell: warm terracotta brick running bond, 3 brick courses, wide rounded clay bricks, narrow pale mortar, softly bevelled raised brick edges with natural subtle tonal variation. Lower-right cell: cool blue-gray satin iron plate, four inset rounded metal rivets near corners, smooth brushed surface and fine bevelled panel border. All cells fill their complete square area with their materials. Shared upper-left soft illumination, understated highlights, fine clean game art. No characters, room, floor, flowers, text, labels, watermark, camera tilt or heavy gradients. Texture detail should stay readable when each cell is tiled at about32 game units; style matches the reference rendered toy walls.

## 0.33 普通怪材质样板（2026-10-14，本地未发布）

使用内置imagegen，原普通怪为身份参考，用户的小院效果图为镜头 / 光照参考。第一张草稿亮斑仍过强，进一步以该草稿为编辑目标校正哑光材质；最终文件为 `toy-normal-sculpt-v2.png / .webp`（1254×1254），仅普通怪消费。草稿在忽略目录 `.local-tools/draft-assets/` 保留，不作为运行资源。最终PNG / 无损WebP保持透明及可见像素一致，不覆盖旧素材。

### 初次生成提示词

Use case: stylized-concept. Asset type: polished production sprite for ONE ordinary monster in a casual marble-ricochet game. Input image 1 is the current purple monster identity reference; input image 2 is the TARGET GAME CAMERA / lighting / toy-like volume reference, NOT a request to reproduce its UI or entire scene. Generate a new single complete lavender-purple plump blob creature, no equipment, no arms, no feet, no spikes. The goal is a convincing solid miniature 3D sculpture instead of a flat circle with printed eyes. Orthographic camera looking down at about 30 degrees, slightly three-quarter face (about 10 degree turn), clearly visible smooth dome and curved cheeks, a subtly flattened grounded underside. Restrained satin silicone/clay material with very fine clean finish, not wet plastic or a glossy candy. One large warm soft key light from upper left, rich smooth form shadow around lower right, mild warm reflected light from a sandy floor but NO actual floor rendered, tiny soft rim separation. Sculpted raised glossy dark bean-shaped eyes with contact shading where they meet curved face; small recessed cheerful smile with visible rounded lip and depth, no pasted decals. Face is on front-lower curvature, preserving tiny readable cute expression. Body silhouette close to a circle, no extreme squash, no flat outlined illustration, no faceted low-poly, no extra sparkles or oversized white specular patches. True transparent alpha background; NO cast ground shadow (game renders its own), no text, no checkerboard painted into output, no frame, no environment. Single character centered in square canvas with generous transparent margin; visible body roughly x15%-85%, y15%-85%, full silhouette within frame. Premium high-quality stylized 3D character render, strong but pleasant depth, lighting matching the supplied courtyard reference.

### 最终材质 / 光照校正提示词

Use case: lighting-weather. Image 1 is the edit target: purple sphere creature. Preserve its identity, exact silhouette, face and composition. Change ONLY surface finish and lighting to convincing premium MATTE CLAY miniature 3D render. IMPORTANT remove the two large bright white reflections on upper-left body entirely; body has NO sharp white highlights anywhere. Make material roughness high, smooth diffuse satin silicone, not shiny glossy plastic. Warm directional key light from upper left and moderately stronger blue-purple form shadow covering lower-right quadrant with gentle warm bounce from ground. Visibly solid volume: diffuse top/left glow, clear soft light-to-shadow terminator on right, deep bottom contact shading built into underside surface, subtle volumetric cheek and eye attachment occlusion. Eyes may retain tiny controlled specular dots; body must NOT. Keep 3/4 facial orientation and recessed smile, no new limbs/props. No grain/no painted brush texture. Actual transparent background with original alpha silhouette preserved, no ground, no baked ground shadow, no text. This is a production small mobile-game sprite, not a flat cartoon icon.

## 0.30 整体生成头盔怪 / 盾牌怪（2026-10-14，本地未发布）

使用内置imagegen工具，真实透明背景；参考原`toy-monster.png`仅用于角色与材质一致性，不在运行时拼装。整体PNG保留，WebP无损编码；没有删除 / 覆盖旧素材。盾牌首版仅在生成目录保留，校正后的版本才进入项目。

- `toy-helmet-monster-v1.png / .webp`：完整紫色怪与金盔，1254×1254；身体源锚点625,700、直径960。死亡 / 破盔后仍用原裸头怪和脱落帽子动画；独立帽子不再用于佩戴层。
- `toy-shield-monster-v1.png / .webp`：完整蓝色怪、双短手与蓝银圆盾，1254×1254；盾源锚点625,815、校准半径410。活怪单张等比绘制、无bob，保证盾中心稳定；手只装饰，判定仍原身体圆与盾盘圆。

### 完整头盔怪最终提示词

Use case: stylized-concept. Asset type: single production game enemy sprite on genuine transparent background. Reference image 1 is STYLE AND CHARACTER IDENTITY reference only, not a compositing target. Generate an entirely new integrated full character render: same plump perfectly round purple toy blob monster, tiny shiny black eyes and small cheerful mouth, naturally wearing a snug shallow golden construction helmet. The helmet must conform to its round head, contact shadows and consistent highlights, coherent 3D object, not two pasted images. Camera frontal slightly elevated orthographic, symmetric facing viewer, light upper left, polished rounded casual mobile game toy art. No arms, feet, props, floor, cast ground shadow, text, frame or background. One character only. Practical framing: square canvas, purple body circle centered horizontally around x=50%, y=60%, body diameter approximately 58% of canvas; body from y31% to89%. Golden helmet covers upper quarter of head, full helmet width about body diameter, narrow brim centered level, no horns and no tilt; face stays fully visible. Keep rich purple body shading matching reference. Entire silhouette within frame with transparent margin.

### 盾牌怪初次生成提示词

Use case: stylized-concept. Asset type: single production game enemy sprite with genuine transparent background. Reference image 1 is style and spherical character shape reference only. Generate an entirely NEW coherent complete shield-bearing creature, not a collage of monster and shield assets: plump round sky-blue toy blob with glossy black eyes and mischievous smile, two short small blue hands naturally gripping outer sides of a large blue circular shield in front at lower side. The hands connect to its body and grip the rim, integrated correct occlusion/contact lighting. Soft shiny toy 3D style, frontal slightly elevated orthographic view, symmetric centered, upper left light, no floor or ground shadow. Critical gameplay geometry: on a square canvas body circle center (50% width,34% height), radius22.5% of canvas; shield disk center (50% width,61.4% height), radius23.5% canvas. Thus shield diameter about 1.04 times body diameter, circular straight-on face NOT elliptical. Shield upper rim overlaps body's lower part slightly; full exposed upper rounded body/face visible over shield, hand grip side rims. Shield is large round azure disk with clear silver rim and small central silver boss, no spikes/weapons. Top body about11.5%, bottom shield about85%, empty transparent margin. One enemy only, no other items, no text, no UI, no sheet. Do not use purple body: this enemy is blue.

### 盾牌怪最终几何校正提示词

参考上一张完整盾牌怪作edit target，再生成完整透明角色；没有程序拼贴或非等比拉伸。

Use case: precise-object-edit. Image 1 is edit target, complete integrated blue shield monster. Keep same polished coherent blue blob with tiny hands gripping circular blue/silver shield, same materials, lighting, expression, transparent background. Correct ONLY production geometry/framing: render shield truly CIRCULAR straight-on, not oval. In square canvas place body as round sphere diameter 57.4% canvas with center x50%, y32%; shield circle diameter 59.9% canvas centered x50%, y67%. Body upper face must sit HIGHER above shield, still natural short hands touching rim; shield top at37%, thus overlaps lower body. Body center to shield center is35% canvas (about0.61 body diameters). Keep body sphere 57.4% diameter and shield59.9% diameter, do not fill gaps by elongating body. Transparent margin: body top3.3%, shield bottom97%, both entirely visible. No new legs, accessories, floor, shadow, text or background. Main requirement is body-to-shield center spacing and perfectly round shield. One complete integrated character render, not layered components.
