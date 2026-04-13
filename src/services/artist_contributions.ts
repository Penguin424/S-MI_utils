import { httpClient } from "../utils/http_utils.js";
import { getTop3PerChannel } from "../utils/filter_utils.js";
import axios from "axios";

const DISCORD_API = "https://discord.com/api/v10";
const TARGET_CATEGORIES = ["Obras", "Bocetos/Practicas"];

function getSnowflakeFromDate(date: Date): string {
  const discordEpoch = 1420070400000n;
  const timestamp = BigInt(date.getTime()) - discordEpoch;
  return (timestamp << 22n).toString();
}

export interface ChannelStats {
  channelName: string;
  categoryName: string;
  top3: { username: string; messageCount: number }[];
}

export async function getArtistContributions(
  token: string,
  guildId: string,
): Promise<ChannelStats[]> {
  const reqOptions = {
    config: {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  };

  const { data: channels } = await httpClient.get<
    { id: string; name: string; type: number; parent_id?: string | null }[]
  >(`${DISCORD_API}/guilds/${guildId}/channels`, reqOptions);

  const categories = new Map<string, string>();
  for (const ch of channels) {
    if (ch.type === 4) {
      categories.set(ch.id, ch.name);
    }
  }

  const targetCategoryIds = new Set(
    [...categories.entries()]
      .filter(([, name]) => TARGET_CATEGORIES.some((t) => name.startsWith(t)))
      .map(([id]) => id),
  );

  const textChannels = channels.filter(
    (ch) =>
      ch.type === 0 && ch.parent_id && targetCategoryIds.has(ch.parent_id),
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const afterSnowflake = getSnowflakeFromDate(sevenDaysAgo);

  const results: ChannelStats[] = [];

  for (const channel of textChannels) {
    try {
      const { data: messages } = await httpClient.get(
        `${DISCORD_API}/channels/${channel.id}/messages?limit=100&after=${afterSnowflake}`,
        reqOptions,
      );

      if (messages.length === 0) continue;

      const stats = getTop3PerChannel(messages, channel, categories);
      if (stats.top3.length === 0) continue;

      results.push(stats);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) continue;
      throw err;
    }
  }

  return results;
}
