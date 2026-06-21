"use client";

import { useEffect, useMemo, useState } from "react";
import {
  STATIONS,
  LINES,
  lineColor,
  linesForName,
  findByCode,
  type Station,
} from "@/lib/stations";
import {
  decodeResult,
  shareUrl,
  formatAt,
  type PickResult,
} from "@/lib/share";

function LineBadge({ line }: { line: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: lineColor(line) }}
    >
      {line}
    </span>
  );
}

export default function Home() {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [transferOnly, setTransferOnly] = useState(false);
  const [result, setResult] = useState<{ station: Station; at: number } | null>(
    null
  );
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // 공유 링크로 들어온 경우: URL에서 결과 복원
  useEffect(() => {
    const r: PickResult | null = decodeResult(window.location.search);
    if (r) {
      const station = findByCode(r.code);
      if (station) {
        setResult({ station, at: r.at });
        setShared(true);
      }
    }
  }, []);

  const pool = useMemo(() => {
    return STATIONS.filter((s) => {
      if (transferOnly && !s.isTransfer) return false;
      if (selectedLines.size > 0 && !selectedLines.has(s.line)) return false;
      return true;
    });
  }, [selectedLines, transferOnly]);

  function toggleLine(line: string) {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }

  function roll() {
    if (pool.length === 0) return;
    setShared(false);
    setCopied(false);
    setRolling(true);
    // 짧은 셔플 애니메이션 후 확정
    let ticks = 0;
    const timer = setInterval(() => {
      const s = pool[Math.floor(Math.random() * pool.length)];
      setResult({ station: s, at: Date.now() });
      ticks += 1;
      if (ticks >= 12) {
        clearInterval(timer);
        const final = pool[Math.floor(Math.random() * pool.length)];
        const at = Date.now();
        setResult({ station: final, at });
        setRolling(false);
        // 공유 가능하도록 URL 갱신 (히스토리 오염 없이 replace)
        const url = shareUrl({ code: final.code, at });
        window.history.replaceState(null, "", url);
      }
    }, 60);
  }

  async function copyLink() {
    if (!result) return;
    const url = shareUrl({ code: result.station.code, at: result.at });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 클립보드 권한 없을 때 폴백: 주소창이 이미 공유 URL
      window.prompt("아래 링크를 복사하세요", url);
    }
  }

  async function nativeShare() {
    if (!result) return;
    const url = shareUrl({ code: result.station.code, at: result.at });
    const text = `🎲 ${result.station.name}역이 뽑혔어요!`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "지하철 랜덤뽑기", text, url });
      } catch {
        /* 사용자가 공유 취소 */
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            🎲 지하철 랜덤뽑기
          </h1>
        </header>

        {/* 결과 카드 */}
        <section
          className={`rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition dark:border-neutral-800 dark:bg-neutral-900 ${
            rolling ? "scale-[0.99]" : ""
          }`}
        >
          {result ? (
            <>
              <div className="flex flex-wrap justify-center gap-1.5">
                {linesForName(result.station.name).map((l) => (
                  <LineBadge key={l} line={l} />
                ))}
              </div>
              <div className="mt-3 text-4xl font-black tracking-tight">
                {result.station.name}
              </div>
              <div className="mt-1 text-sm text-neutral-400">
                {result.station.nameEn}
              </div>
              {/* {!rolling && (
                <div className="mt-3 text-xs text-neutral-400">
                  {shared ? "공유된 결과 · " : ""}
                  {formatAt(result.at)}
                </div>
              )} */}
            </>
          ) : (
            <div className="py-6 text-neutral-400">
              아래 버튼을 눌러 역을 뽑아보세요
            </div>
          )}
        </section>

        {/* 뽑기 버튼 */}
        <button
          onClick={roll}
          disabled={rolling || pool.length === 0}
          className="cursor-pointer rounded-2xl bg-neutral-900 py-4 text-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {rolling
            ? "뽑는 중..."
            : pool.length === 0
            ? "조건에 맞는 역이 없어요"
            : "랜덤 뽑기"}
        </button>

        
        {/* 공유 버튼 (after db integration) */}
        {/* {result && !rolling && (
          <div className="flex gap-2">
            <button
              onClick={nativeShare}
              className="flex-1 rounded-xl border border-neutral-300 py-3 text-sm font-semibold transition active:scale-[0.98] dark:border-neutral-700"
            >
              공유하기
            </button>
            <button
              onClick={copyLink}
              className="flex-1 rounded-xl border border-neutral-300 py-3 text-sm font-semibold transition active:scale-[0.98] dark:border-neutral-700"
            >
              {copied ? "복사됨 ✓" : "링크 복사"}
            </button>
          </div>
        )}  */}

        {result && (
          <div className="flex gap-2">
            {rolling ? (
              <button
                className="flex flex-1 items-center justify-center rounded-xl border border-neutral-300 py-3 bg-neutral-200 text-neutral-500 text-sm font-semibold transition active:scale-[0.98] dark:border-neutral-700"
                // onClick={() => alert("뽑는 중입니다!")}
              >
                뽑는 중...
              </button>
            ) : (
              <a
                href={`https://map.naver.com/p/search/${encodeURIComponent(result.station.name + "역")}/subway-station/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center rounded-xl border border-neutral-300 py-3 text-sm font-semibold transition active:scale-[0.98] dark:border-neutral-700"
              >
                네이버 지도 ({result.station.name}역)
              </a>
            )}
          </div>
        )}


        {/* 필터 */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">필터</span>
            <span className="text-xs text-neutral-400">
              {selectedLines.size > 0 && (
                <button
                  onClick={() => setSelectedLines(new Set())}
                  className="underline cursor-pointer"
                >
                  {'초기화 '}
                </button>
              )}
              {'  '}
              {pool.length}개의 역
            </span>
          </div>

          <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={transferOnly}
              onChange={(e) => setTransferOnly(e.target.checked)}
              className="h-4 w-4 accent-neutral-900 dark:accent-white"
            />
            환승역만 뽑기
          </label>

          <div className="flex flex-wrap gap-1.5">
            {LINES.map((line) => {
              const on = selectedLines.has(line);
              return (
                <button
                  key={line}
                  onClick={() => toggleLine(line)}
                  className="rounded-full border px-2.5 py-1 text-xs font-semibold transition"
                  style={
                    on
                      ? {
                          backgroundColor: lineColor(line),
                          borderColor: lineColor(line),
                          color: "#fff",
                        }
                      : { borderColor: "#d4d4d4" }
                  }
                >
                  {line}
                </button>
              );
            })}
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-neutral-400">
          made by <u><a href="https://github.com/hynjjn">hynjjn</a></u>
        </footer>
      </div>
    </div>
  );
}
