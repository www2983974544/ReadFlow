// 每日学习提醒（v1.1）：基于 @capacitor/local-notifications 的本地每日定时通知。
// Android：请求通知权限 → 注册每日重复通知（固定 id，改时间/关闭即先取消重排）。
// 浏览器：无插件自动跳过（设置仍持久化，真机安装后生效）。
import { isNative, nativePlugin } from './bridge'

interface LocalNotificationsPlugin {
  checkPermissions: () => Promise<{ display?: string }>
  requestPermissions: () => Promise<{ display?: string }>
  cancelAll: () => Promise<void>
  schedule: (o: {
    notifications: Array<{
      id: number
      title: string
      body: string
      schedule: { on: { hour: number; minute: number }; repeats: boolean; allowWhileIdle: boolean }
    }>
  }) => Promise<void>
}

const REMINDER_ID = 1001

export async function applyDailyReminder(enabled: boolean, timeHHmm: string): Promise<'native' | 'browser' | 'denied'> {
  if (!isNative()) return 'browser'
  const ln = nativePlugin<LocalNotificationsPlugin>('LocalNotifications')
  if (!ln) return 'browser'

  try {
    await ln.cancelAll()
  } catch {
    /* ignore */
  }
  if (!enabled) return 'native'

  const perm = await ln.checkPermissions()
  if (perm?.display !== 'granted') {
    const req = await ln.requestPermissions()
    if (req?.display !== 'granted') return 'denied'
  }

  const [h, m] = timeHHmm.split(':').map((x) => parseInt(x, 10))
  const hour = isFinite(h) ? Math.min(23, Math.max(0, h)) : 20
  const minute = isFinite(m) ? Math.min(59, Math.max(0, m)) : 0

  await ln.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: '📖 ReadFlow 每日精读提醒',
        body: '今天的外刊精读还没开始，坚持打卡，考试倒计时一天天在减少！',
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
      },
    ],
  })
  return 'native'
}
