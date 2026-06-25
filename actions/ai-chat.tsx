/**
 * AI Chat Server Action - Main Agentic Workflow
 *
 * This module handles conversational AI using Vercel AI SDK's streamUI
 * to generate interactive React components instead of plain text.
 */

'use server';

import { createStreamableUI, createStreamableValue } from '@ai-sdk/rsc';
import { ModelMessage, streamText, generateText, tool } from 'ai';
import { openai, AI_MODELS } from '@/lib/ai/openai-client';
import { hybridSearch } from './ai-search';
import { snapAndSell } from './ai-vision';
import { Categoria } from '@/types';
import { z } from 'zod';

// Import UI components (these will be rendered by the AI)
import { ListingGrid } from '@/components/ai/ListingCard';
import { SearchingSkeleton, ThinkingSkeleton, AnalyzingImageSkeleton } from '@/components/ai/SkeletonComponents';
import { DraftListingCard } from '@/components/ai/DraftListingCard';
import { ErrorCard } from '@/components/ai/ErrorCard';

/**
 * System Prompt - Defines ADIS AI's personality and behavior
 */
const SYSTEM_PROMPT = `You are ADIS AI, an expert assistant for Buscadis, a classifieds marketplace in Peru.
Current Date: ${new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

PERSONALITY:
- Friendly, helpful, and proactive
- Speak naturally in Spanish (Peruvian dialect)
- Be concise but informative
- Show enthusiasm when helping users

CAPABILITIES:
1. SEARCH: Help users find listings using semantic search
3. PUBLISH: Guide users through creating listings (can start with "Quiero vender X" or by uploading a photo)
4. RECOMMEND: Suggest relevant listings based on user preferences

GUIDELINES:
- Always ask clarifying questions if the user's request is ambiguous
- For searches, use the search_marketplace tool
- For image-based listings, use the analyze_image tool
- For image-based listings, use the analyze_image tool
- When showing results, PREFER COMPONENTS over text lists, but ALWAYS add a brief, helpful comment about the results found (e.g., "These seem to match what you need, especially the first one in [Location]").
- Be honest about limitations (e.g., "No encontré resultados exactos, pero aquí hay opciones similares")
- If no results are found, suggest broadening the search (e.g., "Tal vez busca en otra categoría o ubicación").
- BE CONSULTATIVE: If the results are mixed, ask: "Are you looking for something specific, like [X] or [Y]?"

EXAMPLE INTERACTIONS:
User: "Busco trabajo de cocinero"
You: [Use search_marketplace tool, show results in ListingGrid component]

User: "Quiero vender esto" [uploads image]
You: [Use analyze_image tool, show DraftListingCard component]

User: "Hola"
You: "¡Hola! ¿En qué puedo ayudarte hoy? ¿Buscas algo o quieres vender?"

Remember: Your goal is to make buying and selling EFFORTLESS.`;

/**
 * Intent Classification (Router)
 * Uses GPT-4o-mini for fast, cheap classification
 */
