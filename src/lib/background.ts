export type BackgroundType = 'image' | 'video'

export interface BackgroundMetadata {
  format: string
  md5: string
  width?: number
  height?: number
  mode?: string
  size?: number
  framerate?: number
  codec?: string
  duration?: number
  bitrate?: number
}

export interface BackgroundData {
  type: BackgroundType
  category: string
  url: string
  cover_url?: string
  metadata: BackgroundMetadata
  time: string
}

export interface BackgroundGroup {
  groupName: string
  list: BackgroundData[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBackgroundData(value: unknown): value is BackgroundData {
  if (!isRecord(value) || !isRecord(value.metadata))
    return false

  return (
    (value.type === 'image' || value.type === 'video')
    && typeof value.category === 'string'
    && typeof value.url === 'string'
    && value.url.length > 0
    && typeof value.time === 'string'
    && /^\d{6}/.test(value.time)
    && typeof value.metadata.format === 'string'
  )
}

/**
 * 校验接口返回的数据格式，过滤掉不合法记录；
 * 整个响应不合法时抛出错误，交给上层错误 UI 展示
 */
export function parseBackgroundList(raw: unknown): BackgroundData[] {
  if (!Array.isArray(raw))
    throw new Error('背景数据格式错误：响应不是数组')

  const list: BackgroundData[] = []
  let invalidCount = 0

  for (const item of raw) {
    if (isBackgroundData(item))
      list.push(item)
    else
      invalidCount += 1
  }

  if (invalidCount > 0)
    console.warn(`背景数据中有 ${invalidCount} 条记录格式不合法，已跳过`)

  if (list.length === 0 && raw.length > 0)
    throw new Error('背景数据格式错误：所有记录均不合法')

  return list
}

/**
 * 按 YYYYMM 分组，保持传入顺序
 */
export function groupByDate(list: BackgroundData[]): BackgroundGroup[] {
  const temp: Record<string, BackgroundData[]> = {}

  for (const item of list) {
    const groupName = `${item.time.slice(0, 4)}-${item.time.slice(4, 6)}`
    const group = temp[groupName] ?? []
    group.push(item)
    temp[groupName] = group
  }

  return Object.entries(temp).map(([groupName, items]) => ({
    groupName,
    list: items,
  }))
}
