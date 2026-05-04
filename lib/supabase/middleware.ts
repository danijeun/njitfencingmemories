import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/auth/callback",
  "/not-on-roster",
  "/request-access",
  "/memories",
  "/search",
  "/gallery",
];

// Routes under a public prefix that still require auth.
const GATED_EXCEPTIONS = ["/memories/new"];

function isPublic(pathname: string) {
  if (GATED_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return false;
  }
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }: CookieToSet) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  if (searchParams.get("code") && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (!user) {
    if (isPublic(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    if (pathname === "/not-on-roster" || pathname.startsWith("/request-access")) return response;
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/not-on-roster";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!profile.onboarded_at && !pathname.startsWith("/onboarding") && pathname !== "/logout") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/class";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (profile.onboarded_at && (pathname === "/login" || pathname.startsWith("/onboarding"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile/me";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
