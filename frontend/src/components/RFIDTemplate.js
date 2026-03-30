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

  return (
    <div className="rfid-page">
      {/* Logo right-aligned, Company info centered below */}
      <div className="rfid-header">
        <div className="rfid-logo-row">
          <img src="/gautam-solar-logo.png" alt="Gautam Solar" className="rfid-logo" />
        </div>
        <div className="rfid-company-block">
          <div className="rfid-company-name">Gautam Solar Private Limited</div>
          <div className="rfid-company-addr">7 Km Milestone, Tosham Road</div>
          <div className="rfid-company-addr">Dist. Bhiwani</div>
          <div className="rfid-company-addr">Bawani Khera</div>
          <div className="rfid-company-addr">HR 127032</div>
        </div>
      </div>

      {/* Serial Number & TID */}
      <div className="rfid-serial-block">
        <div className="rfid-serial-line">
          <span className="rfid-serial-label">Module Serial Number:</span>
          <span className="rfid-serial-val">{testData.serialNumber || ''}</span>
        </div>
        <div className="rfid-serial-line">
          <span className="rfid-serial-label">TID:</span>
          <span className="rfid-serial-val">{testData.tid || ''}</span>
        </div>
      </div>

      {/* Detailed Specification underlined heading */}
      <div className="rfid-spec-heading">Detailed Specification:</div>
      <hr className="rfid-spec-line" />

      {/* Specification Table */}
      <table className="rfid-spec-table">
        <thead>
          <tr>
            <th className="rfid-col-sno"><u>S/no.</u></th>
            <th className="rfid-col-spec"><u>Specifications</u></th>
            <th className="rfid-col-val"><u>Values</u></th>
          </tr>
        </thead>
        <tbody>
          {specRows.map((row) => (
            <tr key={row.sno}>
              <td className="rfid-cell-sno">{row.sno}</td>
              <td className="rfid-cell-spec">{row.spec}</td>
              <td className="rfid-cell-val">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* IV Characteristics */}
      <div className="rfid-iv-heading">IV Characterstics of the Module:</div>
      <div className="rfid-graph-box">
        {graphImage ? (
          <img src={graphImage} alt="IV Characteristics" className="rfid-graph-img" />
        ) : (
          <div className="rfid-graph-empty">IV Curve Graph not available</div>
        )}
      </div>
    </div>
  );
};

export default RFIDTemplate;
