// lib/supabase/presence.ts
import { createClient } from "@/utils/supabase/client";

export const initPresence = (
  channelName: string,
  userId: string,
  onChange: (ids: string[]) => void,
) => {
  const supabase = createClient();

  const channel = supabase.channel(channelName, {
    config: { presence: { key: userId } },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    const onlineIds = Object.keys(state);
    onChange(onlineIds);
  });

  channel.subscribe(async (status: any) => {
    if (status === "SUBSCRIBED") {
      await channel.track({});
    }
  });

  return channel;
};
