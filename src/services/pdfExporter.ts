import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { WrongQuestionRecord } from "../types";

export class PDFExporter {
  static async exportToPDF(records: WrongQuestionRecord[], filename: string = "错题集.pdf") {
    // We'll create a hidden container to render items for capture if needed, 
    // but for text-heavy content, jsPDF's basic functions or html2canvas on a styled div is better.
    // Here we'll use html2canvas for rich formatting.
    
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px"; // Standard A4 width-ish
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.className = "pdf-export-container";
    
    document.body.appendChild(container);

    container.innerHTML = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">AI 错题集 & 举一反三练习</h1>
      <p style="text-align: right; color: #666;">生成时间: ${new Date().toLocaleString()}</p>
      <hr />
    `;

    records.forEach((record, idx) => {
      const recordDiv = document.createElement("div");
      recordDiv.style.marginBottom = "40px";
      recordDiv.style.pageBreakInside = "avoid";
      
      recordDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 18px; color: #2563eb; border-left: 4px solid #2563eb; padding-left: 10px;">
            记录 ${idx + 1}: ${record.knowledgePoint}
          </h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <strong style="display: block; margin-bottom: 5px; color: #ef4444;">[原题回放]</strong>
            <p style="margin: 0; line-height: 1.6;">${record.originalQuestion.content}</p>
          </div>
        </div>
        <div>
          <strong style="color: #059669;">[举一反三练习]</strong>
          ${record.similarQuestions.map((q, i) => `
            <div style="margin-top: 15px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
              <p><strong>练习 ${i + 1}:</strong> ${q.content}</p>
              <div style="margin-top: 5px; font-size: 14px; color: #4b5563;">
                 <p><strong>答案:</strong> ${q.answer}</p>
                 <p><strong>易错点解析:</strong> ${q.commonErrors}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(recordDiv);
    });

    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } finally {
      document.body.removeChild(container);
    }
  }
}
