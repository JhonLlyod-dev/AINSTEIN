import Sidebar from "@/components/Sidebar";
export default function quizLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen">
      {children}
    </main>
  );
}