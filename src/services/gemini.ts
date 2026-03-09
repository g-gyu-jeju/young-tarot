import { GoogleGenAI } from "@google/genai";

// 1. TypeScript 에러를 방지하면서 API 키를 안전하게 가져옵니다.
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI(apiKey);

export async function getTarotReading(
  name: string,
  birthDate: string,
  birthTime: string,
  calendarType: string,
  category: string,
  drawnCards: { name: string; isReversed: boolean }[]
) {
  const cardsText = `
[과거]
1. ${drawnCards[0].name} (${drawnCards[0].isReversed ? '역방향' : '정방향'})
2. ${drawnCards[1].name} (${drawnCards[1].isReversed ? '역방향' : '정방향'})

[현재]
3. ${drawnCards[2].name} (${drawnCards[2].isReversed ? '역방향' : '정방향'})
4. ${drawnCards[3].name} (${drawnCards[3].isReversed ? '역방향' : '정방향'})

[미래]
5. ${drawnCards[4].name} (${drawnCards[4].isReversed ? '역방향' : '정방향'})
6. ${drawnCards[5].name} (${drawnCards[5].isReversed ? '역방향' : '정방향'})
`;

  const prompt = `
당신은 최고의 타로마스터입니다. 다음 정보를 바탕으로 상세한 리딩을 제공하세요.
이름: ${name}, 카테고리: ${category}
뽑은 카드: ${cardsText}
마크다운 형식으로 작성하고, 강조할 단어는 **단어** 형태를 유지하세요.
`;

  try {
    // 2. 모델 설정 부분을 최신 방식에 맞게 수정했습니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "죄송합니다. 우주의 기운을 읽는 도중 오류가 발생했습니다. 다시 시도해주세요.";
  }
}