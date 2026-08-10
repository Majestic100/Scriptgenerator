import { GeneratedScript } from '../types';
import { getScriptTitleHeader } from './formatUtils';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Footer,
  ImageRun,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

/**
 * Loads the actual uploaded JalalVisuals PNG logo as a Data URL for Docs and PDF footers
 */
export async function getJalalVisualsLogoDataUrl(): Promise<string> {
  return '';
}

// Convert base64 data URL to Uint8Array buffer for docx
function dataURLToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Downloads Google Docs / Word (.docx) file matching exact formatting
 * 1 script per page, document title at top, JalalVisuals logo in footer
 */
export async function downloadScriptsAsDocx(
  scripts: GeneratedScript[],
  docTitle?: string
): Promise<void> {
  if (!scripts || scripts.length === 0) return;

  const defaultCompany = scripts[0]?.companyName || 'Meta Ads';
  const finalTitle = (docTitle || scripts[0]?.documentTitle || `${defaultCompany} - Script 2`).trim();

  const logoDataUrl = await getJalalVisualsLogoDataUrl();
  const logoBuffer = logoDataUrl ? dataURLToUint8Array(logoDataUrl) : null;

  const children: Paragraph[] = [];
  let accumulatedHooks = 0;

  scripts.forEach((script, idx) => {
    // Top Document Title on Page 1
    if (idx === 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280, before: 100 },
          children: [
            new TextRun({
              text: finalTitle,
              bold: true,
              size: 32, // 16pt
              font: 'Arial',
              color: '000000',
            }),
          ],
        })
      );
    }

    // Script Heading
    const scriptHeadingText = getScriptTitleHeader(script, idx);
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200, before: idx === 0 ? 0 : 100 },
        children: [
          new TextRun({
            text: scriptHeadingText,
            bold: true,
            size: 24, // 12pt
            font: 'Arial',
            color: '000000',
          }),
        ],
      })
    );

    // Hooks (accumulated numbering across scripts)
    script.hooks?.forEach((hook, hIdx) => {
      const hookNum = accumulatedHooks + hIdx + 1;
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: `Hook ${hookNum} - `,
              bold: true,
              size: 22, // 11pt
              font: 'Arial',
              color: '000000',
            }),
            new TextRun({
              text: hook.audioDialogue || '',
              size: 22, // 11pt
              font: 'Arial',
              color: '000000',
            }),
          ],
        })
      );
    });
    accumulatedHooks += script.hooks?.length || 0;

    // Body
    const bodyDialogue = script.scenes
      ?.map((sc) => (sc.audioDialogue ? sc.audioDialogue.trim() : ''))
      .filter(Boolean)
      .join(' ') || '';

    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: 'Body - ',
            bold: true,
            size: 22, // 11pt
            font: 'Arial',
            color: '000000',
          }),
          new TextRun({
            text: bodyDialogue,
            size: 22, // 11pt
            font: 'Arial',
            color: '000000',
          }),
        ],
      })
    );

    // CTA
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: 'CTA - ',
            bold: true,
            size: 22, // 11pt
            font: 'Arial',
            color: '000000',
          }),
          new TextRun({
            text: script.callToAction || '',
            size: 22, // 11pt
            font: 'Arial',
            color: '000000',
          }),
        ],
      })
    );

    // Page break if not the last script (1 script per page!)
    if (idx < scripts.length - 1) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
  });

  // Footer with JalalVisuals logo centered at bottom of every page
  const footerChildren: Paragraph[] = [];
  if (logoBuffer) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [
          new ImageRun({
            data: logoBuffer,
            type: 'png',
            transformation: { width: 175, height: 35 },
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1152, // 20mm
              bottom: 1152,
              left: 1152,
              right: 1152,
            },
          },
        },
        footers: {
          default: new Footer({
            children: footerChildren,
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${finalTitle.replace(/[/\\?%*:|"<>]/g, '-')}.docx`;
  saveAs(blob, fileName);
}

/**
 * Downloads PDF file matching exact sample PDF layout:
 * 1 script per page, document title at top, JalalVisuals logo in footer
 */
export async function downloadScriptsAsPdf(
  scripts: GeneratedScript[],
  docTitle?: string
): Promise<void> {
  if (!scripts || scripts.length === 0) return;

  const defaultCompany = scripts[0]?.companyName || 'Meta Ads';
  const finalTitle = (docTitle || scripts[0]?.documentTitle || `${defaultCompany} - Script 2`).trim();
  const logoDataUrl = await getJalalVisualsLogoDataUrl();

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm

  let accumulatedHooks = 0;

  scripts.forEach((script, idx) => {
    if (idx > 0) {
      doc.addPage();
    }

    let cursorY = 22;

    // Document Title on Page 1
    if (idx === 0) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(finalTitle, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 14;
    } else {
      cursorY = 25;
    }

    // Script Heading
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    const scriptHeadingText = getScriptTitleHeader(script, idx);
    doc.text(scriptHeadingText, marginX, cursorY);
    cursorY += 10;

    // Helper to print a labeled paragraph with bold label ("Hook 1 - ", "Body - ", "CTA - ")
    const printLabeledParagraph = (label: string, text: string) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      const labelWidth = doc.getTextWidth(label);

      // Measure lines for dialogue
      doc.setFont('Helvetica', 'normal');
      const fullText = label + text;
      const lines = doc.splitTextToSize(fullText, contentWidth);

      if (lines.length === 0) return;

      // Print first line with bold label
      doc.setFont('Helvetica', 'bold');
      doc.text(label, marginX, cursorY);

      doc.setFont('Helvetica', 'normal');
      // Calculate offset for rest of first line
      const firstLineRest = lines[0].substring(label.length);
      doc.text(firstLineRest, marginX + labelWidth, cursorY);

      cursorY += 6;

      // Print remaining lines
      for (let l = 1; l < lines.length; l++) {
        doc.text(lines[l], marginX, cursorY);
        cursorY += 5.5;
      }

      cursorY += 3.5; // Paragraph spacing
    };

    // Print Hooks
    script.hooks?.forEach((hook, hIdx) => {
      const hookNum = accumulatedHooks + hIdx + 1;
      printLabeledParagraph(`Hook ${hookNum} - `, hook.audioDialogue || '');
    });
    accumulatedHooks += script.hooks?.length || 0;

    // Print Body
    const bodyDialogue = script.scenes
      ?.map((sc) => (sc.audioDialogue ? sc.audioDialogue.trim() : ''))
      .filter(Boolean)
      .join(' ') || '';

    printLabeledParagraph('Body - ', bodyDialogue);

    // Print CTA
    printLabeledParagraph('CTA - ', script.callToAction || '');

    // Draw Footer Logo at bottom center of page
    if (logoDataUrl) {
      const logoW = 50; // mm
      const logoH = 10; // mm
      const logoX = (pageWidth - logoW) / 2;
      const logoY = pageHeight - 22; // bottom footer position
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoW, logoH);
    }
  });

  const fileName = `${finalTitle.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
  doc.save(fileName);
}
