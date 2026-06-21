import data from "@/data/stations.json";

export type Station = {
  /** 외부코드 (예: K325) — 공유 URL 식별자로 사용 */
  code: string;
  /** 내부코드 (전철역코드) — 보존용 */
  internalCode: string;
  name: string;
  nameEn: string;
  line: string;
  isTransfer: boolean;
};

export const STATIONS: Station[] = data.stations;
export const LINES: string[] = data.lines;

/** 서울/수도권 전철 노선별 대표 색상 */
export const LINE_COLORS: Record<string, string> = {
  "1호선": "#0052A4",
  "2호선": "#00A84D",
  "3호선": "#EF7C1C",
  "4호선": "#00A5DE",
  "5호선": "#996CAC",
  "6호선": "#CD7C2F",
  "7호선": "#747F00",
  "8호선": "#E6186C",
  "9호선": "#BDB092",
  "GTX-A": "#9A6292",
  경강선: "#003DA5",
  "경의·중앙선": "#77C4A3",
  경춘선: "#0C8E72",
  공항철도: "#0090D2",
  김포도시철도: "#AD8605",
  서해선: "#81A914",
  "수인·분당선": "#FABE00",
  신림선: "#6789CA",
  신분당선: "#D4003B",
  용인경전철: "#509F22",
  우이신설경전철: "#B0CE18",
  의정부경전철: "#FDA600",
  인천1호선: "#7CA8D5",
  인천2호선: "#ED8B00",
};

export function lineColor(line: string): string {
  return LINE_COLORS[line] ?? "#6b7280";
}

export function findByCode(code: string): Station | undefined {
  return STATIONS.find((s) => s.code === code);
}

/** 같은 이름(=환승역)의 모든 노선을 모아 반환 */
export function linesForName(name: string): string[] {
  return [...new Set(STATIONS.filter((s) => s.name === name).map((s) => s.line))];
}
