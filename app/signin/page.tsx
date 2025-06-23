import AuthTabs from "@/components/client/auth/AuthTabs";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Home() {
  return (
    <Suspense>
      <SuspenseWrapper />
    </Suspense>
  );
}

async function SuspenseWrapper() {
  const session = await getServerSession();
  if (session) {
    return redirect("/");
  }
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <div className="flex h-full w-full flex-1 basis-1/2 items-center justify-center">
        <h1 className="text-h1">
          Welcome to <br />
          Threads
        </h1>
      </div>
      <div className="bg-muted flex h-full w-full flex-1 basis-1/2 flex-col items-center justify-center">
        <div className="w-[60%]">
          <AuthTabs />
        </div>
      </div>
    </main>
  );
}
