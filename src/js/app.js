function createDocDefinition(name, date, units) {
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
}

function parseWorksheet(worksheet) {
  const rawName = worksheet?.A1?.v;
  const name = typeof rawName === "string" ? rawName.trim() : rawName;

  if (!name) {
    throw new Error("Missing required learner name in cell A1.");
  }

  const units = [];

  for (let i = 2; i <= 11; i += 1) {
    const code = worksheet?.[`A${i}`]?.v;
    const title = worksheet?.[`B${i}`]?.v;

    if (code || title) {
      units.push({
        code: code || "",
        title: title || "",
      });
    }
  }

  return { name, units };
}

function generateCertificate({
  file,
  onLoading = () => {},
  onLoaded = () => {},
  onError = (message) => {
    if (typeof alert === "function") {
      alert(message);
    }
  },
  fileReaderFactory = () => new FileReader(),
  dateFactory = () => new Date().toLocaleDateString(),
  xlsx = typeof XLSX !== "undefined" ? XLSX : undefined,
  pdfMaker = typeof pdfMake !== "undefined" ? pdfMake : undefined,
} = {}) {
  if (!file) {
    onError("Please select a file.");
    return;
  }

  onLoading();
  const reader = fileReaderFactory();

  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = xlsx.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const { name, units } = parseWorksheet(worksheet);
      const date = dateFactory();
      const docDefinition = createDocDefinition(name, date, units);

      pdfMaker.createPdf(docDefinition).download("Certificate.pdf");
      onLoaded();
    } catch (error) {
      if (error?.message === "Missing required learner name in cell A1.") {
        onError("Missing required learner name in cell A1.");
      } else {
        onError("Error reading file. Please try again.");
      }
      onLoaded();
    }
  };

  reader.onerror = () => {
    onError("Error reading file. Please try again.");
    onLoaded();
  };

  reader.readAsArrayBuffer(file);
}

function bootstrapCertificateGenerator() {
  const form = document.getElementById("form");
  const fileInput = document.getElementById("file");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (!form || !fileInput || !loadingIndicator) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    generateCertificate({
      file: fileInput.files[0],
      onLoading: () => {
        loadingIndicator.style.display = "block";
      },
      onLoaded: () => {
        loadingIndicator.style.display = "none";
      },
      onError: (message) => {
        alert(message);
      },
    });
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", bootstrapCertificateGenerator);
}

if (typeof module !== "undefined") {
  module.exports = {
    createDocDefinition,
    parseWorksheet,
    generateCertificate,
    bootstrapCertificateGenerator,
  };
}
