export type ScheduleEvent = {
  name: string;
  kind: string;
  dateKey: string; // YYYY-MM-DD
  dateDisplay: string; // 2026.03.17
  timeRange: string | null;
};

const NAME_IN_PARENS = /\((.+?)\)/;

/** F열: "2026.03.17.(09:00~14:00)" → 날짜 + 선택적 시간 */
export function parseFColumn(raw: string): {
  dateKey: string;
  dateDisplay: string;
  timeRange: string | null;
} | null {
  const s = raw.trim();
  if (!s) return null;

  const dateMatch = s.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (!dateMatch) return null;

  const [, y, mo, d] = dateMatch;
  const dateKey = `${y}-${mo}-${d}`;
  const dateDisplay = `${y}.${mo}.${d}`;

  const paren = s.match(/\(([^)]+)\)/);
  const timeRange = paren ? paren[1].trim() : null;

  return { dateKey, dateDisplay, timeRange };
}

/** C열: "근무상황신청(홍길동)" → 홍길동 */
export function extractNameFromC(raw: string): string | null {
  const m = raw.match(NAME_IN_PARENS);
  return m ? m[1].trim() : null;
}

/** 행: [A,B,C,D,E,F] — C,E,F 모두 비어 있으면 스킵 */
export function rowIsEmpty(row: string[]): boolean {
  const c = (row[2] ?? "").trim();
  const e = (row[4] ?? "").trim();
  const f = (row[5] ?? "").trim();
  return !c && !e && !f;
}

export function parseRow(row: string[]): ScheduleEvent | null {
  if (rowIsEmpty(row)) return null;

  const c = row[2] ?? "";
  const e = (row[4] ?? "").trim();
  const f = row[5] ?? "";

  if (!e) return null;

  const name = extractNameFromC(c);
  if (!name) return null;

  const parsed = parseFColumn(f);
  if (!parsed) return null;

  return {
    name,
    kind: e,
    dateKey: parsed.dateKey,
    dateDisplay: parsed.dateDisplay,
    timeRange: parsed.timeRange,
  };
}
