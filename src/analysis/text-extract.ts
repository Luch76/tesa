import { UnprocessableEntityException } from '@nestjs/common';
import mammoth from 'mammoth';
import { extractText as extractPdfText, getDocumentProxy } from 'unpdf';

/** Plain text of a stored resume, for analysis. */
export async function extractResumeText(
  data: Buffer,
  mimeType: string,
): Promise<string> {
  let text: string;
  if (mimeType === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    text = (await extractPdfText(pdf, { mergePages: true })).text;
  } else if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    text = (await mammoth.extractRawText({ buffer: data })).value;
  } else if (mimeType.startsWith('text/plain')) {
    text = data.toString('utf8');
  } else {
    throw new UnprocessableEntityException(
      "This file type can't be analyzed. Upload your resume as a PDF, DOCX or text file.",
    );
  }

  text = text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (text.length < 40) {
    throw new UnprocessableEntityException(
      "We couldn't read any text in this resume. If it's a scanned image, upload a PDF or DOCX with selectable text.",
    );
  }
  return text;
}
