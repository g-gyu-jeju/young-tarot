import { GoogleGenAI } from "@google/genai";

// 1. 대괄호 표기법을 사용하여 TypeScript의 문법 검사를 완벽하게 우회합니다.
const meta = import.meta as any;
const apiKey = (meta.env && meta.env.VITE_GEMINI_API_KEY) || "";
const genAI = new GoogleGenAI(apiKey);

export async function getTarotReading(
  name: string,
  birthDate: string,
  birthTime: string,
  calendarType: string,
  category: string,
  drawnCards: { name: string; isReversed: boolean }[]
) {
  const cardsText = drawnCards.map((c, i) => `${i + 1}. ${c.name} (${c.isReversed ? '역방향' : '정방향'})`).join('\n');

  const prompt = `
당신은 최고의 타로마스터입니다. 다음 정보를 바탕으로 상세한 리딩을 제공하세요.
이름: ${name}, 카테고리: ${category}
뽑은 카드: ${cardsText}
마크다운 형식으로 작성하고, 강조할 단어는 **단어** 형태를 유지하세요.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "우주의 기운을 읽는 도중 오류가 발생했습니다. 다시 시도해주세요.";
  }
}