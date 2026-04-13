import { httpClient } from "../utils/http_utils.js";

const DISCORD_API = "https://discord.com/api/v10";

const URL_REGEX = /https?:\/\/[^\s<>]+/g;

function getSnowflakeFromDate(date: Date): string {
  const discordEpoch = 1420070400000n;
  const timestamp = BigInt(date.getTime()) - discordEpoch;
  return (timestamp << 22n).toString();
}

interface UserRecommendations {
  username: string;
  links: string[];
}

export async function getVideoRecommendations(
  token: string,
  channelId: string,
): Promise<UserRecommendations[]> {
  const reqOptions = {
    config: {
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
    },
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const afterSnowflake = getSnowflakeFromDate(sevenDaysAgo);

  const { data: messages } = await httpClient.get<
    {
      author: { id: string; username: string; global_name?: string | null };
      content: string;
    }[]
  >(
    `${DISCORD_API}/channels/${channelId}/messages?limit=100&after=${afterSnowflake}`,
    reqOptions,
  );

  const userMap = new Map<string, UserRecommendations>();

  for (const msg of messages) {
    const links = msg.content.match(URL_REGEX);
    if (!links || links.length === 0) continue;

    const userId = msg.author.id;
    const existing = userMap.get(userId);
    if (existing) {
      existing.links.push(...links);
    } else {
      userMap.set(userId, {
        username: msg.author.global_name ?? msg.author.username,
        links: [...links],
      });
    }
  }

  return [...userMap.values()];
}
