import { extractDocxText } from "@/lib/docs";

export interface ExtractedFile {
  name: string;
  content: string;
}

async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);


  try {
    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to extract PDF text');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return `Error extracting ${file.name}`;
  }
}

export async function handleFiles(
  files: FileList
): Promise<ExtractedFile[]> {
  const results: ExtractedFile[] = [];

  for (const file of Array.from(files)) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    let content = "";

    switch (extension) {
      case "pdf":
        content = await extractPdfText(file);
        break;

      case "docx":
        content = await extractDocxText(file);
        break;

      default:
        console.warn("Unsupported file:", file.name);
        continue;
    }

    results.push({
      name: file.name,
      content,
    });
  }

  return results;
}