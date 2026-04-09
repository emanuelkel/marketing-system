import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MobileLayoutClient } from "@/components/layout/mobile-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MobileLayoutClient
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </MobileLayoutClient>
  );
}
