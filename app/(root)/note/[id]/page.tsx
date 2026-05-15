import Note from "@/components/Note";

type Props = {
  params: {
    id: string;
  };
};

export default async function NotePage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="w-full flex-center items-start h-screen px-4 relative">
      <Note id={id} />
    </div>
  );
}
