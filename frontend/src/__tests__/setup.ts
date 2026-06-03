import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Polyfill matchMedia（jsdom 缺失）
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// 抑制 Element Plus 警告
config.global.mocks = {
  $t: (str: string) => str,
}
