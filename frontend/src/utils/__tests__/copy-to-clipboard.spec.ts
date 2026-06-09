import { describe, it, expect, vi, beforeEach } from 'vitest'

// 导入被测试的函数
import { copyToClipboard } from '../copy-to-clipboard'

describe('copyToClipboard', () => {
  const mockWriteText = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // 恢复 navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })
  })

  it('应该使用现代浏览器 API', async () => {
    const text = 'test command'
    mockWriteText.mockResolvedValueOnce(undefined)

    await copyToClipboard(text)

    expect(mockWriteText).toHaveBeenCalledWith(text)
  })

  it('复制成功返回 Promise<void>', async () => {
    const text = 'test command'
    mockWriteText.mockResolvedValueOnce(undefined)

    await expect(copyToClipboard(text)).resolves.not.toThrow()
  })

  it('应该正确处理现代 API 复制失败并回退到 execCommand', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))

    // Mock document.execCommand
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('textarea'))
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('textarea'))

    await expect(copyToClipboard('test')).resolves.not.toThrow()

    expect(execCommandSpy).toHaveBeenCalledWith('copy')

    execCommandSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('当 clipboard 和 execCommand 都不可用时应该抛出错误', async () => {
    // 移除 clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    // Mock execCommand 返回 false
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(false)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('textarea'))
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('textarea'))

    await expect(copyToClipboard('test')).rejects.toThrow('复制功能不支持')

    execCommandSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
