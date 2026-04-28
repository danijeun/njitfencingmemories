import { TopNav } from "@/components/nav/TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
