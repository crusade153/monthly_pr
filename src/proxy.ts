import { NextResponse, type NextRequest } from "next/server";

// plog middleware 와 같은 규칙: 세션 쿠키가 없으면 /login. 쿠키 서명 검증은 페이지/액션에서(getSession) 한다.
const PUBLIC_PATHS = ["/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (process.env.DEV_BYPASS_AUTH === "1" && process.env.NODE_ENV !== "production") return NextResponse.next();
  if (!req.cookies.get("session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)).*)"],
};
