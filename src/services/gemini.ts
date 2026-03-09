import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getTarotReading(
  name: string,
  birthDate: string,
  birthTime: string,
  calendarType: string,
  category: string,
  drawnCards: { name: string, isReversed: boolean }[]
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
다음 정보를 바탕으로 타로 리딩을 진행해주세요.

이름: ${name}
생년월일: ${birthDate}
태어난 시: ${birthTime}
양력/음력: ${calendarType}
질문 카테고리: ${category}

뽑은 카드:
${cardsText}

당신은 '영타로(Young Tarot)'에 아주 정통한 최고의 타로마스터입니다.
사용자의 정보와 질문 카테고리, 그리고 사용자가 직접 뽑은 6장의 카드를 바탕으로 심도 있고 통찰력 있는 타로 리딩을 제공합니다.
첫번째와 두번째 카드는 과거, 세번째와 네번째 카드는 현재, 다섯번째와 여섯번째 카드는 미래를 나타냅니다.

특히 미래(5, 6번째 카드)를 해석할 때는 다음 세 가지 시기로 나누어서 구체적으로 설명해주세요:
1) 가까운 미래 (1년 이내)
2) 다가오는 미래 (1년~3년)
3) 먼 미래 (3년 이상)

각 카드의 의미(정/역방향 포함)를 질문과 연결하여 해석해주고, 마지막에 따뜻하고 명확한 조언을 덧붙여주세요.
결과는 마크다운 형식으로 예쁘게 작성해주세요.

주의사항:
1. 리딩을 시작할 때 뽑은 카드 목록을 다시 나열하지 말고, 바로 [과거], [현재], [미래]에 대한 해석과 조언을 제공해주세요.
2. 강조하고 싶은 단어는 반드시 \`**단어**\` 형태로 띄어쓰기나 이스케이프 문자(\\) 없이 정확히 작성하세요. 화면에 별표(**) 기호가 그대로 노출되지 않고 깔끔한 볼드체로만 보여야 합니다.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "당신은 영타로 전문가입니다. 신비롭고 따뜻하며 통찰력 있는 어조로 답변하세요.",
    },
  });

  return response.text;
}

