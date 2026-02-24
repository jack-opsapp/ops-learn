import OpenAI from 'openai';

// --- Types ---

interface MCQuestion {
  id: string;
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct_answer: number;
  points: number;
}

interface ShortAnswerQuestion {
  id: string;
  type: 'short_answer';
  question: string;
  rubric: string;
  points: number;
}

interface WorkbookPart {
  id: string;
  prompt: string;
  type: 'text' | 'textarea';
}

interface WorkbookQuestion {
  id: string;
  type: 'workbook';
  question: string;
  parts: WorkbookPart[];
  rubric: string;
  points: number;
}

type Question = MCQuestion | ShortAnswerQuestion | WorkbookQuestion;

export interface AssignmentContent {
  title: string;
  instructions: string;
  questions: Question[];
}

interface QuestionFeedback {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  questionFeedback: QuestionFeedback[];
}

// --- Grading ---

function gradeMC(
  question: MCQuestion,
  answer: number | string | undefined
): QuestionFeedback {
  const selected = typeof answer === 'string' ? parseInt(answer, 10) : answer;
  const isCorrect = selected === question.correct_answer;

  return {
    questionId: question.id,
    score: isCorrect ? question.points : 0,
    maxPoints: question.points,
    feedback: isCorrect
      ? 'Correct!'
      : `Incorrect. The correct answer is: ${question.options[question.correct_answer]}.`,
  };
}

async function gradeWithAI(
  question: ShortAnswerQuestion | WorkbookQuestion,
  answer: unknown,
  client: OpenAI
): Promise<QuestionFeedback> {
  let studentAnswer: string;

  if (question.type === 'workbook' && typeof answer === 'object' && answer !== null) {
    const parts = answer as Record<string, string>;
    studentAnswer = question.parts
      .map((p) => `${p.prompt}\nAnswer: ${parts[p.id] ?? '(no answer)'}`)
      .join('\n\n');
  } else {
    studentAnswer = String(answer ?? '(no answer)');
  }

  const prompt = `You are grading a student assignment for a course about running a service business.

RUBRIC:
${question.rubric}

QUESTION:
${question.question}

STUDENT ANSWER:
${studentAnswer}

Grade this answer on a scale of 0-${question.points}.
Provide:
1. A score (integer)
2. Brief feedback (2-3 sentences, encouraging tone, mention what was good and what could improve)

Respond in JSON only, no markdown: { "score": N, "feedback": "..." }`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);

    return {
      questionId: question.id,
      score: Math.min(Math.max(0, Math.round(parsed.score)), question.points),
      maxPoints: question.points,
      feedback: parsed.feedback,
    };
  } catch (err) {
    console.error(`[grading] AI grading failed for ${question.id}:`, err);
    return {
      questionId: question.id,
      score: 0,
      maxPoints: question.points,
      feedback:
        'We could not grade this answer automatically. A reviewer will follow up.',
    };
  }
}

export async function gradeAssignment(
  content: AssignmentContent,
  answers: Record<string, unknown>
): Promise<GradingResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const questionFeedback: QuestionFeedback[] = [];

  for (const question of content.questions) {
    const answer = answers[question.id];

    if (question.type === 'multiple_choice') {
      questionFeedback.push(gradeMC(question, answer as number | string));
    } else {
      questionFeedback.push(await gradeWithAI(question, answer, client));
    }
  }

  const totalScore = questionFeedback.reduce((sum, qf) => sum + qf.score, 0);
  const maxScore = questionFeedback.reduce((sum, qf) => sum + qf.maxPoints, 0);

  return { totalScore, maxScore, questionFeedback };
}
