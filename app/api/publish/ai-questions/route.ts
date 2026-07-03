import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { getQuestionForField, parseAnswerForField } from '@/lib/publish/question-templates';
import { generateObject } from 'ai';
import { hasOpenAIKey, openai, AI_MODELS } from '@/lib/ai/openai-client';

const bodySchema = z.object({
  missingFields: z.array(z.string()).min(1).max(5),
  categoria: z.string().optional(),
  context: z.string().optional(),
  answer: z.string().optional(),
  fieldId: z.string().optional(),
});

const QuestionSchema = z.object({
  questions: z.array(z.object({
    fieldId: z.string(),
    question: z.string(),
  })).max(3),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`publish-questions-${ip}`, { windowMs: 60_000, maxRequests: 40 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await request.json());

    // Parse answer for a specific field
    if (body.answer && body.fieldId) {
      const value = parseAnswerForField(body.fieldId, body.answer);
      return NextResponse.json({
        fieldId: body.fieldId,
        value,
        nextQuestions: body.missingFields
          .filter((f) => f !== body.fieldId)
          .slice(0, 2)
          .map((f) => ({
            fieldId: f,
            question: getQuestionForField(f, { categoria: body.categoria }),
          })),
      });
    }

    // Generate questions for missing fields
    const predefined = body.missingFields.slice(0, 3).map((fieldId) => ({
      fieldId,
      question: getQuestionForField(fieldId, { categoria: body.categoria }),
    }));

    if (hasOpenAIKey() && body.context && body.missingFields.length > 0) {
      try {
        const { object } = await generateObject({
          model: openai(AI_MODELS.ROUTER),
          schema: QuestionSchema,
          prompt: `Genera preguntas naturales en español peruano para completar un aviso. Contexto: ${body.context}. Campos faltantes: ${body.missingFields.join(', ')}`,
        });
        const merged = body.missingFields.slice(0, 3).map((fieldId, i) => ({
          fieldId,
          question: object.questions[i]?.question || getQuestionForField(fieldId, { categoria: body.categoria }),
        }));
        return NextResponse.json({ questions: merged });
      } catch {
        // fallback
      }
    }

    return NextResponse.json({ questions: predefined });
  } catch (e) {
    console.error('[publish/ai-questions]', e);
    return NextResponse.json({ error: 'Error al generar preguntas' }, { status: 500 });
  }
}
