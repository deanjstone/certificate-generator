document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const fileInput = document.getElementById("file");
  const loadingIndicator = document.getElementById("loading-indicator");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generateCertificate();
  });

  // Function to generate the certificate
  const generateCertificate = () => {
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a file.");
      return;
    }

    loadingIndicator.style.display = "block";

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const name = worksheet["A1"].v;
      const date = new Date().toLocaleDateString();
      const units = [];

      for (let i = 2; i <= 11; i++) {
        const code = worksheet["A" + i];
        const title = worksheet["B" + i];
        units.push({ code: code, title: title });
      }

      const docDefinition = createDocDefinition(name, date, units);

      pdfMake.createPdf(docDefinition).download("Certificate.pdf");
      loadingIndicator.style.display = "none";
    };

    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      loadingIndicator.style.display = "none";
    };

    reader.readAsArrayBuffer(file);
  };

  // Function to create the document definition for the PDF
  const createDocDefinition = (name, date, units) => {
    return {
      security: {
        permissions: "print",
      },
      content: [
        {
          text: "CERTIFICATE IV IN TRAINING AND ASSESSMENT",
          fontSize: 24,
          bold: true,
          margin: [0, 100, 0, 20],
          alignment: "center",
        },
        {
          text: "This is to certify that",
          fontSize: 16,
          margin: [0, 0, 0, 10],
          alignment: "center",
        },
        {
          text: name,
          fontSize: 24,
          bold: true,
          margin: [0, 0, 0, 50],
          alignment: "center",
        },
        {
          text: "has successfully completed the following Units of Competency:",
          fontSize: 16,
          margin: [0, 0, 0, 20],
        },
        {
          ol: units.map((unit) => [
            { text: `${unit.code} - ${unit.title}`, margin: [0, 5, 0, 5] },
          ]),
        },
        {
          text: "CERTIFICATE DETAILS",
          fontSize: 24,
          bold: true,
          margin: [0, 100, 0, 20],
          alignment: "center",
          pageBreak: "before",
        },
        { text: "Qualification:", fontSize: 16, margin: [0, 0, 0, 10] },
        {
          text: "Certificate IV in Training and Assessment",
          fontSize: 14,
          margin: [0, 0, 0, 20],
        },
        { text: "Date Awarded:", fontSize: 16, margin: [0, 0, 0, 10] },
        { text: date, fontSize: 14, margin: [0, 0, 0, 50] },
        {
          text: "This certificate is issued by: John Doe Training Academy",
          fontSize: 14,
          margin: [0, 0, 0, 10],
        },
      ],
    };
  };
});
