function generateCertificate() {
  var fileInput = document.getElementById("file");
  var file = fileInput.files[0];
  var reader = new FileReader();

  reader.onload = function (event) {
    var data = new Uint8Array(event.target.result);
    var workbook = XLSX.read(data, { type: "array" });
    var worksheet = workbook.Sheets[workbook.SheetNames[0]];
    var name = worksheet["A1"].v;
    var date = new Date().toLocaleDateString();
    var units = [];

    for (var i = 2; i <= 11; i++) {
      var code = worksheet["A" + i];
      var title = worksheet["B" + i];
      units.push({ code: code, title: title });
    }

    var docDefinition = {
      security: {
        permissions: "print",
      },

      content: [
/*         {
          image: "background.jpg",
          absolutePosition: { x: 0, y: 0 },
          width: 595,
        }, */
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
          ol: units.map(function (unit) {
            return [
              { text: unit.code + " - " + unit.title, margin: [0, 5, 0, 5] },
            ];
          }),
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

    pdfMake.createPdf(docDefinition).download("Certificate.pdf");
  };

  reader.readAsArrayBuffer(file);
}
