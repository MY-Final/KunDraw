import { useCallback, useMemo, useState } from "react"

import { NewApiClient } from "@/api/newapi/client"

import {
  findChannel,
  loadActiveChannelId,
  loadChannels,
  modelsForChannel,
  saveActiveChannelId,
  saveChannels,
} from "./storage"
import type { Channel } from "./types"

export function useChannels() {
  const [channels, setChannelsState] = useState<Channel[]>(loadChannels)
  const [activeChannelId, setActiveChannelIdState] = useState<string>(() => {
    const stored = loadActiveChannelId()
    if (stored) return stored
    const [first] = loadChannels()
    return first?.id ?? ""
  })

  const activeChannel = useMemo(
    () => findChannel(channels, activeChannelId),
    [activeChannelId, channels]
  )

  const models = useMemo(() => modelsForChannel(activeChannel), [activeChannel])

  const setChannels = useCallback((next: Channel[]) => {
    setChannelsState(next)
    saveChannels(next)
  }, [])

  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdState(id)
    saveActiveChannelId(id)
  }, [])

  const refreshModels = useCallback(async () => {
    const channel = activeChannel
    if (!channel?.baseUrl.trim()) return []

    const discovered = await new NewApiClient(channel).listModels()
    setChannelsState((current) => {
      const next = current.map((item) =>
        item.id === channel.id ? { ...item, models: discovered } : item
      )
      saveChannels(next)
      return next
    })
    return discovered
  }, [activeChannel])

  return { channels, activeChannel, models, setChannels, setActiveChannelId, refreshModels }
}
