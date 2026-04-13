import { httpClient } from "../utils/http_utils.js";
import { YouTube } from "youtube-sr";

const DISCORD_API = "https://discord.com/api/v10";

const URL_REGEX = /https?:\/\/[^\s<>]+/g;
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s<>]+/g;

function getSnowflakeFromDate(date: Date): string {
  const discordEpoch = 1420070400000n;
  const timestamp = BigInt(date.getTime()) - discordEpoch;
  return (timestamp << 22n).toString();
}

interface VideoInfo {
  url: string;
  title: string;
  channel: string;
  description: string;
  duration: string;
}

export interface UserRecommendations {
  username: string;
  videos: VideoInfo[];
}

async function getVideoInfo(url: string): Promise<VideoInfo | null> {
  try {
    const video = await YouTube.getVideo(url);
    if (!video) return null;
    return {
      url,
      title: video.title ?? "Sin título",
      channel: video.channel?.name ?? "Desconocido",
      description: video.description?.substring(0, 300) ?? "",
      duration: video.durationFormatted ?? "N/A",
    };
  } catch {
    return null;
  }
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

  const userMap = new Map<string, { username: string; urls: string[] }>();

  for (const msg of messages) {
    const ytLinks = msg.content.match(YOUTUBE_REGEX);
    if (!ytLinks || ytLinks.length === 0) continue;

    const userId = msg.author.id;
    const existing = userMap.get(userId);
    if (existing) {
      existing.urls.push(...ytLinks);
    } else {
      userMap.set(userId, {
        username: msg.author.global_name ?? msg.author.username,
        urls: [...ytLinks],
      });
    }
  }

  const results: UserRecommendations[] = [];

  for (const [, user] of userMap) {
    const videos: VideoInfo[] = [];
    for (const url of user.urls) {
      const info = await getVideoInfo(url);
      if (info) videos.push(info);
    }
    if (videos.length > 0) {
      results.push({ username: user.username, videos });
    }
  }

  return results;
}
