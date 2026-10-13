import type { BackgroundData } from './background'
import { describe, expect, it } from 'vitest'
import { groupByDate, parseBackgroundList } from './background'

function makeItem(overrides: Partial<BackgroundData> = {}): BackgroundData {
  return {
    type: 'image',
    category: 'hk4e',
    url: 'https://example.com/a.webp',
    metadata: { format: 'webp', md5: 'abc' },
    time: '20240601',
    ...overrides,
  }
}

describe('parseBackgroundList', () => {
  it('解析合法的背景数据', () => {
    const list = parseBackgroundList([makeItem()])

    expect(list).toHaveLength(1)
    expect(list[0]?.category).toBe('hk4e')
  })

  it('过滤掉格式不合法的记录', () => {
    const list = parseBackgroundList([
      makeItem(),
      { foo: 'bar' },
      null,
      42,
      { type: 'image' },
      { type: 'other', category: 'x', url: 'https://example.com/x.webp', time: '20240101', metadata: { format: 'webp', md5: 'x' } },
    ])

    expect(list).toHaveLength(1)
  })

  it('响应不是数组时抛出错误', () => {
    expect(() => parseBackgroundList({})).toThrow('响应不是数组')
  })

  it('全部记录都不合法时抛出错误', () => {
    expect(() => parseBackgroundList([{ foo: 'bar' }])).toThrow('所有记录均不合法')
  })

  it('空数组返回空列表', () => {
    expect(parseBackgroundList([])).toEqual([])
  })
})

describe('groupByDate', () => {
  it('按年月分组并保持传入顺序', () => {
    const groups = groupByDate([
      makeItem({ time: '20240715' }),
      makeItem({ time: '20240630', url: 'https://example.com/b.webp' }),
      makeItem({ time: '20240701', url: 'https://example.com/c.webp' }),
    ])

    expect(groups.map(group => group.groupName)).toEqual(['2024-07', '2024-06'])
    expect(groups[0]?.list).toHaveLength(2)
    expect(groups[1]?.list).toHaveLength(1)
  })

  it('空列表返回空分组', () => {
    expect(groupByDate([])).toEqual([])
  })
})
