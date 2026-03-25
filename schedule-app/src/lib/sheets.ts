import { google } from "googleapis";

const SPREADSHEET_ID = "1L70Kqo-LgO5JCmCuCWNGu5Q3CRDvNwXbqj8uQQmyGOo";
// Google Sheets A1 표기: 한글 시트명은 작은따옴표로 감쌈
const RANGE = "'근무상황신청'!A2:F100";

function getPrivateKey(): string {
  const key = process.env.GOOGLE_PRIVATE_KEY ?? "";
  return key.replace(/\\n/g, "\n");
}

export async function fetchSheetRows(): Promise<string[][]> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!email || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL 또는 GOOGLE_PRIVATE_KEY가 설정되지 않았습니다."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const values = res.data.values;
  if (!values || !Array.isArray(values)) return [];

  return values.map((row) => row.map((cell) => String(cell ?? "")));
}
