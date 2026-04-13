interface DiscordAttachment {
  id: string;
  content_type?: string;
}

interface DiscordMessage {
  author: {
    id: string;
    username: string;
    global_name?: string | null;
  };
  attachments: DiscordAttachment[];
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
}

interface ChannelStats {
  channelName: string;
  categoryName: string;
  top3: { username: string; messageCount: number }[];
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function isImageAttachment(a: DiscordAttachment): boolean {
  return IMAGE_TYPES.some((t) => a.content_type?.startsWith(t) ?? false);
}

export function filterImageMessages(
  messages: DiscordMessage[],
): DiscordMessage[] {
  return messages.filter((msg) => msg.attachments.some(isImageAttachment));
}

export function getTop3PerChannel(
  messages: DiscordMessage[],
  channel: DiscordChannel,
  categories: Map<string, string>,
): ChannelStats {
  const imageMessages = filterImageMessages(messages);
  const counts = new Map<string, { username: string; count: number }>();

  for (const msg of imageMessages) {
    const userId = msg.author.id;
    const entry = counts.get(userId);
    if (entry) {
      entry.count++;
    } else {
      counts.set(userId, {
        username: msg.author.global_name ?? msg.author.username,
        count: 1,
      });
    }
  }

  const top3 = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((e) => ({ username: e.username, messageCount: e.count }));

  return {
    channelName: channel.name,
    categoryName: channel.parent_id
      ? (categories.get(channel.parent_id) ?? "Sin categoría")
      : "Sin categoría",
    top3,
  };
}