async function classifyIntent(userMessage: string): Promise<{
  intent: 'search' | 'publish' | 'help' | 'other';
  confidence: number;
}> {
  const { text } = await generateText({
    model: openai(AI_MODELS.ROUTER),
    messages: [
      {
        role: 'system',
        content: `Classify the user's intent into one of: search, publish, help, other.
Return JSON: { "intent": "search", "confidence": 0.95 }`,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  try {
    return JSON.parse(text);
  } catch {
    return { intent: 'other', confidence: 0 };
  }
}

/**
 * Main Chat Function - Handles conversational AI with Generative UI
 */
export async function chat(
  messages: ModelMessage[]
): Promise<{
  id: string;
  role: 'assistant';
  display: React.ReactNode;
}> {
  const latestMessage = messages[messages.length - 1];
  const userMessage = typeof latestMessage.content === 'string'
    ? latestMessage.content
    : '';

  // Create streamable UI
  const uiStream = createStreamableUI();

  // Start with thinking skeleton
  uiStream.update(<ThinkingSkeleton />);

  // Classify intent for routing (optimization)
  const intent = await classifyIntent(userMessage);

  // Optimization: If intent is simple help/greeting, use faster model
  if ((intent.intent === 'help' || intent.intent === 'other') && intent.confidence > 0.8) {
    const reply = await quickReply(userMessage);
    uiStream.done(
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        lineHeight: 1.6,
      }}>
        {reply}
      </div>
    );
    return {
      id: Date.now().toString(),
      role: 'assistant',
      display: uiStream.value,
    };
  }

  // Stream the AI response with tools
  (async () => {
    const result = await streamText({
      model: openai(AI_MODELS.REASONING),
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      tools: {
        /**
         * Tool: Search Marketplace
         */
        search_marketplace: tool({
          description: 'Search for listings in the marketplace using semantic + keyword search',
          inputSchema: z.object({
            query: z.string().describe('The search query from the user'),
            category: z.enum([
              'empleos',
              'inmuebles',
              'vehiculos',
              'servicios',
              'productos',
              'eventos',
              'negocios',
              'comunidad',
            ]).optional().describe('Category filter if mentioned'),
            location: z.string().optional().describe('Location filter if mentioned'),
          }),
          execute: async ({ query, category, location }) => {
            console.log(`🔧 Tool: search_marketplace("${query}")`);

            // Show searching skeleton
            uiStream.update(<SearchingSkeleton />);

            try {
              const results = await hybridSearch({
                query,
                category: category as Categoria | undefined,
                location,
                maxResults: 10,
              });

              // Render results as interactive cards
              const resultComponent = (
                <ListingGrid
                  items={results.map((r) => r.adiso)}
                />
              );

              uiStream.done(resultComponent);

              // Generate a summary for the LLM so it knows what it found
              const topResults = results.slice(0, 3).map(r =>
                `- ${r.adiso.titulo} (${r.adiso.categoria})`
              ).join('\n');

              const tips = [
                "💡 Tip: Puedes filtrar por ubicación diciendo 'en San Sebastián'.",
                "💡 Tip: Intenta buscar por el nombre de la empresa si lo conoces.",
                "💡 Tip: ¿Buscas algo específico? Sube una foto y lo buscaré por ti.",
                "💡 Tip: Los resultados incluyen búsquedas semánticas (conceptuales) y exactas."
              ];
              const randomTip = tips[Math.floor(Math.random() * tips.length)];

              return {
                found: results.length,
                message: `Encontré ${results.length} resultados. Aquí están los primeros:\n${topResults}\n\n${randomTip}\n\nLos he mostrado visualmente arriba.`,
              };
            } catch (error: any) {
              uiStream.done(<ErrorCard message={error.message || "Error al buscar anuncios"} />);
              return {
                found: 0,
                message: `Error al buscar: ${error.message}`,
              };
            }
          },
        }),

        /**
         * Tool: Analyze Image (Snap & Sell)
         */
        analyze_image: tool({
          description: 'Analyze a product image to auto-generate listing details',
          inputSchema: z.object({
            imageUrl: z.string().describe('Public URL of the image to analyze'),
          }),
          execute: async ({ imageUrl }) => {
            console.log(`🔧 Tool: analyze_image("${imageUrl}")`);

            // Show analyzing skeleton
            uiStream.update(<AnalyzingImageSkeleton />);

            try {
              const analysis = await snapAndSell(imageUrl);

              // Render draft listing card
              const draftComponent = (
                <DraftListingCard
                  data={{
                    imageUrl,
                    categoria: analysis.category as Categoria,
                    titulo: analysis.title,
                    descripcion: analysis.suggestedDescription,
                    precio: analysis.marketPrice,
                    precioMin: analysis.marketPriceRange.min,
                    precioMax: analysis.marketPriceRange.max,
                    condicion: analysis.condition,
                    tags: analysis.searchTags,
                    confidence: analysis.marketConfidence,
                    similarListings: analysis.similarListingsFound,
                  }}
                  onPublish={(data) => {
                    console.log('Publishing:', data);
                    // TODO: Implement actual publishing
                  }}
                />
              );

              uiStream.done(draftComponent);

              return {
                success: true,
                message: `Analicé tu imagen. He creado un borrador de aviso arriba. ¡Puedes publicarlo con un clic o editarlo primero!`,
              };
            } catch (error: any) {
              uiStream.done(<ErrorCard message={error.message || "Error al analizar imagen"} />);
              return {
                success: false,
                message: `Error al analizar la imagen: ${error.message}`,
              };
            }
          },
        }),
        /**
         * Tool: Start Publication (Text-based Wizard)
         */
        start_publication: tool({
          description: 'Start the publication flow when the user wants to sell something but has not uploaded an image',
          inputSchema: z.object({
            titulo: z.string().describe('Title of the item to sell, if mentioned'),
            categoria: z.enum([
              'empleos',
              'inmuebles',
              'vehiculos',
              'servicios',
              'productos',
              'eventos',
              'negocios',
              'comunidad',
            ]).optional().describe('Category of the item, if mentioned'),
          }),
          execute: async ({ titulo, categoria }) => {
            console.log(`🔧 Tool: start_publication("${titulo}")`);

            // Show thinking skeleton
            uiStream.update(<ThinkingSkeleton />);

            // Create a draft with the provided info or defaults
            const draftData = {
              imageUrl: '', // No image yet
              categoria: categoria || 'productos',
              titulo: titulo || 'Nuevo Aviso',
              descripcion: 'Escribe aquí los detalles de tu aviso...',
              precio: 0,
              condicion: 'usado',
              confidence: 'media' as const,
            };

            const draftComponent = (
              <DraftListingCard
                data={draftData}
                onPublish={(data) => {
                  console.log('Publishing:', data);
                }}
              />
            );

            uiStream.done(draftComponent);

            return {
              success: true,
              message: `He creado un borrador para tu aviso de "${titulo}". Rellena los detalles y publícalo.`,
            };
          },
        }),
      },
    });

    // Stream text responses
    let textContent = '';
    let hadToolCall = false;

    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta') {
        textContent += delta.text;
        uiStream.update(
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}>
            {textContent}
          </div>
        );
      } else if (delta.type === 'tool-call') {
        // Tool is being called - skeleton already shown in execute()
        hadToolCall = true;
        console.log(`Tool called: ${delta.toolName}`);
      } else if (delta.type === 'tool-result') {
        // Tool completed - result already rendered in execute()
        console.log(`Tool result: ${delta.toolName}`);
      }
    }

    // If we have text content and no tool was called, finalize the text response
    if (textContent && !hadToolCall) {
      uiStream.done(
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}>
          {textContent}
        </div>
      );
    }
  })();

  return {
    id: Date.now().toString(),
    role: 'assistant',
    display: uiStream.value,
  };
}

/**
 * Simplified chat for quick replies (no tools, fast)
 */
export async function quickReply(message: string): Promise<string> {
  const { text } = await generateText({
    model: openai(AI_MODELS.ROUTER),
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond briefly in Spanish.',
      },
      {
        role: 'user',
        content: message,
      },
    ],
  });

  return text;
}
