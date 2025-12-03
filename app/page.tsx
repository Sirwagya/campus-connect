"use client";
import Hero from "@/components/ui/neural-network-hero";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden m-0 p-0">
      <Hero
        title="Something is happening inside VedHub."
        description="Are you part of it yet?"
        badgeLabel="VSOT Exclusive"
        badgeText="Private"
        ctaButtons={[
          {
            text: "Sign in with @vedamsot.org",
            href: "/api/auth/google",
            primary: true,
          },
        ]}
        microDetails={["Private", "Invite-only", "VSoT Verified"]}
      />
    </main>
  );
}
