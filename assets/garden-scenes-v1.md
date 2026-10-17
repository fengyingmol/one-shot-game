# 春日庭院上下背景素材（2026-10-17）

使用内置 `imagegen` 生成，并在本项目中保存 PNG 回退与 WebP 运行文件。美术参考为用户选定的第二版树荫效果图，生成的背景没有文字、按钮、怪物或人物，所有交互和角色继续由游戏真实绘制。

| 文件 | 用途 | 规格 |
| --- | --- | --- |
| `garden-sky-v1` | 上方蓝天、春日丘陵、花丛与垂下的奶白铃形花 | 1280×640 |
| `garden-stones-v1` | 下方 C 版两侧石块、中央低石台及连续草地前景 | 1280×853 |
| `garden-canopy-shade-v1` | 真实透明的枝叶投影，合并进场地静态缓存 | 512×768 RGBA |

三张 WebP 合计约 731 KiB；PNG 只在 WebP 加载重试仍失败时回退。原始生成结果保留于本机生成目录，运行代码只引用项目内 `assets/`。

0.61起，内场和外场底层直接复用`garden-stones-v1`的纯草地采样`[380,446,600,360]`，统一纹理比例和世界坐标；运行时只在缓存创建时处理边缘重叠淡化，不新增素材或下载。

0.62起，原始PNG / WebP继续保留。运行时在共享的离屏画布中对开放草地做2.4px / 0.72强度的微细节柔化，保护石景带、花朵和外围大叶片；内场采样和外场石景使用同一份处理结果，减弱亮暗颗粒造成的粗糙感。没有新增生成图或下载任务。

## 上方背景生成提示

Production game background asset, use the selected mockup as the art direction reference. Create ONLY the upper scenic background, a wide landscape image about 2:1. Charming polished 3D clay-like casual garden game style: gentle cyan blue sky, fluffy small white clouds, rolling verdant spring hills, distant trees and meadow flowers. Top left and top right corners have hanging leafy branches with creamy white bell-shaped blossoms. Keep middle upper sky uncluttered for real game HUD. Scenic horizon in lower half, lush meadow reaching bottom edge, green bushes framing sides. No game UI, words, buttons, characters, monsters, stone walls, game board or rectangular frame. Crisp details, warm upper-left sunlight. Full bleed landscape artwork.

## 下方背景生成与最终修订提示

Production game lower scenic background asset. C composition: left and right low groups of warm cream sandstone stepping stones among moss, white daisies and tiny pink/cream wildflowers; a wide low flat cream stone platform with irregular chipped rim and subtle cracks at the center. Three groups separated by grass gaps; no continuous wall. Polished soft 3D clay garden art, upper-left sunlight. No text, buttons, UI, characters or monsters.

Final edit: fit a 3:2 landscape slot. Keep sandstone materials and C arrangement. Move all stone groups higher, into the middle of the image; the lower third must be continuous short green grass for real controls to overlay. Keep foliage and tiny cream white/pink flowers mostly at extreme left/right edges and lower corners. Central foreground remains uncluttered. Upper grass blends into existing lawn. Soft dappled tree shade. No text, UI, buttons, characters, enemies or continuous wall.

## 透明树荫生成提示

Create a real transparent PNG foliage shadow overlay for a top-down garden game, portrait 2:3. Only projected shadows: gently defocused irregular leafy tree branches and small leaves falling diagonally from outside the upper-left/right frame onto an invisible lawn. Organic dappled canopy silhouettes, narrow branching shapes, asymmetric and varied scale. More foliage at the sides, delicate projections reaching into the field; central lane mainly transparent. Subdued desaturated olive-gray pigment, real alpha transparency between leaves and through the center. No backdrop, grass, physical trees, objects, rocks, vignette, round dark blobs, text or drawn checkerboard.
