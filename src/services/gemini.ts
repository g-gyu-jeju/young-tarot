import { GoogleGenAI } from "@google/genai";

declare const process: { env?: Record<string, string | undefined> } | undefined;

// In this project, Vite injects GEMINI_API_KEY via `vite.config.ts`:
// `define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }`
// so `process.env.GEMINI_API_KEY` becomes a string literal at build time.
const apiKey =
  (process?.env?.GEMINI_API_KEY ?? "").trim() ||
  (
    import.meta as unknown as {
      env?: Record<string, string | undefined>;
    }
  ).env?.VITE_GEMINI_API_KEY?.trim() ||
  "";

const genAI = new GoogleGenAI({ apiKey });

const DEFAULT_MODEL_CANDIDATES = [
  // 2026 기준 최신 라인업 우선
  "gemini-2.0-flash",
  // 일부 프로젝트/키에서 lite만 열려있는 경우 대비
  "gemini-2.0-flash-lite",
  // 구버전 호환용 (가끔 살아있을 수 있음)
  "gemini-1.5-flash",
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function looksLikeModelNotFound(msg: string) {
  const lower = msg.toLowerCase();
  return (
    lower.includes('"code":404') ||
    lower.includes("not_found") ||
    lower.includes("is not found for api version") ||
    lower.includes("not supported for generatecontent")
  );
}

function looksLikeQuotaExceeded(msg: string) {
  const lower = msg.toLowerCase();
  return (
    lower.includes('"code":429') ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  );
}

type DrawnCard = { name: string; isReversed: boolean; id?: string };

const CATEGORY_CONTEXT: Record<
  string,
  { focus: string; doMore: string; beCareful: string; keyQuestion: string }
> = {
  연애: {
    focus: "감정의 흐름, 관계의 균형, 대화의 온도",
    doMore: "솔직하지만 부드러운 표현, 경계와 배려의 균형, 타이밍을 맞춘 행동",
    beCareful: "상대 의도 추측, 감정 과잉, 과거의 상처를 현재에 투사하는 습관",
    keyQuestion: "내가 원하는 사랑의 형태는 무엇이고, 지금 그 방향으로 움직이고 있는가?",
  },
  금전: {
    focus: "현금흐름, 지출 습관, 장기적 안정",
    doMore: "예산을 보수적으로 잡고, 작은 수입원을 늘리며, 위험을 분산",
    beCareful: "충동구매, 과도한 레버리지, 단기 수익에 대한 집착",
    keyQuestion: "지금 돈이 새는 구멍은 어디이며, 한 가지 습관을 바꾸면 무엇이 달라질까?",
  },
  가족: {
    focus: "서로의 역할과 기대, 정서적 안전감, 갈등의 해소",
    doMore: "감정 확인, 책임 분담의 재조정, 함께하는 일상의 루틴 만들기",
    beCareful: "말하지 않아도 알겠지라는 기대, 오래된 서운함의 누적, 일방적 희생",
    keyQuestion: "가족 안에서 내가 지키고 싶은 경계는 무엇이며, 그걸 어떻게 전달할까?",
  },
  커리어: {
    focus: "성장 방향, 역량의 확장, 평판과 성과의 연결",
    doMore: "작은 성과를 빠르게 쌓고, 배우는 속도를 높이며, 협업의 신뢰를 강화",
    beCareful: "완벽주의로 인한 지연, 소진, 관계에서의 불필요한 경쟁",
    keyQuestion: "다음 한 단계로 가기 위해 가장 먼저 강화해야 할 역량은 무엇인가?",
  },
  이직: {
    focus: "이동의 타이밍, 조건 협상, 리스크 관리",
    doMore: "포트폴리오/이력서 정교화, 시장 탐색, 면접 커뮤니케이션 연습",
    beCareful: "감정적 퇴사, 준비 없는 결단, 단기 연봉만 보고 판단",
    keyQuestion: "지금의 불만은 ‘회사’의 문제인가 ‘직무/환경’의 문제인가?",
  },
};

const MAJOR_KEYWORDS: Record<string, { up: string; rev: string }> = {
  ar00: { up: "새로운 시작, 자유, 가능성", rev: "무모함, 준비 부족, 방향 상실" },
  ar01: { up: "의지, 구현, 주도권", rev: "능력 불신, 꼼수, 집중력 분산" },
  ar02: { up: "직관, 내면의 지혜, 비밀", rev: "혼란, 직감 무시, 불안" },
  ar03: { up: "풍요, 성장, 돌봄", rev: "과보호, 정체, 에너지 고갈" },
  ar04: { up: "질서, 책임, 안정", rev: "통제 과잉, 경직, 권위 충돌" },
  ar05: { up: "전통, 배움, 조언", rev: "고정관념, 규칙 거부, 갈등" },
  ar06: { up: "선택, 사랑, 조화", rev: "갈등, 우유부단, 관계 불균형" },
  ar07: { up: "전진, 승리, 추진력", rev: "방향 재조정, 과속, 통제 상실" },
  ar08: { up: "용기, 인내, 온화한 힘", rev: "자기비난, 조급함, 감정 폭발" },
  ar09: { up: "성찰, 고독, 통찰", rev: "고립, 냉소, 지나친 경계" },
  ar10: { up: "변화, 전환점, 흐름", rev: "불운감, 반복, 흐름 저항" },
  ar11: { up: "균형, 공정, 판단", rev: "불균형, 책임 회피, 오해" },
  ar12: { up: "멈춤, 관점 전환, 수용", rev: "지연, 집착, 불필요한 희생" },
  ar13: { up: "끝과 시작, 정리, 변형", rev: "미련, 변화 거부, 지연된 종결" },
  ar14: { up: "절제, 조율, 회복", rev: "극단, 과소비, 조절 실패" },
  ar15: { up: "욕망, 유혹, 집착", rev: "해방, 각성, 끊어내기" },
  ar16: { up: "붕괴, 진실, 리셋", rev: "충격 회피, 미봉책, 불안정" },
  ar17: { up: "희망, 치유, 영감", rev: "기대 저하, 의심, 무기력" },
  ar18: { up: "무의식, 감정의 파도, 직감", rev: "불안, 오해, 현실 회피" },
  ar19: { up: "명료함, 자신감, 활력", rev: "에너지 저하, 과신, 피로" },
  ar20: { up: "각성, 결단, 재평가", rev: "미련, 자기기만, 결단 지연" },
  ar21: { up: "완성, 통합, 성취", rev: "마무리 부족, 목표 재설정" },
};

const SUIT_KEYWORDS: Record<string, { name: string; up: string; rev: string }> = {
  wa: { name: "지팡이", up: "열정, 행동, 도전", rev: "의욕 저하, 충동, 방향 상실" },
  cu: { name: "컵", up: "감정, 관계, 공감", rev: "감정 과부하, 오해, 단절" },
  sw: { name: "검", up: "사고, 판단, 진실", rev: "갈등, 과잉분석, 말의 상처" },
  pe: { name: "펜타클", up: "현실, 돈, 건강", rev: "지연, 불안정, 낭비" },
};

const RANK_KEYWORDS: Record<string, { up: string; rev: string }> = {
  "01": { up: "시작의 씨앗, 기회", rev: "불씨 약함, 망설임" },
  "02": { up: "균형, 선택, 조율", rev: "갈등, 우유부단" },
  "03": { up: "확장, 협력, 진전", rev: "지연, 조율 실패" },
  "04": { up: "안정, 기반, 쉼", rev: "정체, 불안정" },
  "05": { up: "시험, 경쟁, 마찰", rev: "갈등 완화, 회피" },
  "06": { up: "전진, 성과, 도움", rev: "지연, 보답 부족" },
  "07": { up: "평가, 기다림, 전략", rev: "조급함, 방향 수정" },
  "08": { up: "속도, 몰입, 진척", rev: "정체, 산만" },
  "09": { up: "경계, 끈기, 준비", rev: "피로, 방어 과잉" },
  "10": { up: "완성, 부담, 결과", rev: "과부하 해소, 내려놓기" },
  "11": { up: "소식, 학습, 호기심", rev: "미성숙, 소문" },
  "12": { up: "추진, 이동, 결단", rev: "무리, 충돌" },
  "13": { up: "성숙, 돌봄, 내공", rev: "감정 소진, 냉소" },
  "14": { up: "리더십, 책임, 통제", rev: "완고함, 독단" },
};

function stripKoreanCardName(full: string) {
  return full.split(" (")[0].trim();
}

function inferKeywords(card: DrawnCard) {
  const id = card.id ?? "";
  const prefix = id.slice(0, 2);
  const num = id.slice(2);

  if (prefix === "ar" && MAJOR_KEYWORDS[id]) {
    const kw = card.isReversed ? MAJOR_KEYWORDS[id].rev : MAJOR_KEYWORDS[id].up;
    return { group: "메이저", keywords: kw };
  }

  const suit = SUIT_KEYWORDS[prefix];
  const rank = RANK_KEYWORDS[num];
  if (suit && rank) {
    const suitKw = card.isReversed ? suit.rev : suit.up;
    const rankKw = card.isReversed ? rank.rev : rank.up;
    return { group: suit.name, keywords: `${suitKw} · ${rankKw}` };
  }

  return { group: "타로", keywords: card.isReversed ? "흐름의 지연, 재점검" : "흐름의 진전, 기회" };
}

function ensureMinChars(text: string, minChars: number, fillers: string[]) {
  let out = text;
  let i = 0;
  const count = () => out.replace(/\s+/g, "").length;
  while (count() < minChars && i < fillers.length) {
    out += `\n\n${fillers[i++]}`;
  }
  // 마지막 안전장치: 그래도 부족하면 반복문으로 짧은 문단을 덧붙임
  let guard = 0;
  while (count() < minChars && guard < 10) {
    out +=
      "\n\n- 추가 조언: 지금은 ‘완벽한 결론’보다 **작게 실행하고 피드백을 받는 흐름**이 중요합니다. 감정과 현실을 분리해 적어보고, 한 번에 하나씩 정리해 보세요.";
    guard++;
  }
  return out;
}

function buildOfflineKoreanReading(opts: {
  name: string;
  category: string;
  drawnCards: DrawnCard[];
  reason: "no_api_key" | "quota" | "error";
}) {
  const { name, category, drawnCards, reason } = opts;
  const ctx = CATEGORY_CONTEXT[category] ?? {
    focus: "상황의 흐름, 선택의 기준, 실행의 우선순위",
    doMore: "현실 점검과 작은 실행, 대화의 명료화, 습관 개선",
    beCareful: "감정적 결론, 과도한 걱정, 미루기",
    keyQuestion: "지금 내게 필요한 한 가지 변화는 무엇인가?",
  };

  const c0 = drawnCards[0];
  const c1 = drawnCards[1];
  const c2 = drawnCards[2];
  const c3 = drawnCards[3];
  const c4 = drawnCards[4];
  const c5 = drawnCards[5];
  const c6 = drawnCards[6];
  const c7 = drawnCards[7];

  const note =
    reason === "quota"
      ? "현재 Gemini 쿼터/요금 제한으로 **오프라인 한글 리딩**으로 자동 생성했습니다."
      : reason === "no_api_key"
        ? "Gemini API 키가 없어 **오프라인 한글 리딩**으로 자동 생성했습니다."
        : "Gemini 호출 오류로 **오프라인 한글 리딩**으로 자동 생성했습니다.";

  const intro = [
    `## ${name}님의 타로 리딩`,
    `- 질문 카테고리: **${category}**`,
    `- 해석 포커스: ${ctx.focus}`,
    `- 안내: ${note}`,
    "",
  ].join("\n");

  const sectionTemplate = (title: string, body: string) =>
    `### [${title}]\n\n${body}`;

  const cardBlock = (card: DrawnCard | undefined, label: string) => {
    if (!card) return `- **${label}**: 카드 정보가 없습니다.`;
    const direction = card.isReversed ? "역방향" : "정방향";
    const cleanName = stripKoreanCardName(card.name);
    const kw = inferKeywords(card);
    return [
      `- **${cleanName}** (${direction})`,
      `  - 핵심 키워드: ${kw.keywords}`,
      `  - 관점: ${label}에서 이 카드는 ${card.isReversed ? "흐름이 막힌 지점/재조정 포인트" : "흐름이 열리는 지점/기회"}를 보여줍니다.`,
    ].join("\n");
  };

  const longNarrativeForTwo = (a?: DrawnCard, b?: DrawnCard, when = "이 시기") => {
    const aName = a ? stripKoreanCardName(a.name) : "첫 카드";
    const bName = b ? stripKoreanCardName(b.name) : "둘째 카드";
    const aKw = a ? inferKeywords(a).keywords : "핵심 흐름";
    const bKw = b ? inferKeywords(b).keywords : "보조 흐름";

    const paragraphs: string[] = [];
    paragraphs.push(
      `${when}의 핵심은 **${aName}(${aKw})**와 **${bName}(${bKw})**가 함께 만든 ‘흐름의 방향’에 있습니다. 지금까지의 선택과 반응이 어떤 패턴을 만들었는지, 그리고 그 패턴이 앞으로의 행동에 어떤 비용(시간/감정/돈)을 요구하는지 점검하는 것이 우선입니다. 특히 **${category}**에서는 ‘내가 통제할 수 있는 것’과 ‘상대/환경의 변수’를 분리해야 해요. 통제 불가능한 부분에 에너지를 쓰면 소진이 빨라지고, 통제 가능한 부분(습관, 대화 방식, 루틴, 준비도)을 바꾸는 속도는 느려집니다.`
    );
    paragraphs.push(
      `첫 번째 카드는 대체로 **원인과 배경**을, 두 번째 카드는 **그 결과로 형성된 현재의 기류**를 강화합니다. ${a ? (a.isReversed ? "역방향이라면 ‘막힘/지연/불안정’이 반복되는 지점" : "정방향이라면 ‘길이 열리는 지점’") : ""}을 보며, ${b ? (b.isReversed ? "두 번째 카드의 역방향은 ‘대안이 있지만 바로 쓰기 어려운 상태’" : "두 번째 카드의 정방향은 ‘실행하면 바로 반응이 오는 상태’") : ""}를 뜻합니다. 여기서 중요한 건 예언처럼 ‘정답’을 맞히는 게 아니라, **내가 움직였을 때 결과가 바뀌는 레버(지렛대)가 무엇인지 찾는 것**이에요.`
    );
    paragraphs.push(
      `실천 팁을 간단히 정리하면, ${ctx.doMore}를 의식적으로 늘리고, ${ctx.beCareful}을 줄이는 쪽으로 한 주 단위의 작은 실험을 해보세요. 예를 들어 ‘말을 바꾸기’(정서→사실→요청의 순서로 말하기), ‘기록하기’(감정/사실/해석 분리), ‘돈/시간/체력’의 최소 기준을 정해두는 것이 효과적입니다. 이 시기의 과제는 **크게 바꾸는 결단**보다 **작게 바꾸는 습관**에 더 가깝습니다.`
    );
    paragraphs.push(
      `마지막으로 ${ctx.keyQuestion} 이 질문을 오늘부터 7일만 매일 적어보세요. 답이 바뀌는 지점이 곧 ‘당신의 현실’이 바뀌는 지점입니다.`
    );
    return paragraphs.join("\n\n");
  };

  const longNarrativeForOne = (card?: DrawnCard, when = "이 구간") => {
    const name = card ? stripKoreanCardName(card.name) : "이 카드";
    const kw = card ? inferKeywords(card).keywords : "핵심 메시지";
    const dir = card ? (card.isReversed ? "역방향" : "정방향") : "";

    const p: string[] = [];
    p.push(
      `${when}는 **${name}**(${dir})의 메시지가 전면에 나옵니다. 키워드는 **${kw}**이고, 이는 ${category}에서 ‘무엇을 늘리고 무엇을 줄일지’를 구체화하라는 신호예요. 정방향이라면 기회가 이미 열려 있으니 작은 실행이 큰 반응을 만들 수 있고, 역방향이라면 실행 자체보다 **준비/정리/감정 정돈**이 먼저입니다.`
    );
    p.push(
      `이 구간에서 가장 중요한 건 ‘불안을 줄이는 구조’를 만드는 것입니다. 불안은 정보 부족에서 오기도 하지만, 더 자주 **루틴 부재**에서 와요. 시간을 정해두고(예: 하루 20분), 한 가지 행동만 반복해도 흐름이 안정됩니다. ${category}의 관점에서 보면, ${ctx.focus}를 기준으로 체크리스트를 만들고, 매주 한 번 점검하는 것이 특히 도움이 됩니다.`
    );
    p.push(
      `실천 체크리스트 예시를 드리면 아래처럼 정리할 수 있어요.\n- **오늘 할 일**: 작은 행동 1개만 선택해 바로 실행\n- **이번 주 할 일**: 결과를 기록하고, 잘된 점 1개/아쉬운 점 1개를 남김\n- **이번 달 할 일**: 반복되는 패턴 1개를 끊기 위한 규칙(경계/예산/시간)을 설정\n\n이렇게 하면 ${when}의 메시지를 ‘운’이 아니라 **습관과 결정의 결과**로 바꿀 수 있습니다.`
    );
    return p.join("\n\n");
  };

  const pastBody = [
    "**요약**: 과거는 지금의 패턴이 만들어진 배경과 ‘무의식적 습관’을 보여줍니다.",
    "",
    "#### 카드 해석",
    cardBlock(c0, "과거 1"),
    cardBlock(c1, "과거 2"),
    "",
    "#### 흐름의 이야기",
    longNarrativeForTwo(c0, c1, "과거"),
    "",
    "#### 이번 파트의 조언",
    `- **늘릴 것**: ${ctx.doMore}\n- **줄일 것**: ${ctx.beCareful}\n- **핵심 질문**: ${ctx.keyQuestion}`,
  ].join("\n");

  const presentBody = [
    "**요약**: 현재는 ‘지금 당장 바꿀 수 있는 것’과 ‘대화/행동의 우선순위’를 알려줍니다.",
    "",
    "#### 카드 해석",
    cardBlock(c2, "현재 1"),
    cardBlock(c3, "현재 2"),
    "",
    "#### 흐름의 이야기",
    longNarrativeForTwo(c2, c3, "현재"),
    "",
    "#### 이번 파트의 조언",
    `- **오늘의 실행**: 한 가지 행동만 정해서 20분 투자\n- **관계/업무/돈의 기준**: ‘최소 기준’을 문장으로 적어두기\n- **피해야 할 함정**: ${ctx.beCareful}`,
  ].join("\n");

  const nearFutureBody = [
    "**요약**: 가까운 미래(1년 미만)는 변화가 가장 빠르게 체감되는 구간입니다. 작은 선택이 큰 분기점이 될 수 있어요.",
    "",
    "#### 카드 해석",
    cardBlock(c4, "가까운 미래"),
    "",
    "#### 흐름의 이야기",
    longNarrativeForOne(c4, "가까운 미래(1년 미만)"),
    "",
    "#### 이번 파트의 조언",
    `- **우선순위**: ‘가장 중요한 1개’를 먼저 끝내기\n- **속도 조절**: 빠르게 움직이되, 기록으로 안정화\n- **확인 질문**: 지금의 선택이 3개월 뒤 나를 더 편하게 만드는가?`,
  ].join("\n");

  const comingFutureBody = [
    "**요약**: 다가오는 미래(1년~3년)는 기반을 굳히고, 선택의 결과가 구조로 남는 구간입니다.",
    "",
    "#### 카드 해석",
    cardBlock(c5, "다가오는 미래"),
    "",
    "#### 흐름의 이야기",
    longNarrativeForOne(c5, "다가오는 미래(1년~3년)"),
    "",
    "#### 이번 파트의 조언",
    `- **구조 만들기**: 시간/돈/관계의 ‘규칙’을 하나 정해 유지\n- **성장 전략**: 잘하는 것 1개를 깊게, 부족한 것 1개를 꾸준히\n- **주의점**: 감정으로 결론 내리지 말고 데이터(기록)로 판단`,
  ].join("\n");

  const farFutureBody = [
    "**요약**: 먼 미래(3년 이상)는 ‘상황의 예언’이라기보다, 지금의 습관이 누적될 때 만들어지는 **삶의 방향성**을 보여줍니다.",
    "",
    "#### 종합 메시지(미래 카드 2장의 공통 흐름)",
    `${c6 && c7 ? `- **${stripKoreanCardName(c6.name)}**와 **${stripKoreanCardName(c7.name)}**가 공통으로 말하는 건, ${category}에서 ‘선택의 기준’을 명확히 세워야 한다는 점입니다. ` : ""}` +
      `지금부터 3년은 생각보다 빨리 오기 때문에, ‘한 번의 큰 결단’보다 ‘작은 규칙의 반복’이 더 큰 차이를 만듭니다.`,
    "",
    "#### 흐름의 이야기",
    longNarrativeForTwo(c6, c7, "먼 미래(3년 이상)"),
    "",
    "#### 이번 파트의 조언",
    `- **장기 전략**: 삶의 에너지(시간/체력/돈)를 어디에 투자할지 3줄로 선언문 작성\n- **관계/일/돈 정리**: 남기는 것 3개, 버리는 것 3개를 정하기\n- **핵심**: ${ctx.keyQuestion}`,
  ].join("\n");

  const fillersCommon = [
    `#### 더 깊은 해석 포인트\n지금 리딩에서 중요한 건 ‘외부 변수를 통제하려는 노력’을 줄이고, **내가 바꿀 수 있는 선택(말, 행동, 루틴, 준비도)**에 집중하는 것입니다. 특히 ${category}에서는 작은 실행이 누적될수록 불안을 줄이고, 결과의 재현 가능성을 높입니다. 오늘은 결과를 ‘해석’만 하지 말고, 문장 하나라도 행동으로 옮겨보세요.`,
    `#### 실천 루틴(7일)\n- 1일차: 현재 상황을 사실/감정/해석으로 분리해 적기\n- 2일차: ${ctx.beCareful} 중 하나를 줄이기 위한 규칙 1개 만들기\n- 3일차: ${ctx.doMore} 중 하나를 늘릴 행동 1개 실행\n- 4일차: 결과 기록(좋은 점/아쉬운 점)\n- 5일차: 대화/결정의 기준 문장화\n- 6일차: 다음 주 계획(작은 실행 1개)\n- 7일차: 돌아보기(내가 통제 가능한 것 vs 불가능한 것)\n\n이 루틴은 리딩을 ‘운’이 아니라 **습관 설계**로 바꾸기 위한 장치입니다.`,
  ];

  const min = 700;
  const past = ensureMinChars(sectionTemplate("과거", pastBody), min, fillersCommon);
  const present = ensureMinChars(sectionTemplate("현재", presentBody), min, fillersCommon);
  const near = ensureMinChars(
    sectionTemplate("미래 1) 가까운 미래(1년 미만)", nearFutureBody),
    min,
    fillersCommon
  );
  const coming = ensureMinChars(
    sectionTemplate("미래 2) 다가오는 미래(1년~3년)", comingFutureBody),
    min,
    fillersCommon
  );
  const far = ensureMinChars(
    sectionTemplate("미래 3) 먼 미래(3년 이상)", farFutureBody),
    min,
    fillersCommon
  );

  const outro = [
    "### 마무리 조언",
    `- **핵심 문장**: “나는 통제 가능한 것을 늘리고, 통제 불가능한 것에 매달리지 않는다.”`,
    `- **오늘의 한 가지**: ${ctx.doMore.split(",")[0] ?? ctx.doMore}를 오늘 한 번만 실천해보세요.`,
    "",
  ].join("\n");

  return [intro, past, "", present, "", near, "", coming, "", far, "", outro].join("\n");
}

export async function getTarotReading(
  name: string,
  birthDate: string,
  birthTime: string,
  calendarType: string,
  category: string,
  drawnCards: DrawnCard[]
) {
  const cardsText = drawnCards.map((c, i) => `${i + 1}. ${c.name} (${c.isReversed ? '역방향' : '정방향'})`).join('\n');

  const prompt = [
    "당신은 최고의 타로 마스터입니다.",
    `이름: ${name}`,
    `생년월일: ${birthDate}`,
    `태어난 시: ${birthTime}`,
    `달력: ${calendarType}`,
    `질문 카테고리: ${category}`,
    "",
    "아래 카드 6장을 기반으로 타로 리딩을 작성하세요.",
    cardsText,
    "",
    "출력 규칙(매우 중요):",
    "- **반드시 한글로만** 작성 (영어 단어/문장 금지).",
    "- Markdown 형식 사용.",
    "- 섹션을 아래 5개로 나누기:",
    "  1) [과거]",
    "  2) [현재]",
    "  3) [미래 1) 가까운 미래(1년 미만)]",
    "  4) [미래 2) 다가오는 미래(1년~3년)]",
    "  5) [미래 3) 먼 미래(3년 이상)]",
    "- **각 섹션은 700자 이상** 작성.",
    "- 카드 배치:",
    "  - 과거: 1~2번 카드",
    "  - 현재: 3~4번 카드",
    "  - 가까운 미래(1년 미만): 5번 카드",
    "  - 다가오는 미래(1년~3년): 6번 카드",
    "  - 먼 미래(3년 이상): 7~8번 카드",
    "- 각 섹션에는 (a) 요약, (b) 해당 카드(들)을 연결한 해석, (c) 실천 조언/주의점을 포함.",
  ].join("\n");

  if (!apiKey) return buildOfflineKoreanReading({ name, category, drawnCards, reason: "no_api_key" });

  try {
    const modelFromEnv =
      (process?.env?.GEMINI_MODEL ?? "").trim() ||
      (
        import.meta as unknown as {
          env?: Record<string, string | undefined>;
        }
      ).env?.VITE_GEMINI_MODEL?.trim() ||
      "";

    const modelsToTry = [
      ...(modelFromEnv ? [modelFromEnv] : []),
      ...DEFAULT_MODEL_CANDIDATES,
    ];

    let lastError: unknown;
    for (const model of modelsToTry) {
      try {
        const result = await genAI.models.generateContent({
          model,
          contents: prompt,
        });
        const text = result.text ?? "";
        return text.trim() || buildOfflineKoreanReading({ name, category, drawnCards, reason: "error" });
      } catch (e) {
        lastError = e;
        const msg = getErrorMessage(e);
        if (looksLikeModelNotFound(msg)) continue;
        if (looksLikeQuotaExceeded(msg)) {
          return buildOfflineKoreanReading({ name, category, drawnCards, reason: "quota" });
        }
        throw e;
      }
    }

    const details = lastError ? `\n(오류: ${getErrorMessage(lastError)})` : "";
    return `모델을 찾지 못해 리딩에 실패했습니다. 사용 가능한 모델로 변경이 필요합니다.${details}\n\n${buildOfflineKoreanReading({ name, category, drawnCards, reason: "error" })}`;
  } catch (error) {
    const msg = getErrorMessage(error);
    if (looksLikeQuotaExceeded(msg)) {
      return buildOfflineKoreanReading({ name, category, drawnCards, reason: "quota" });
    }
    const details =
      error instanceof Error && error.message ? `\n(오류: ${error.message})` : "";
    return `${buildOfflineKoreanReading({ name, category, drawnCards, reason: "error" })}\n\n---\n\n(참고: Gemini 호출 오류가 발생했습니다. ${details})`;
  }
}