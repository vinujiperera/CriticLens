import html2canvas from "html2canvas";

/** PNG export only — PDF uses jsPDF in pdfReports.ts (no canvas / CORS issues). */
export async function downloadDossierPng(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#fffaf8",
    useCORS: false,
    allowTaint: true,
    logging: false,
    onclone: (doc) => {
      doc.querySelectorAll("img").forEach((img) => img.remove());
    },
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
