# SØMI Bot — Resúmenes Semanales de Discord

Script que extiende la funcionalidad de **SØMI**, un bot de Discord, generando resúmenes semanales automáticos de la actividad artística de un servidor.

## ¿Qué hace?

1. **Recopila contribuciones artísticas** — Analiza los canales de texto dentro de las categorías **Obras 🖼️** y **Bocetos/Practicas ✏️**, filtrando únicamente mensajes con imágenes de los últimos 7 días. Obtiene el **Top 3 de usuarios más activos** por canal.

2. **Recopila recomendaciones de videos** — Extrae los links compartidos en el canal de recomendaciones de videos durante la última semana, agrupados por usuario.

3. **Genera un resumen con IA** — Envía los datos recopilados a un modelo LLM local (Llama 3.1 8B vía LM Studio) con un prompt configurable para generar un resumen amigable y motivador.

4. **Publica el resumen en Discord** — Envía el resumen generado a un canal específico del servidor a través del bot.

## Estructura del proyecto

```
src/
  index.ts                            # Orquestador principal
  services/
    artist_contributions.ts           # Datos de imágenes por canal (últimos 7 días)
    video_recommendations.ts          # Links de videos por usuario (últimos 7 días)
    gemini_summary.ts                 # Genera resumen con LLM local
    discord_bot.ts                    # Envía mensaje al canal de Discord
  utils/
    filter_utils.ts                   # Filtrado de mensajes con imágenes y top 3
    http_utils.ts                     # Cliente HTTP singleton (axios)
```

## Requisitos

- Node.js
- pnpm
- [LM Studio](https://lmstudio.ai/) corriendo un modelo (ej. Llama 3.1 8B) con servidor local activo
- Un bot de Discord con permisos de **View Channel**, **Read Message History** y **Send Messages**

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
DISCORD_TOKEN=tu_token_de_bot
CLIENT_ID=id_del_bot
GUILD_ID=id_del_servidor
CHANNEL_RECOMENDACIONES_VIDEOS=id_del_canal_de_videos
CHANNEL_PRUEBAS_BOT=id_del_canal_donde_se_envia_el_resumen
LLM_BASE_URL=http://192.168.1.15:1234/v1
LLM_SYSTEM_PROMPT=Tu prompt personalizado para el modelo de IA
```

## Instalación

```bash
pnpm install
```

## Uso

```bash
# Desarrollo (compila y ejecuta en cada cambio)
pnpm dev

# Producción
pnpm build
pnpm start
```
