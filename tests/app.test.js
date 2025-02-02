const { generateCertificate, createDocDefinition } = require('../src/js/app');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

describe('generateCertificate', () => {
  let fileInput;
  let loadingIndicator;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="form">
        <input type="file" id="file" />
        <div id="loading-indicator" style="display: none;"></div>
      </form>
    `;
    fileInput = document.getElementById('file');
    loadingIndicator = document.getElementById('loading-indicator');
  });

  it('should display an alert if no file is selected', () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    generateCertificate();
    expect(alertMock).toHaveBeenCalledWith('Please select a file.');
    alertMock.mockRestore();
  });

  it('should display a loading indicator while generating the certificate', (done) => {
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fileInput.files = [file];

    const readerMock = jest.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function() {
      this.onload({ target: { result: new ArrayBuffer(8) } });
    });

    generateCertificate();

    expect(loadingIndicator.style.display).toBe('block');

    setTimeout(() => {
      expect(loadingIndicator.style.display).toBe('none');
      readerMock.mockRestore();
      done();
    }, 100);
  });

  it('should display an alert if there is an error reading the file', (done) => {
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fileInput.files = [file];

    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const readerMock = jest.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function() {
      this.onerror();
    });

    generateCertificate();

    setTimeout(() => {
      expect(alertMock).toHaveBeenCalledWith('Error reading file. Please try again.');
      expect(loadingIndicator.style.display).toBe('none');
      alertMock.mockRestore();
      readerMock.mockRestore();
      done();
    }, 100);
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
