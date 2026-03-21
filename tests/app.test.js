const { generateCertificate, createDocDefinition, parseWorksheet } = require('../src/js/app');

describe('generateCertificate', () => {
  it('should display an alert if no file is selected', () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    generateCertificate();

    expect(alertMock).toHaveBeenCalledWith('Please select a file.');
    alertMock.mockRestore();
  });

  it('should call loading callbacks while generating the certificate', () => {
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const onLoading = jest.fn();
    const onLoaded = jest.fn();
    const downloadMock = jest.fn();

    generateCertificate({
      file,
      onLoading,
      onLoaded,
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
          download: downloadMock,
        }),
      },
    });

    expect(onLoading).toHaveBeenCalledTimes(1);
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(downloadMock).toHaveBeenCalledWith('Certificate.pdf');
  });

  it('should display an alert if there is an error reading the file', () => {
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    generateCertificate({
      file,
      fileReaderFactory: () => ({
        readAsArrayBuffer() {
          this.onerror();
        },
      }),
    });

    expect(alertMock).toHaveBeenCalledWith('Error reading file. Please try again.');
    alertMock.mockRestore();
  });
});

describe('parseWorksheet', () => {
  it('should map workbook values into a name and units array', () => {
    const worksheet = {
      A1: { v: 'John Doe' },
      A2: { v: 'UNIT1' },
      B2: { v: 'Unit 1 Title' },
      A3: { v: 'UNIT2' },
      B3: { v: 'Unit 2 Title' },
    };

    const parsed = parseWorksheet(worksheet);

    expect(parsed).toEqual({
      name: 'John Doe',
      units: [
        { code: 'UNIT1', title: 'Unit 1 Title' },
        { code: 'UNIT2', title: 'Unit 2 Title' },
      ],
    });
  });
});

describe('createDocDefinition', () => {
  it('should create a document definition with the correct content', () => {
    const name = 'John Doe';
    const date = '01/01/2022';
    const units = [
      { code: 'UNIT1', title: 'Unit 1 Title' },
      { code: 'UNIT2', title: 'Unit 2 Title' },
    ];

    const docDefinition = createDocDefinition(name, date, units);

    expect(docDefinition).toEqual({
      security: {
        permissions: 'print',
      },
      content: expect.any(Array),
    });

    const content = docDefinition.content;
    expect(content[0].text).toBe('CERTIFICATE IV IN TRAINING AND ASSESSMENT');
    expect(content[2].text).toBe(name);
    expect(content[content.length - 2].text).toBe(date);
  });
});
