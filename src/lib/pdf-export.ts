import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';

interface PDFExportOptions {
  title: string;
  content: string;
  subject?: string;
  author?: string;
  wordCount?: number;
}

export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { title, content, subject, author = "IBDP Student", wordCount } = options;

  try {
    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.padding = '20mm';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Times, serif';
    tempContainer.style.fontSize = '12pt';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = 'black';

    // Process content to render equations
    const processedContent = await processContentForPDF(content);

    // Create the HTML structure
    tempContainer.innerHTML = `
      <div style="margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px;">
        <h1 style="margin: 0; font-size: 20pt; font-weight: bold; color: #333;">${title}</h1>
        ${subject ? `<p style="margin: 5px 0; color: #666; font-size: 11pt;">Subject: ${subject}</p>` : ''}
        ${author ? `<p style="margin: 5px 0; color: #666; font-size: 11pt;">Author: ${author}</p>` : ''}
        ${wordCount ? `<p style="margin: 5px 0; color: #666; font-size: 11pt;">Word Count: ${wordCount}</p>` : ''}
        <p style="margin: 5px 0; color: #666; font-size: 11pt;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.8;">
        ${processedContent}
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.offsetWidth,
      height: tempContainer.offsetHeight
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add the image to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add more pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}_draft.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

async function processContentForPDF(content: string): Promise<string> {
  // Replace LaTeX equations with rendered versions
  const equationRegex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
  
  let processedContent = content;
  const matches = Array.from(content.matchAll(equationRegex));
  
  for (const match of matches) {
    const fullMatch = match[0];
    const isBlock = fullMatch.startsWith('$$') && fullMatch.endsWith('$$');
    const mathContent = isBlock 
      ? fullMatch.slice(2, -2) 
      : fullMatch.slice(1, -1);

    try {
      // Render LaTeX to HTML
      const renderedHtml = katex.renderToString(mathContent, {
        displayMode: isBlock,
        throwOnError: false,
        trust: true
      });

      // Replace the LaTeX with rendered HTML
      processedContent = processedContent.replace(fullMatch, renderedHtml);
    } catch (error) {
      // If rendering fails, keep the original LaTeX
      console.warn('Failed to render equation:', mathContent, error);
    }
  }

  return processedContent;
}

export function validateContentForPDF(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Content cannot be empty');
  }

  // Check for invalid LaTeX equations
  const equationRegex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
  const matches = Array.from(content.matchAll(equationRegex));
  
  for (const match of matches) {
    const fullMatch = match[0];
    const isBlock = fullMatch.startsWith('$$') && fullMatch.endsWith('$$');
    const mathContent = isBlock 
      ? fullMatch.slice(2, -2) 
      : fullMatch.slice(1, -1);

    try {
      katex.renderToString(mathContent, {
        displayMode: isBlock,
        throwOnError: true
      });
    } catch (error) {
      errors.push(`Invalid LaTeX equation: ${mathContent}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}