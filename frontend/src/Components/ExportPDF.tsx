import React, { useRef } from "react";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfButtonProps {
  contentToExport: string;
}

const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  contentToExport,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (contentRef.current) {
      const canvas = await html2canvas(contentRef.current);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("exported-content.pdf");

      alert("PDF Exported successfully!");
    }
  };

  return (
    <>
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm", // A4 width
          padding: "25px",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        <h2>Exported Content</h2>
        <p>{contentToExport}</p>
      </div>

      <Button variant="contained" color="primary" onClick={handleExport}>
        Export as PDF
      </Button>
    </>
  );
};

export default ExportPdfButton;
