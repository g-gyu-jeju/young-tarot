import { GoogleGenAI } from "@google/genai";

// Vercel 설정을 무시하고 규규님의 키를 직접 입력합니다.
const apiKey = "AIzaSyArk8d1_UqSk-VQbSD1Qetg55k_qJo5XRQ"; 
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

  const prompt = `당신은 최고의 타로마스터입니다. 이름: ${name}, 질문: ${category}, 카드: ${cardsText}를 리딩해주세요.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "우주의 기운이 잠시 끊겼습니다. 다시 시도해주세요.";
  }
}