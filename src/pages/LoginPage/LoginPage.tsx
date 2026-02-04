import { useCallback, useMemo, useState } from "react";
import kakaoIcon from "@/assets/kakao.svg";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Auth: {
        authorize: (params: { redirectUri: string }) => void;
      };
    };
  }
}

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${KAKAO_SDK_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((window as Window).Kakao) resolve();
      else existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Kakao SDK"));
    document.head.appendChild(script);
  });
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const kakaoJsKey = useMemo(() => {
    const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined;
    return key?.trim() ?? "";
  }, []);

  const redirectUri = useMemo(() => {
    const uri = import.meta.env.VITE_KAKAO_REDIRECT_URI as string | undefined;
    return uri?.trim() ?? "";
  }, []);

  const canLogin = kakaoJsKey.length > 0 && redirectUri.length > 0;

  const onClickKakaoLogin = useCallback(async () => {
    if (isLoading) return;
    if (!canLogin) {
      alert("카카오 로그인 설정이 필요합니다.");
      return;
    }

    try {
      setIsLoading(true);
      await loadKakaoSdk();

      const Kakao = window.Kakao;
      if (Kakao) {
        if (!Kakao.isInitialized()) Kakao.init(kakaoJsKey);
        Kakao.Auth.authorize({ redirectUri });
        return;
      }

      const authorizeUrl =
        `https://kauth.kakao.com/oauth/authorize` +
        `?client_id=${encodeURIComponent(kakaoJsKey)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code`;

      window.location.href = authorizeUrl;
    } catch {
      setIsLoading(false);
    }
  }, [canLogin, isLoading, kakaoJsKey, redirectUri]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto w-full px-7">
        <div className="h-dvh relative">
          <button
            type="button"
            className="absolute left-0 right-0 bottom-17 w-full rounded-md bg-kakao-bg disabled:opacity-50 py-3.75"
            onClick={onClickKakaoLogin}
            disabled={!canLogin || isLoading}
          >
            <div className="flex items-center justify-center gap-2">
              <img
                src={kakaoIcon}
                alt="카카오 아이콘"
                className="h-4.5 w-4.5"
              />
              <span className="title-14-normal text-black/85">
                {isLoading ? "로그인 중…" : "카카오 로그인"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}