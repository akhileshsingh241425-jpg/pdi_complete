import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import RFIDTemplate from './RFIDTemplate';
import { getStoredGraphs } from './GraphManager';
import '../styles/BulkRFID.css';

const BulkRFIDGenerator = () => {
  const [excelData, setExcelData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [downloadType, setDownloadType] = useState('merged');
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [moduleType, setModuleType] = useState('monofacial');

  // Default values for fields not in Excel
  const [defaults, setDefaults] = useState({
    pvManufacturer: 'Gautam Solar Private Limited',
    cellManufacturer: 'Solar Space',
    moduleTypeDefault: 'G2G',
    moduleManufactureDate: 'Mar,26',
    cellManufactureDate: 'Dec,25',
    pvCountry: 'India',
    cellCountry: 'Laos',
    testLab: 'DTH',
    iecDate: '18/01/2025'
  });

  const isSuperAdmin = () => {
    return localStorage.getItem('userRole') === 'super_admin';
  };

  // Handle Excel file upload
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const getValue = (row, ...possibleNames) => {
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
          }
          const lowerName = name.toLowerCase();
          for (const key of Object.keys(row)) {
            if (key.toLowerCase() === lowerName || key.toLowerCase().replace(/[_\s]/g, '') === lowerName.replace(/[_\s]/g, '')) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return row[key];
              }
            }
          }
        }
        return null;
      };

      const normalizedData = data.map((row, idx) => {
        if (idx === 0) {
          console.log('RFID Excel columns found:', Object.keys(row));
        }

        return {
          SerialNumber: getValue(row, 'ID', 'Id', 'id', 'SerialNumber', 'Serial Number', 'serial_number', 'Barcode', 'barcode', 'Module Serial Number') || '',
          TID: getValue(row, 'TID', 'tid', 'Tag ID', 'TagID', 'tag_id') || '',
          ModuleType: getValue(row, 'ModuleType', 'Module Type', 'module_type', 'Type', 'type') || defaults.moduleTypeDefault,
          PVManufacturer: getValue(row, 'PVManufacturer', 'PV Manufacturer', 'Manufacturer') || defaults.pvManufacturer,
          CellManufacturer: getValue(row, 'CellManufacturer', 'Cell Manufacturer', 'Solar Cell Manufacturer') || defaults.cellManufacturer,
          ModuleManufactureDate: getValue(row, 'ModuleManufactureDate', 'Module Manufacture Date', 'Mfg Date') || defaults.moduleManufactureDate,
          CellManufactureDate: getValue(row, 'CellManufactureDate', 'Cell Manufacture Date', 'Cell Mfg Date') || defaults.cellManufactureDate,
          PVCountry: getValue(row, 'PVCountry', 'PV Country', 'Module Country') || defaults.pvCountry,
          CellCountry: getValue(row, 'CellCountry', 'Cell Country', 'Cell Origin') || defaults.cellCountry,
          Pmax: parseFloat(getValue(row, 'Pmax', 'pmax', 'PMAX', 'P-Max', 'Power') || 0),
          Vmax: parseFloat(getValue(row, 'Vpm', 'vpm', 'VPM', 'Vmax', 'V-Max', 'Voltage') || 0),
          Imax: parseFloat(getValue(row, 'Ipm', 'ipm', 'IPM', 'Imax', 'I-Max', 'Current') || 0),
          FF: parseFloat(getValue(row, 'FF', 'ff', 'FillFactor', 'Fill_Factor', 'Fill Factor') || 0),
          Voc: parseFloat(getValue(row, 'Voc', 'voc', 'VOC') || 0),
          Isc: parseFloat(getValue(row, 'Isc', 'isc', 'ISC') || 0),
          TestLab: getValue(row, 'TestLab', 'Test Lab', 'Lab') || defaults.testLab,
          IECDate: getValue(row, 'IECDate', 'IEC Date', 'Certificate Date') || defaults.iecDate,
        };
      });

      setExcelData(normalizedData);
      alert(`${normalizedData.length} RFID records loaded from Excel!`);
    };
    reader.readAsBinaryString(file);
  };

  // Generate single PDF blob
  const generateSinglePDFBlob = async (testData, graphImage) => {
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const tempDiv = document.createElement('div');
      container.appendChild(tempDiv);

      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(tempDiv);
        root.render(<RFIDTemplate testData={testData} graphImage={graphImage} />);

        const waitForImages = () => {
          return new Promise((resolve) => {
            const images = tempDiv.getElementsByTagName('img');
            if (images.length === 0) {
              resolve();
              return;
            }
            let loadedCount = 0;
            const totalImages = images.length;
            const checkComplete = () => {
              loadedCount++;
              if (loadedCount >= totalImages) resolve();
            };
            Array.from(images).forEach(img => {
              if (img.complete) checkComplete();
              else {
                img.onload = checkComplete;
                img.onerror = checkComplete;
              }
            });
            setTimeout(resolve, 400);
          });
        };

        setTimeout(async () => {
          await waitForImages();

          const opt = {
            margin: 0,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              imageTimeout: 400
            },
            jsPDF: {
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
            }
          };

          html2pdf().set(opt).from(tempDiv.firstChild).outputPdf('blob').then((blob) => {
            root.unmount();
            document.body.removeChild(container);
            resolve(blob);
          }).catch(reject);
        }, 100);
      }).catch(reject);
    });
  };

  // Upload PDFs to backend
  const uploadPDFsToBackend = async (pdfDataArray) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';
      const endpoint = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/rfid/upload-bulk` : `${API_BASE_URL}/api/rfid/upload-bulk`;

      const reports = await Promise.all(pdfDataArray.map(async (item) => {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(item.blob);
        });
        return {
          pdfData: base64,
          serialNumber: item.serialNumber,
          moduleType: item.moduleType,
          pmax: item.pmax
        };
      }));

      const response = await axios.post(endpoint, { reports });
      return response.data;
    } catch (error) {
      console.error('RFID Upload error:', error);
      throw error;
    }
  };

  // Generate all reports
  const generateAllReports = async (downloadMode = 'merged', format = 'pdf', modType = 'monofacial') => {
    if (excelData.length === 0) {
      alert('Please upload Excel file first!');
      return;
    }

    const storedGraphs = await getStoredGraphs();
    if (Object.keys(storedGraphs).length === 0) {
      alert('No graphs found! Please upload graphs in Graph Manager first.');
      return;
    }

    const graphKeys = Object.keys(storedGraphs);
    const availableWattages = [...new Set(graphKeys.map(key => key.split('_')[0]))].sort((a, b) => parseInt(a) - parseInt(b));

    const wattagePrompt = `Available wattages with graphs:\n${availableWattages.join('W, ')}W\n\nEnter the wattage (WP) for these modules:`;
    const selectedWattage = prompt(wattagePrompt, availableWattages[0]);

    if (!selectedWattage) return;

    const graphKey = `${selectedWattage}_${modType}`;
    const hasGraphs = storedGraphs[graphKey] || storedGraphs[selectedWattage];
    if (!hasGraphs) {
      alert(`No graphs found for ${selectedWattage}W (${modType})! Please upload graphs first.`);
      return;
    }

    const getRandomGraphFromCache = (power, moduleType = 'monofacial') => {
      const keyWithType = `${power}_${moduleType}`;
      let powerGraphs = storedGraphs[keyWithType];
      if (!powerGraphs) powerGraphs = storedGraphs[power];
      if (!powerGraphs) {
        const matchingKey = Object.keys(storedGraphs).find(k => k.startsWith(power));
        if (matchingKey) powerGraphs = storedGraphs[matchingKey];
      }
      if (!powerGraphs) return null;
      if (typeof powerGraphs === 'string') return powerGraphs;
      if (Array.isArray(powerGraphs) && powerGraphs.length > 0) {
        return powerGraphs[Math.floor(Math.random() * powerGraphs.length)];
      }
      return null;
    };

    setIsGenerating(true);
    setProgress(0);

    const pdfDataArray = [];
    const BATCH_SIZE = 8;
    const totalBatches = Math.ceil(excelData.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, excelData.length);
      const batchRows = excelData.slice(batchStart, batchEnd);

      const batchPromises = batchRows.map(async (row) => {
        const testData = {
          serialNumber: row.SerialNumber || '',
          tid: row.TID || '',
          pvManufacturer: row.PVManufacturer || defaults.pvManufacturer,
          cellManufacturer: row.CellManufacturer || defaults.cellManufacturer,
          moduleType: row.ModuleType || defaults.moduleTypeDefault,
          moduleManufactureDate: row.ModuleManufactureDate || defaults.moduleManufactureDate,
          cellManufactureDate: row.CellManufactureDate || defaults.cellManufactureDate,
          pvCountry: row.PVCountry || defaults.pvCountry,
          cellCountry: row.CellCountry || defaults.cellCountry,
          pmax: row.Pmax || 0,
          vmax: row.Vmax || 0,
          imax: row.Imax || 0,
          fillFactor: row.FF || 0,
          voc: row.Voc || 0,
          isc: row.Isc || 0,
          testLab: row.TestLab || defaults.testLab,
          iecDate: row.IECDate || defaults.iecDate,
        };

        const graphImage = getRandomGraphFromCache(selectedWattage, modType);

        try {
          const blob = await generateSinglePDFBlob(testData, graphImage);
          return {
            blob,
            serialNumber: testData.serialNumber,
            moduleType: testData.moduleType,
            pmax: testData.pmax,
            testData,
            graphImage
          };
        } catch (error) {
          console.error(`Error generating RFID PDF for ${testData.serialNumber}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result) pdfDataArray.push(result);
      });

      setProgress((batchEnd / excelData.length) * 85);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // eslint-disable-next-line no-unused-vars
    let downloadSuccess = false;
    if (pdfDataArray.length > 0) {
      if (format === 'word') {
        try {
          setProgress(87);
          // eslint-disable-next-line no-unused-vars
          const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
          const { saveAs } = await import('file-saver');

          if (downloadMode === 'split') {
            for (let i = 0; i < pdfDataArray.length; i++) {
              const item = pdfDataArray[i];
              const td = item.testData;
              const doc = new Document({
                sections: [{
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Gautam Solar Private Limited', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: '7 Km Milestone, Tosham Road, Dist. Bhiwani', size: 22 })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Module Serial Number: ${td.serialNumber}`, size: 24, bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: `TID: ${td.tid}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Detailed Specification:', bold: true, size: 28, underline: {} })] }),
                    new Paragraph({ children: [new TextRun({ text: `1. PV Module Manufacturer: ${td.pvManufacturer}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `2. Solar Cell Manufacturer: ${td.cellManufacturer}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `3. Module Type: ${td.moduleType}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `4. Module Mfg Date: ${td.moduleManufactureDate}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `5. Cell Mfg Date: ${td.cellManufactureDate}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `6. PV Module Country: ${td.pvCountry}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `7. Cell Country: ${td.cellCountry}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `8. Pmax: ${parseFloat(td.pmax).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `9. Vmax: ${parseFloat(td.vmax).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `10. Imax: ${parseFloat(td.imax).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `11. FF: ${parseFloat(td.fillFactor).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `12. VOC: ${parseFloat(td.voc).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `13. ISC: ${parseFloat(td.isc).toFixed(6)}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `14. Test Lab: ${td.testLab}`, size: 24 })] }),
                    new Paragraph({ children: [new TextRun({ text: `15. IEC Certificate Date: ${td.iecDate}`, size: 24 })] }),
                  ]
                }]
              });
              const blob = await Packer.toBlob(doc);
              saveAs(blob, `RFID_${item.serialNumber.replace(/\//g, '_')}.docx`);
              setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
              await new Promise(r => setTimeout(r, 150));
            }
            downloadSuccess = true;
          } else {
            const sections = pdfDataArray.map((item, idx) => {
              const td = item.testData;
              return {
                children: [
                  new Paragraph({ children: [new TextRun({ text: `Report ${idx + 1} of ${pdfDataArray.length}`, bold: true, size: 20, color: '666666' })], alignment: AlignmentType.RIGHT }),
                  new Paragraph({ children: [new TextRun({ text: 'Gautam Solar Private Limited', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Module Serial Number: ${td.serialNumber}`, size: 24, bold: true })] }),
                  new Paragraph({ children: [new TextRun({ text: `TID: ${td.tid}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `Pmax: ${parseFloat(td.pmax).toFixed(6)}  |  Vmax: ${parseFloat(td.vmax).toFixed(6)}  |  Imax: ${parseFloat(td.imax).toFixed(6)}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: `VOC: ${parseFloat(td.voc).toFixed(6)}  |  ISC: ${parseFloat(td.isc).toFixed(6)}  |  FF: ${parseFloat(td.fillFactor).toFixed(6)}`, size: 24 })] }),
                  new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), size: 24, color: '999999' })], alignment: AlignmentType.CENTER }),
                ],
                properties: idx < pdfDataArray.length - 1 ? { page: { pageBreak: true } } : {}
              };
            });
            const doc = new Document({ sections });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `RFID_Reports_Merged_${new Date().toISOString().split('T')[0]}_${pdfDataArray.length}files.docx`);
            downloadSuccess = true;
          }
          setProgress(98);
        } catch (wordError) {
          console.error('Word generation error:', wordError);
          alert('Word generation failed: ' + wordError.message);
        }
      } else {
        // PDF format
        if (downloadMode === 'split') {
          setProgress(87);
          for (let i = 0; i < pdfDataArray.length; i++) {
            const item = pdfDataArray[i];
            const url = window.URL.createObjectURL(item.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `RFID_${item.serialNumber.replace(/\//g, '_')}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }, 200);
            setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
            await new Promise(r => setTimeout(r, 150));
          }
          downloadSuccess = true;
        } else {
          try {
            setProgress(87);
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();
            for (let i = 0; i < pdfDataArray.length; i++) {
              const item = pdfDataArray[i];
              const arrayBuffer = await item.blob.arrayBuffer();
              const donor = await PDFDocument.load(arrayBuffer);
              const copied = await mergedPdf.copyPages(donor, donor.getPageIndices());
              copied.forEach((p) => mergedPdf.addPage(p));
              setProgress(87 + Math.round(((i + 1) / pdfDataArray.length) * 10));
              await new Promise(r => setTimeout(r, 50));
            }
            const mergedBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(mergedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `RFID_Reports_Merged_${new Date().toISOString().split('T')[0]}_${pdfDataArray.length}files.pdf`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 1000);
            downloadSuccess = true;
          } catch (mergeError) {
            console.error('Error merging RFID PDFs:', mergeError);
            alert('PDF merge failed: ' + mergeError.message + '\nDownloading individual PDFs...');
            for (const item of pdfDataArray) {
              const url = window.URL.createObjectURL(item.blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `RFID_${item.serialNumber.replace(/\//g, '_')}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              await new Promise(r => setTimeout(r, 150));
            }
            downloadSuccess = true;
          }
        }
        setProgress(98);
      }
    }

    // Upload to backend
    try {
      const uploadResult = await uploadPDFsToBackend(pdfDataArray);
      setIsGenerating(false);
      const formatText = format === 'word' ? 'Word' : 'PDF';
      const modeText = downloadMode === 'merged' ? `merged ${formatText}` : `${pdfDataArray.length} individual ${formatText} files`;
      alert(`✅ ${uploadResult.files.length} RFID reports generated!\n📥 Downloaded: ${modeText}`);
    } catch (error) {
      setIsGenerating(false);
      const formatText = format === 'word' ? 'Word' : 'PDF';
      const modeText = downloadMode === 'merged' ? `merged ${formatText}` : `${pdfDataArray.length} individual ${formatText} files`;
      alert(`✅ ${pdfDataArray.length} RFID reports generated!\n📥 Downloaded: ${modeText}\n\n⚠️ Upload to server failed: ${error.message}`);
    }
  };

  const deleteRecord = (index) => {
    if (window.confirm('Delete this record?')) {
      setExcelData(excelData.filter((_, i) => i !== index));
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...excelData[index] });
  };

  const saveEdit = () => {
    const newData = [...excelData];
    newData[editingIndex] = editForm;
    setExcelData(newData);
    setEditingIndex(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const clearAllData = () => {
    if (window.confirm('Clear all uploaded data?')) {
      setExcelData([]);
    }
  };

  // Download sample template
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'SerialNumber': 'GS04890TG0802620132',
        'TID': 'E2803821200060214282297O',
        'ModuleType': 'G2G',
        'PVManufacturer': 'Gautam Solar Private Limited',
        'CellManufacturer': 'Solar Space',
        'ModuleManufactureDate': 'Mar,26',
        'CellManufactureDate': 'Dec,25',
        'PVCountry': 'India',
        'CellCountry': 'Laos',
        'Pmax': 633.458931,
        'Vpm': 40.910588,
        'Ipm': 15.483985,
        'FF': 79.659626,
        'Voc': 48.873141,
        'Isc': 16.270839,
        'TestLab': 'DTH',
        'IECDate': '18/01/2025'
      },
      {
        'SerialNumber': 'GS04890TG0802620133',
        'TID': 'E2803821200060214282298P',
        'ModuleType': 'G2G',
        'PVManufacturer': 'Gautam Solar Private Limited',
        'CellManufacturer': 'Solar Space',
        'ModuleManufactureDate': 'Mar,26',
        'CellManufactureDate': 'Dec,25',
        'PVCountry': 'India',
        'CellCountry': 'Laos',
        'Pmax': 635.123456,
        'Vpm': 41.020345,
        'Ipm': 15.512345,
        'FF': 79.812345,
        'Voc': 49.012345,
        'Isc': 16.312345,
        'TestLab': 'DTH',
        'IECDate': '18/01/2025'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 20 },
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFID Data');
    XLSX.writeFile(wb, 'RFID_Sample_Template.xlsx');
  };

  return (
    <div className="bulk-rfid-container">
      <h2>📡 Bulk RFID Report Generator</h2>

      {/* Default Values Configuration */}
      <div className="rfid-defaults-section">
        <h3>⚙️ Default Values (Applied when not in Excel)</h3>
        <div className="rfid-defaults-grid">
          <div className="rfid-default-field">
            <label>PV Module Manufacturer</label>
            <input value={defaults.pvManufacturer} onChange={(e) => setDefaults({ ...defaults, pvManufacturer: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Cell Manufacturer</label>
            <input value={defaults.cellManufacturer} onChange={(e) => setDefaults({ ...defaults, cellManufacturer: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Module Type</label>
            <input value={defaults.moduleTypeDefault} onChange={(e) => setDefaults({ ...defaults, moduleTypeDefault: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Module Mfg Date</label>
            <input value={defaults.moduleManufactureDate} onChange={(e) => setDefaults({ ...defaults, moduleManufactureDate: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Cell Mfg Date</label>
            <input value={defaults.cellManufactureDate} onChange={(e) => setDefaults({ ...defaults, cellManufactureDate: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>PV Module Country</label>
            <input value={defaults.pvCountry} onChange={(e) => setDefaults({ ...defaults, pvCountry: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Cell Country</label>
            <input value={defaults.cellCountry} onChange={(e) => setDefaults({ ...defaults, cellCountry: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>Test Lab</label>
            <input value={defaults.testLab} onChange={(e) => setDefaults({ ...defaults, testLab: e.target.value })} />
          </div>
          <div className="rfid-default-field">
            <label>IEC Certificate Date</label>
            <input value={defaults.iecDate} onChange={(e) => setDefaults({ ...defaults, iecDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="upload-section">
        <div className="upload-box" style={{ gridColumn: '1 / -1' }}>
          <h3>Upload RFID Excel Data</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
            Excel should have columns: SerialNumber, TID, Pmax, Vpm, Ipm, FF, Voc, Isc (+ optional: ModuleType, PVManufacturer, CellManufacturer, etc.)
          </p>

          <button onClick={downloadSampleTemplate} style={{
            backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center',
            gap: '8px', margin: '0 auto 15px auto'
          }}>
            📥 Download Sample Template
          </button>

          <p style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: '600', marginBottom: '10px' }}>
            📊 IV Curve Graphs will be loaded from Graph Manager
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="file-input" />
          {excelData.length > 0 && (
            <div className="success-msg">✓ {excelData.length} RFID records loaded</div>
          )}
        </div>
      </div>

      {/* Data Table */}
      {excelData.length > 0 && (
        <div className="data-table-section">
          <div className="table-header">
            <h3>📋 RFID Records ({excelData.length})</h3>
            {isSuperAdmin() && (
              <button onClick={clearAllData} className="btn-clear" title="Clear all data">🗑️ Clear All</button>
            )}
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Serial Number</th>
                  <th>TID</th>
                  <th>Module Type</th>
                  <th>Pmax</th>
                  <th>Voc</th>
                  <th>Isc</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, index) => (
                  <tr key={index}>
                    {editingIndex === index ? (
                      <>
                        <td>{index + 1}</td>
                        <td><input value={editForm.SerialNumber || ''} onChange={(e) => setEditForm({ ...editForm, SerialNumber: e.target.value })} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><input value={editForm.TID || ''} onChange={(e) => setEditForm({ ...editForm, TID: e.target.value })} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><input value={editForm.ModuleType || ''} onChange={(e) => setEditForm({ ...editForm, ModuleType: e.target.value })} style={{ width: '80px', padding: '4px' }} /></td>
                        <td><input type="number" value={editForm.Pmax || ''} onChange={(e) => setEditForm({ ...editForm, Pmax: e.target.value })} style={{ width: '80px', padding: '4px' }} /></td>
                        <td><input type="number" value={editForm.Voc || ''} onChange={(e) => setEditForm({ ...editForm, Voc: e.target.value })} style={{ width: '70px', padding: '4px' }} /></td>
                        <td><input type="number" value={editForm.Isc || ''} onChange={(e) => setEditForm({ ...editForm, Isc: e.target.value })} style={{ width: '70px', padding: '4px' }} /></td>
                        <td>
                          <button onClick={saveEdit} className="btn-save" title="Save">✓</button>
                          <button onClick={cancelEdit} className="btn-cancel" title="Cancel">✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{index + 1}</td>
                        <td>{row.SerialNumber || '-'}</td>
                        <td style={{ fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.TID || '-'}</td>
                        <td>{row.ModuleType || '-'}</td>
                        <td>{row.Pmax ? parseFloat(row.Pmax).toFixed(2) : '-'}</td>
                        <td>{row.Voc ? parseFloat(row.Voc).toFixed(2) : '-'}</td>
                        <td>{row.Isc ? parseFloat(row.Isc).toFixed(2) : '-'}</td>
                        <td>
                          <button onClick={() => startEdit(index)} className="btn-edit" title="Edit">✏️</button>
                          {isSuperAdmin() && (
                            <button onClick={() => deleteRecord(index)} className="btn-delete" title="Delete">🗑️</button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Section */}
      <div className="generate-section" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>

          {/* Module Type */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Graph Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: moduleType === 'monofacial' ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: moduleType === 'monofacial' ? '#ecfdf5' : '#fff' }}>
                <input type="radio" name="rfidModuleType" value="monofacial" checked={moduleType === 'monofacial'} onChange={(e) => setModuleType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>◻️ Mono</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: moduleType === 'bifacial' ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: moduleType === 'bifacial' ? '#ecfdf5' : '#fff' }}>
                <input type="radio" name="rfidModuleType" value="bifacial" checked={moduleType === 'bifacial'} onChange={(e) => setModuleType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>🔄 Bifacial</span>
              </label>
            </div>
          </div>

          {/* Download Format */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Format</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: downloadFormat === 'pdf' ? '2px solid #ec4899' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadFormat === 'pdf' ? '#fdf2f8' : '#fff' }}>
                <input type="radio" name="rfidFormat" value="pdf" checked={downloadFormat === 'pdf'} onChange={(e) => setDownloadFormat(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📄 PDF</span>
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', border: downloadFormat === 'word' ? '2px solid #ec4899' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadFormat === 'word' ? '#fdf2f8' : '#fff' }}>
                <input type="radio" name="rfidFormat" value="word" checked={downloadFormat === 'word'} onChange={(e) => setDownloadFormat(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📝 Word</span>
              </label>
            </div>
          </div>

          {/* Download Type */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Output Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '10px 8px', border: downloadType === 'merged' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadType === 'merged' ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="rfidDownloadType" value="merged" checked={downloadType === 'merged'} onChange={(e) => setDownloadType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📄 Merged</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Single file</span>
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '10px 8px', border: downloadType === 'split' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: downloadType === 'split' ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="rfidDownloadType" value="split" checked={downloadType === 'split'} onChange={(e) => setDownloadType(e.target.value)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>📑 Split</span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Individual</span>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={() => generateAllReports(downloadType, downloadFormat, moduleType)}
          disabled={isGenerating || excelData.length === 0}
          className="generate-btn"
          style={{ width: '100%', maxWidth: '400px', margin: '0 auto', display: 'block' }}
        >
          {isGenerating ? `Generating... ${Math.round(progress)}%` : `📡 Generate ${downloadType === 'merged' ? 'Merged' : 'Split'} RFID ${downloadFormat.toUpperCase()}`}
        </button>
      </div>

      {isGenerating && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default BulkRFIDGenerator;
