import { CompanionSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCompanionAnswer } from "@/server/companion/companion-ai-service";

export async function createCompanionExchange(input: {
  userId: string;
  message: string;
}) {
  const newestHistory = await prisma.companionConversation.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { sender: true, content: true },
  });
  const history = newestHistory.reverse().map((item) => ({
    role:
      item.sender === CompanionSender.USER
        ? ("user" as const)
        : ("assistant" as const),
    content: item.content,
  }));
  const answer = await generateCompanionAnswer({ ...input, history });
  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.companionConversation.create({
      data: {
        userId: input.userId,
        sender: CompanionSender.USER,
        content: input.message,
      },
    }),
    prisma.companionConversation.create({
      data: {
        userId: input.userId,
        sender: CompanionSender.ASSISTANT,
        content: answer.reply,
        emotionContext: `${answer.provider}:${answer.scope}:${answer.safety}`,
      },
    }),
  ]);

  return { answer, userMessage, assistantMessage };
}
