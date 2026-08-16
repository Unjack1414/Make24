export function HelpPanel() {
  return (
    <div className="help-content">
      <h3>怎么玩</h3>
      <p>使用四张数字卡各一次，通过加、减、乘、除和括号组成结果为 24 的算式。</p>
      <ul>
        <li>数字范围为 1～13，可能重复。</li>
        <li>每一道题都至少有一种解法。</li>
        <li>查看提示后仍可继续作答，但本题不计正确。</li>
      </ul>
      <h3>添加到 iPhone 主屏幕</h3>
      <ol>
        <li>使用 Safari 打开本游戏。</li>
        <li>点击底部工具栏中的“分享”。</li>
        <li>选择“添加到主屏幕”，再点击“添加”。</li>
      </ol>
      <p className="muted">首次成功打开后，即使离线也可以继续游戏。统计只保存在当前设备的浏览器中。</p>
      <p className="version">凑24 · Make24 v1.0.0</p>
    </div>
  )
}
