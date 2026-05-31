import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Keep FitKeeper authenticated routes protected while allowing the public
     * DroneOps pilot at /droneops. Cloud persistence within DroneOps still
     * requires a signed-in Supabase user in the client and is protected by RLS.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|droneops(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
