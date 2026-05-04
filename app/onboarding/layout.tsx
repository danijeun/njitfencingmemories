export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
