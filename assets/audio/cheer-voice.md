# E版连击欢呼（2026-10-21，0.92，本地未发布）

- 3连击：用户选定的E试听原样使用，`cheer.wav`，1.42秒。
- 6连击：同一段人声，不变调 / 不变速 / 不重复惊叹；提高原声增益并增添低音量圆润玩具和弦，`cheer-big.wav`，1.60秒。
- 两段均22,050Hz / 16bit单声道PCM，保留自然尾音；高档峰值不超过0.92。
- 原作者MrFossy：Voice_Child_WowCelebration.wav；录音为儿童庆祝声，原页面标记CC0。
- 来源：https://freesound.org/people/MrFossy/sounds/521900/
- 许可证：https://creativecommons.org/publicdomain/zero/1.0/
- E来源为原录音5.90–6.88秒的单次欢呼，加低音量原创玩具拨音与早期混响。没有使用其他商业游戏录音，也不是Microsoft Yaoyao语音合成。
- 已认可E素材保存为`sources/cheer-e-approved.wav`，独立于忽略的试听目录，随仓库保留。运行时仅下载两段成品，不加载sources。
- 重建：`node prepare-cheer-voice.cjs`；旧PowerShell入口仅转调该脚本，不再合成旧童声。三连击成品与认可源字节一致。
- `make-audio.cjs`继续保留这两段素材；资源不可用时保留柔和铃声回退。
