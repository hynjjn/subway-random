/**
 * 뽑기 결과를 URL 쿼리에 담아 공유한다. (백엔드/DB 없음)
 *   ?s=<역코드>&t=<unix초>
 * 데이터가 작아 링크 자체에 결과를 통째로 인코딩한다.
 */

export type PickResult = {
  code: string;
  /** 뽑은 시각 (ms) */
  at: number;
};

export function encodeResult(r: PickResult): string {
  const p = new URLSearchParams();
  p.set("s", r.code);
  p.set("t", Math.floor(r.at / 1000).toString());
  return p.toString();
}

export function decodeResult(search: string): PickResult | null {
  const p = new URLSearchParams(search);
  const code = p.get("s");
  const t = p.get("t");
  if (!code) return null;
  const sec = t ? Number(t) : NaN;
  return {
    code,
    at: Number.isFinite(sec) ? sec * 1000 : Date.now(),
  };
}

export function shareUrl(r: PickResult): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return `${base}?${encodeResult(r)}`;
}

export function formatAt(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
