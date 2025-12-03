import { MailSidebar } from "@/components/mail/MailSidebar";

export default function MailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0E0E10] text-white overflow-hidden">
      <MailSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#0E0E10]">
        {children}
      </main>
    </div>
  );
}
