import { httpClient } from "../utils/http_utils.js";

const DISCORD_API = "https://discord.com/api/v10";

export async function sendBotMessage(
  token: string,
  channelId: string,
  content: string,
): Promise<void> {
  await httpClient.post(
    `${DISCORD_API}/channels/${channelId}/messages`,
    { content },
    {
      config: {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      },
    },
  );
}
