import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useProject } from "../useProject"

export function LocalDataSection() {
  const { clearAllLocalData } = useProject()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div>
        <p className="text-xs font-medium">本地数据</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          项目和图片都保存在这个浏览器里，渠道与 API Key 不受影响。
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs text-destructive"
        onClick={() => setConfirming(true)}
      >
        清除本地数据
      </Button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清除本地数据</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除所有本地项目和图片吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirming(false)
                void clearAllLocalData()
              }}
            >
              清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
