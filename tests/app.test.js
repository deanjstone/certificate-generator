const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateCertificate,
  createDocDefinition,
  parseWorksheet,
} = require('../src/js/app');

test('generateCertificate alerts if no file is selected', () => {
  const alerts = [];
  global.alert = (message) => alerts.push(message);

  generateCertificate();

  assert.deepEqual(alerts, ['Please select a file.']);
});

test('generateCertificate calls loading callbacks and downloads PDF', () => {
  const file = new File([''], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  let loadingCalls = 0;
  let loadedCalls = 0;
  let downloadedAs = null;

  generateCertificate({
    file,
    onLoading: () => {
      loadingCalls += 1;
    },
    onLoaded: () => {
      loadedCalls += 1;
    },
    fileReaderFactory: () => ({
      readAsArrayBuffer() {
        this.onload({ target: { result: new ArrayBuffer(8) } });
      },
    }),
    xlsx: {
      read: () => ({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {
            A1: { v: 'John Doe' },
          },
        },
      }),
    },
    pdfMaker: {
      createPdf: () => ({
        download: (filename) => {
          downloadedAs = filename;
        },
      }),
    },
  });

  assert.equal(loadingCalls, 1);
  assert.equal(loadedCalls, 1);
  assert.equal(downloadedAs, 'Certificate.pdf');
});

test('generateCertificate alerts on file-read error', () => {
  const file = new File([''], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const alerts = [];
  global.alert = (message) => alerts.push(message);

  generateCertificate({
    file,
    fileReaderFactory: () => ({
      readAsArrayBuffer() {
        this.onerror();
      },
    }),
  });

  assert.deepEqual(alerts, ['Error reading file. Please try again.']);
});

test('parseWorksheet maps workbook values into name and units', () => {
  const worksheet = {
    A1: { v: 'John Doe' },
    A2: { v: 'UNIT1' },
    B2: { v: 'Unit 1 Title' },
    A3: { v: 'UNIT2' },
    B3: { v: 'Unit 2 Title' },
  };

  const parsed = parseWorksheet(worksheet);

  assert.deepEqual(parsed, {
    name: 'John Doe',
    units: [
      { code: 'UNIT1', title: 'Unit 1 Title' },
      { code: 'UNIT2', title: 'Unit 2 Title' },
    ],
  });
});

test('createDocDefinition builds expected structure', () => {
  const name = 'John Doe';
  const date = '01/01/2022';
  const units = [
    { code: 'UNIT1', title: 'Unit 1 Title' },
    { code: 'UNIT2', title: 'Unit 2 Title' },
  ];

  const docDefinition = createDocDefinition(name, date, units);

  assert.equal(docDefinition.security.permissions, 'print');
  assert.ok(Array.isArray(docDefinition.content));
  assert.equal(docDefinition.content[0].text, 'CERTIFICATE IV IN TRAINING AND ASSESSMENT');
  assert.equal(docDefinition.content[2].text, name);
  assert.equal(docDefinition.content[docDefinition.content.length - 2].text, date);
});
