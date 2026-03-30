import React from 'react';
import '../styles/RFIDTemplate.css';

const RFIDTemplate = ({ testData, graphImage }) => {
  const specRows = [
    { sno: 1, spec: 'Name of the Manufacturer of PV Module', value: testData.pvManufacturer || 'Gautam Solar Private Limited' },
    { sno: 2, spec: 'Name of the Manufacturer of Solar Cell', value: testData.cellManufacturer || 'SOLAR SPACE' },
    { sno: 3, spec: 'Module Type', value: testData.moduleType || 'G2G' },
    { sno: 4, spec: 'Month & Year of the Manufacture of Module', value: testData.moduleManufactureDate || '' },
    { sno: 5, spec: 'Month & Year of the Manufacture of Solar Cell', value: testData.cellManufactureDate || '' },
    { sno: 6, spec: 'Country of Origin for PV Module', value: testData.pvCountry || 'India' },
    { sno: 7, spec: 'Country of Origin for Solar Cell', value: testData.cellCountry || 'Laos' },
    { sno: 8, spec: 'Power: P-Max of the Module', value: testData.pmax != null ? parseFloat(testData.pmax).toFixed(6) : '' },
    { sno: 9, spec: 'Voltage: V-Max of the Module', value: testData.vmax != null ? parseFloat(testData.vmax).toFixed(6) : '' },
    { sno: 10, spec: 'Current: I-Max of the Module', value: testData.imax != null ? parseFloat(testData.imax).toFixed(6) : '' },
    { sno: 11, spec: 'Fill Factor (FF) of the Module', value: testData.fillFactor != null ? parseFloat(testData.fillFactor).toFixed(6) : '' },
    { sno: 12, spec: 'VOC', value: testData.voc != null ? parseFloat(testData.voc).toFixed(6) : '' },
    { sno: 13, spec: 'ISC', value: testData.isc != null ? parseFloat(testData.isc).toFixed(6) : '' },
    { sno: 14, spec: 'Name of The Test Lab Issuing IEC Certificate', value: testData.testLab || 'DTH' },
    { sno: 15, spec: 'Date of Obtaining IEC Certificate', value: testData.iecDate || '' },
  ];

  // Inline styles to ensure html2pdf/html2canvas renders colors correctly
  const BLUE = '#0000FF';
  const GREY = '#3E3E3E';
  const GOLD = '#FFC600';

  return (
    <div className="rfid-page" style={{ width: '210mm', minHeight: '297mm', background: '#fff', padding: '10mm 12mm', fontFamily: "'Times New Roman', Times, serif", color: '#000', boxSizing: 'border-box' }}>
      {/* Logo right-aligned, Company info centered below */}
      <div className="rfid-header" style={{ marginBottom: '4mm' }}>
        <div className="rfid-logo-row" style={{ textAlign: 'center', marginBottom: '1mm' }}>
          <img src="/gautam-solar-logo.png" alt="Gautam Solar" className="rfid-logo" style={{ width: '55mm', height: 'auto' }} />
        </div>
        <div className="rfid-company-block" style={{ textAlign: 'center' }}>
          <div className="rfid-company-name" style={{ fontSize: '12pt', fontWeight: 700, color: BLUE, marginBottom: '1px' }}>Gautam Solar Private Limited</div>
          <div className="rfid-company-addr" style={{ fontSize: '9pt', fontWeight: 700, color: BLUE, lineHeight: 1.45 }}>7 Km Milestone, Tosham Road</div>
          <div className="rfid-company-addr" style={{ fontSize: '9pt', fontWeight: 700, color: BLUE, lineHeight: 1.45 }}>Dist. Bhiwani</div>
          <div className="rfid-company-addr" style={{ fontSize: '9pt', fontWeight: 700, color: BLUE, lineHeight: 1.45 }}>Bawani Khera</div>
          <div className="rfid-company-addr" style={{ fontSize: '9pt', fontWeight: 700, color: BLUE, lineHeight: 1.45 }}>HR 127032</div>
        </div>
      </div>

      {/* Serial Number & TID */}
      <div className="rfid-serial-block" style={{ margin: '2mm 0 3mm 0' }}>
        <div className="rfid-serial-line" style={{ marginBottom: '0.5mm' }}>
          <span className="rfid-serial-label" style={{ fontSize: '9.5pt', fontWeight: 700, color: GREY, marginRight: '2mm' }}>Module Serial Number:</span>
          <span className="rfid-serial-val" style={{ fontSize: '9.5pt', color: GREY }}>{testData.serialNumber || ''}</span>
        </div>
        <div className="rfid-serial-line" style={{ marginBottom: '0.5mm' }}>
          <span className="rfid-serial-label" style={{ fontSize: '9.5pt', fontWeight: 700, color: GREY, marginRight: '2mm' }}>TID:</span>
          <span className="rfid-serial-val" style={{ fontSize: '9.5pt', color: GREY }}>{testData.tid || ''}</span>
        </div>
      </div>

      {/* Detailed Specification underlined heading */}
      <div className="rfid-spec-heading" style={{ fontSize: '9.5pt', fontWeight: 700, color: BLUE, textDecoration: 'underline', marginBottom: '1mm' }}>Detailed Specification:</div>
      <hr className="rfid-spec-line" style={{ height: '2px', background: '#cc0000', border: 'none', marginBottom: '2mm' }} />

      {/* Specification Table */}
      <table className="rfid-spec-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '3mm' }}>
        <thead>
          <tr>
            <th className="rfid-col-sno" style={{ border: '0.5pt solid #000', padding: '2pt 4pt', fontWeight: 700, fontSize: '9pt', textAlign: 'center', color: GOLD, width: '7%' }}><u>S/no.</u></th>
            <th className="rfid-col-spec" style={{ border: '0.5pt solid #000', padding: '2pt 4pt', fontWeight: 700, fontSize: '9pt', textAlign: 'left', color: GOLD, width: '58%' }}><u>Specifications</u></th>
            <th className="rfid-col-val" style={{ border: '0.5pt solid #000', padding: '2pt 4pt', fontWeight: 700, fontSize: '9pt', textAlign: 'left', color: GOLD, width: '35%' }}><u>Values</u></th>
          </tr>
        </thead>
        <tbody>
          {specRows.map((row) => (
            <tr key={row.sno}>
              <td className="rfid-cell-sno" style={{ border: '0.5pt solid #000', padding: '1.5pt 4pt', fontSize: '9pt', color: '#000', textAlign: 'center' }}>{row.sno}</td>
              <td className="rfid-cell-spec" style={{ border: '0.5pt solid #000', padding: '1.5pt 4pt', fontSize: '9pt', color: '#000' }}>{row.spec}</td>
              <td className="rfid-cell-val" style={{ border: '0.5pt solid #000', padding: '1.5pt 4pt', fontSize: '9pt', color: '#000' }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* IV Characteristics */}
      <div className="rfid-iv-heading" style={{ fontSize: '9.5pt', fontWeight: 700, color: BLUE, textDecoration: 'underline', margin: '2mm 0' }}>IV Characterstics of the Module:</div>
      <div className="rfid-graph-box" style={{ width: '100%', height: '82mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {graphImage ? (
          <img src={graphImage} alt="IV Characteristics" className="rfid-graph-img" style={{ maxWidth: '100%', maxHeight: '82mm', objectFit: 'contain' }} />
        ) : (
          <div className="rfid-graph-empty" style={{ color: '#999', fontSize: '11pt' }}>IV Curve Graph not available</div>
        )}
      </div>
    </div>
  );
};

export default RFIDTemplate;
