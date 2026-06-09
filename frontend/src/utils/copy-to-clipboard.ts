/**
 * 复制文本到剪贴板
 * 支持现代浏览器 API，兼容旧浏览器 fallback
 *
 * @param text - 要复制的文本
 * @returns Promise<void>
 */
export async function copyToClipboard(text: string): Promise<void> {
  // 现代浏览器 API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // 权限拒绝或其他错误，继续尝试 fallback
    }
  }

  // 旧浏览器 fallback（document.execCommand）
  const textArea = document.createElement('textarea')
  textArea.value = text

  // 避免滚动到底部
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '0'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (!successful) {
      throw new Error('复制命令执行失败')
    }
  } catch {
    throw new Error('复制功能不支持')
  } finally {
    document.body.removeChild(textArea)
  }
}
