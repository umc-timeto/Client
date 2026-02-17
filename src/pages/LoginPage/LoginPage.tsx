import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import kakaoIcon from "@/assets/kakao.svg";
import logoAnimation from "@/assets/logo.mp4";
import timetoText from "@/assets/timeto_text.svg";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const [phase, setPhase] = useState<"playing" | "reveal">("playing");
  const [ctaIn, setCtaIn] = useState(false);

  const fallbackTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ctaTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!logoAnimation) {
      setPhase("reveal");
      setCtaIn(true);
      return;
    }

    setPhase("playing");
    setCtaIn(false);

    const isGif = /\.gif($|\?)/i.test(logoAnimation);

    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (ctaTimerRef.current) {
      window.clearTimeout(ctaTimerRef.current);
      ctaTimerRef.current = null;
    }

    if (isGif) {
      fallbackTimerRef.current = window.setTimeout(() => {
        setPhase("reveal");
      }, 900);
    }

    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (ctaTimerRef.current) {
        window.clearTimeout(ctaTimerRef.current);
        ctaTimerRef.current = null;
      }
    };
  }, [logoAnimation]);

  const onLogoAnimEnded = useCallback(() => {
    setPhase("reveal");
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;

    if (ctaTimerRef.current) {
      window.clearTimeout(ctaTimerRef.current);
      ctaTimerRef.current = null;
    }

    ctaTimerRef.current = window.setTimeout(() => {
      setCtaIn(true);
    }, 220);

    return () => {
      if (ctaTimerRef.current) {
        window.clearTimeout(ctaTimerRef.current);
        ctaTimerRef.current = null;
      }
    };
  }, [phase]);

  const authorizeUrl = useMemo(() => {
    const v = import.meta.env.VITE_KAKAO_AUTHORIZE_URL as string | undefined;
    return v?.trim() ?? "";
  }, []);

  const canLogin = authorizeUrl.length > 0;


  const onClickKakaoLogin = useCallback(async () => {
    console.log("[LOGIN] click kakao login", { isLoading, canLogin, authorizeUrl });

    if (isLoading) return;
    if (!canLogin) {
      console.log("[LOGIN] missing authorize url", {
        raw: import.meta.env.VITE_KAKAO_AUTHORIZE_URL,
        authorizeUrl,
      });
      alert("카카오 로그인 설정이 필요합니다.");
      return;
    }

    try {
      setIsLoading(true);
      window.location.href = authorizeUrl;
    } catch {
      setIsLoading(false);
    }
  }, [canLogin, isLoading, authorizeUrl]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto w-full px-7">
        <div className="h-dvh relative">
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div
              className={[
                "tt-logo-stage",
                phase === "reveal" ? "tt-logo-stage--reveal" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="tt-brand">
                <div
                  className={[
                    "tt-logo-mark-wrap",
                    phase === "reveal" ? "tt-logo-mark-wrap--reveal" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="tt-logo-mark">
                    {logoAnimation ? (
                      /\.gif($|\?)/i.test(logoAnimation) ? (
                        <img
                          src={logoAnimation}
                          alt="timeto 로고 애니메이션"
                          className="tt-logo-media"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          className="tt-logo-media"
                          src={logoAnimation}
                          autoPlay
                          muted
                          playsInline
                          preload="auto"
                          onLoadedMetadata={() => {
                            const v = videoRef.current;
                            if (v) {
                              v.play().catch(() => {});
                              const ms = Number.isFinite(v.duration)
                                ? Math.max(300, Math.round(v.duration * 1000) + 50)
                                : 900;
                              if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
                              fallbackTimerRef.current = window.setTimeout(() => setPhase("reveal"), ms);
                            }
                          }}
                          onEnded={onLogoAnimEnded}
                        />
                      )
                    ) : (
                      <div className="h-31 w-32.75 rounded-lg bg-black/10" />
                    )}
                  </div>
                </div>

                <img src={timetoText} alt="timeto" className="tt-logo-text" />
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`absolute z-20 pointer-events-auto left-0 right-0 bottom-17 w-full rounded-md bg-kakao-bg disabled:opacity-50 py-3.75 tt-cta ${ctaIn ? "tt-cta--in" : ""}`}
            onClick={onClickKakaoLogin}
            disabled={!canLogin || isLoading}
          >
            <div className="flex items-center justify-center gap-2">
              <img src={kakaoIcon} alt="카카오 아이콘" className="h-4.5 w-4.5" />
              <span className="title-14-normal text-black/85">{isLoading ? "로그인 중…" : "카카오 로그인"}</span>
            </div>
          </button>

          <style>
            {`
              .tt-logo-stage {
                position: absolute;
                left: 50%;
                top: 236px;
                transform: translate3d(-50%, 0, 0);
                will-change: transform;
              }

              .tt-brand {
                position: relative;
                width: 256px;
                height: 124px;
              }

              .tt-logo-mark-wrap {
                position: absolute;
                top: 0;
                left: 63px;
                transform: translate3d(0, 0, 0);
                transition: transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1);
                will-change: transform;
              }
              .tt-logo-mark-wrap--reveal {
                transform: translate3d(-62.5px, 0, 0);
              }

              .tt-logo-mark {
                width: 131px;
                height: 124px;
                display: grid;
                place-items: center;
              }
              .tt-logo-media {
                width: 131px;
                height: 124px;
                object-fit: contain;
                display: block;
              }

              .tt-logo-text {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate3d(0, -50%, 0);
                height: 30px;
                width: auto;
                display: block;
                opacity: 0;
                transition: opacity 1400ms cubic-bezier(0.33, 1, 0.68, 1);
                will-change: opacity;
              }
              .tt-logo-stage--reveal .tt-logo-text {
                opacity: 1;
              }

              .tt-cta {
                opacity: 0;
                transition: opacity 1400ms cubic-bezier(0.33, 1, 0.68, 1);
                will-change: opacity;
                pointer-events: none;
              }
              .tt-cta--in {
                opacity: 1;
                pointer-events: auto;
                transition-delay: 0ms;
              }

              @media (prefers-reduced-motion: reduce) {
                .tt-logo-text {
                  transition: none !important;
                  opacity: 1 !important;
                }
                .tt-cta {
                  transition: none !important;
                  opacity: 1 !important;
                  pointer-events: auto !important;
                }
                .tt-logo-mark-wrap {
                  transition: none !important;
                  transform: translate3d(-62.5px, 0, 0) !important;
                }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
}