# 完整草地场景 v1

- 日期：2026-10-17；用途：内外场共用的一整张草地 / 树荫 / C版石景底图。
- 生成方式：内置 imagegen，单次生成；没有切片、镜像、重复铺贴或草地边缘混合。
- 原始输出：`C:/Users/LENOVO/.codex/generated_images/01a13f57-7544-7441-ba54-4f6dfdb324aa/exec-f9b347ce-1570-43fb-bb68-5594a80c66bb.png`。
- 参考1：用户选定的第二版树荫效果，仅提取美术风格。参考2：`garden-stones-v1.png`，提取C版三组奶油石景与花草造型。
- PNG保留原始像素；WebP用于运行。地面整图在背景Canvas绘制一次，真实角色 / 墙体在上层Canvas；天空使用既有独立背景，通过顶部石墙遮住连接位置。

## 实际生成提示词

```text
Use case: stylized-concept. Asset type: final continuous game ground artwork, portrait 1024x1664.
Generate ONE complete coherent grassy ground scene, not a tile or collage. Reference image 1 is approved game art STYLE only; reference image 2 is the approved cream sandstone C arrangement and soft garden flowers. Do not copy characters, UI, sky, walls or gameplay objects.
Entire image is a near-overhead lush spring green lawn plane, polished premium casual 3D toy/clay game rendering. Upper 79 percent is open uninterrupted lawn: very fine smooth short grass, subtle low contrast blades, soft broad variations of grass color, gentle natural dappled tree shade mainly at edges with bright calm center. No noisy granular stippling or over-sharpened grass. Each shadow unique and organically continuous from top to bottom, no repeated pattern, no mirrored texture, no horizontal band, no rectangle, no field boundary.
Only at 81–87 percent image height: low warm cream sandstone foreground arrangement, two modest side groups and one wider low central platform, separated by clear grass gaps, matching reference 2 in shape and craftsmanship. Sparse tiny white/cream/light pink flowers and fresh leaves hug these rocks. Upper 79 percent must contain no rocks or large foliage; very sparse tiny clover allowed. Lowest 12 percent is mostly open continuous grass for actual buttons to overlay, with restrained corner flowers. Keep center foreground open.
No sky, no horizon, no wall or frame, no character, no monsters, no bullets, no text, no buttons, no watermark. High quality crisp sandstone/flower edges and refined soft grass, not global blur. All grass including ground below and between stone groups must be part of the same single original illustration, with perfectly continuous material and lighting.
```
