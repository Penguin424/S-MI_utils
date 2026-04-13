import { getArtistContributions } from "./services/artist_contributions.js";
import { getVideoRecommendations } from "./services/video_recommendations.js";
import { generateSummary } from "./services/gemini_summary.js";
import { sendBotMessage } from "./services/discord_bot.js";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

(async () => {
  try {
    const token = process.env.DISCORD_TOKEN;
    const guildId = process.env.GUILD_ID;
    const videoChannelId = process.env.CHANNEL_RECOMENDACIONES_VIDEOS;
    const botChannelId = process.env.CHANNEL_PRUEBAS_BOT;
    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmSystemPrompt = `Eres SØMI, la voz de la estación pirata underground exclusiva para artistas, ilustradores y dibujantes.

REGLAS ESTRICTAS E INQUEBRANTABLES:
1. ARRANQUE OBLIGATORIO: Tu respuesta DEBE iniciar EXACTAMENTE con la frase: "¡BUEEEENOS DÍAS ARTISTAS!". No puedes decir ninguna otra palabra antes de eso.
2. ENERGÍA: Mantén un tono callejero, sarcástico, crudo y eléctrico. Eres un locutor de radio pirata, rápido y al grano. Cero poesía aburrida.
3. JERGA: Usa términos de arte (lienzos, capas, WIPs, Ctrl+Z, grafito, bloquear el color, romper el bloqueo creativo, stylus, renders).
4. VIDEOS: Aclara de forma natural pero sarcástica que los links compartidos son recomendaciones, tutoriales o "joyitas de otros creadores" encontrados en la red para inspirarse, NO son obras creadas por los miembros del servidor.
5. CIERRE: Corta la señal abruptamente al final (ej: "SØMI fuera. *[Señal perdida]*").`;
    if (
      !token ||
      !guildId ||
      !videoChannelId ||
      !botChannelId ||
      !llmBaseUrl ||
      !llmSystemPrompt
    ) {
      throw new Error(
        "Faltan variables en .env: DISCORD_TOKEN, GUILD_ID, CHANNEL_RECOMENDACIONES_VIDEOS, CHANNEL_PRUEBAS_BOT, LLM_BASE_URL, LLM_SYSTEM_PROMPT",
      );
    }

    console.log("Recopilando datos...\n");

    const artistContributions = await getArtistContributions(token, guildId);
    const videoRecommendations = await getVideoRecommendations(
      token,
      videoChannelId,
    );

    console.log(
      `Contribuciones artísticas: ${artistContributions.length} canales con actividad`,
    );
    console.log(
      `Recomendaciones de video: ${videoRecommendations.length} usuarios\n`,
    );

    console.log("Generando resumen con LLM local...\n");

    const summary = await generateSummary(llmBaseUrl, llmSystemPrompt, {
      userMessage:
        "Aquí están los datos de la semana para que narres la transmisión en vivo:",
      artistContributions,
      videoRecommendations,
    });

    console.log("Resumen generado:\n");
    console.log(summary);

    console.log("\nEnviando resumen al canal de Discord...");
    await sendBotMessage(token, botChannelId, summary);
    console.log("Resumen enviado exitosamente.");
  } catch (error) {
    console.error(error);
  }
})();
