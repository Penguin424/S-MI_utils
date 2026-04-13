import { httpClient } from "../utils/http_utils.js";
import type { ChannelStats } from "./artist_contributions.js";
import type { UserRecommendations } from "./video_recommendations.js";

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
      max_tokens: 1000,
    },
  );

  const llmSummary =
    response.choices?.[0]?.message?.content ?? "No se pudo generar el resumen.";

  let result = llmSummary;

  // Agregar links de videos al final del resumen siempre
  const videoLines: string[] = [];
  for (const user of data.videoRecommendations) {
    for (const video of user.videos) {
      videoLines.push(`🎬 ${video.title} — ${video.url}`);
    }
  }

  if (videoLines.length > 0) {
    result += `\n\n📹 **Videos recomendados esta semana:**\n${videoLines.join("\n")}`;
  }

  // Etiquetar a todos al final
  result += "\n\n@everyone";

  return result;
}
