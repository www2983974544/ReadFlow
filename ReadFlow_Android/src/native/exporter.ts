// 移动版导出桥：Android 上把 blob 下载改为「写入应用文档目录 + 系统分享面板」；
// 浏览器环境保持原生 blob 下载行为不变。
import { isNative, nativePlugin } from './bridge'
import { showToast } from '../legacy/ui-fns'

interface FilesystemPlugin {
  writeFile: (o: { path: string; data: string; directory: string; recursive: boolean; encoding: string }) => Promise<{ uri?: string }>
}
interface SharePlugin {
  share: (o: { title: string; url: string; dialogTitle: string }) => Promise<void>
}

export async function exportTextFile(filename: string, content: string, mime: string, successMsg: string) {
  if (isNative()) {
    const fs = nativePlugin<FilesystemPlugin>('Filesystem')
    const share = nativePlugin<SharePlugin>('Share')
    if (fs) {
      try {
        const res = await fs.writeFile({
          path: filename,
          data: content,
          directory: 'DOCUMENTS',
          recursive: true,
          encoding: 'UTF8',
        })
        if (share && res?.uri) {
          await share.share({ title: filename, url: res.uri, dialogTitle: '导出 ReadFlow 文件' })
        } else {
          showToast('✓ 已保存到应用文档目录：' + filename)
        }
        return
      } catch (e) {
        showToast('导出失败：' + ((e as Error)?.message || e))
        return
      }
    }
  }
  // 浏览器回退：blob 下载（与桌面行为一致）
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  showToast(successMsg)
}
