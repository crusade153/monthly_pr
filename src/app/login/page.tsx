import { listUserNames } from "@/lib/auth/session";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  wrong: "이름 또는 PIN이 올바르지 않습니다.",
  invalid: "PIN은 6자리 숫자입니다.",
  db: "사용자 DB에 연결하지 못했습니다. 관리자에게 문의하세요.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  let names: string[] = [];
  try {
    names = await listUserNames();
  } catch {
    // DB 미구성 시 이름을 직접 입력받는다.
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <form action={loginAction} className="w-full max-w-sm card p-8">
        <div className="eyebrow">MONTHLY MANAGEMENT REPORT</div>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">월간 경영보고 · 생산부문</h1>
        <p className="mt-1 text-sm text-[var(--ink-3)]">생산일보(plog) 계정과 같은 이름·PIN으로 로그인합니다.</p>

        <input type="hidden" name="next" value={sp.next ?? "/"} />

        <label className="field-label mt-7" htmlFor="name">이름</label>
        {names.length > 0 ? (
          <select id="name" name="name" required defaultValue="" className="field">
            <option value="" disabled>선택하세요</option>
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <input id="name" name="name" required className="field" placeholder="이름" />
        )}

        <label className="field-label mt-4" htmlFor="pin">PIN (6자리)</label>
        <input
          id="pin" name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="off"
          className="field text-center num tracking-[0.5em] text-lg"
        />

        {sp.error && <p className="mt-3 text-sm text-[var(--bad)]">{ERRORS[sp.error] ?? "로그인하지 못했습니다."}</p>}

        <button type="submit" className="btn btn-primary w-full mt-6">로그인</button>
      </form>
    </main>
  );
}
