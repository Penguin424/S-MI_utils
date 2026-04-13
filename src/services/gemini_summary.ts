import { httpClient } from "../utils/http_utils.js";
import type { ChannelStats } from "./artist_contributions.js";

interface UserRecommendations {
  username: string;
  links: string[];
}

interface SummaryInput {
  userMessage: string;
  artistContributions: ChannelStats[];
  videoRecommendations: UserRecommendations[];
}

export async function generateSummary(
  llmBaseUrl: string,
  systemPrompt: string,
  data: SummaryInput,
): Promise<string> {
  const userMessage = JSON.stringify(data, null, 2);

  const { data: response } = await httpClient.post(
    `${llmBaseUrl}/chat/completions`,
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.85,
      presence_penalty: 0.1, // Lo bajamos drásticamente para evitar que se ponga poético/aburrido
      frequency_penalty: 0.2, // Añadimos este leve para que no repita nombres de canales en bucle
      max_tokens: 400,
    },
  );

  return (
    response.choices?.[0]?.message?.content ?? "No se pudo generar el resumen."
  );
}
