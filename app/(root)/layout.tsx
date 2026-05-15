import Sidebar from "@/components/Sidebar";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
            <main className="flex min-h-screen">
              <Sidebar/>
              {children}
            </main>
  );
}