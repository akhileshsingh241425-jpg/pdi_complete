import React from 'react';
import '../styles/RFIDTemplate.css';

const RFIDTemplate = ({ testData, graphImage }) => {
  // Specification table rows
  const specRows = [
    { sno: 1, spec: 'Name of the Manufacturer of PV Module', value: testData.pvManufacturer || 'Gautam Solar Private Limited' },
    { sno: 2, spec: 'Name of the Manufacturer of Solar Cell', value: testData.cellManufacturer || 'Solar Space' },
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
    <div className="rfid-template-page">
      {/* Company Header */}
      <div className="rfid-header">
        <div className="rfid-header-left">
          <div className="rfid-company-name">Gautam Solar Private Limited</div>
          <div className="rfid-address">7 Km Milestone, Tosham Road</div>
          <div className="rfid-address">Dist. Bhiwani</div>
          <div className="rfid-address">Bawani Khera</div>
          <div className="rfid-address">HR 127032</div>
        </div>
        <div className="rfid-header-right">
          <img src="/gautam-solar-logo.jpg" alt="Gautam Solar" className="rfid-logo" />
        </div>
      </div>

      {/* Module Serial Info */}
      <div className="rfid-serial-section">
        <div className="rfid-serial-row">
          <span className="rfid-serial-label">Module Serial Number:</span>
          <span className="rfid-serial-value">{testData.serialNumber || ''}</span>
        </div>
        <div className="rfid-serial-row">
          <span className="rfid-serial-label">TID:</span>
          <span className="rfid-serial-value">{testData.tid || ''}</span>
        </div>
      </div>

      {/* Detailed Specification Label */}
      <div className="rfid-detail-label">Detailed Specification:</div>

      {/* Specification Table */}
      <div className="rfid-table-container">
        <table className="rfid-spec-table">
          <thead>
            <tr>
              <th className="rfid-th-sno">S/no.</th>
              <th className="rfid-th-spec">Specification</th>
              <th className="rfid-th-value">Values</th>
            </tr>
          </thead>
          <tbody>
            {specRows.map((row) => (
              <tr key={row.sno}>
                <td className="rfid-td-sno">{row.sno}</td>
                <td className="rfid-td-spec">{row.spec}</td>
                <td className="rfid-td-value">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IV Characteristics Section */}
      <div className="rfid-iv-section">
        <div className="rfid-iv-title">IV Characterstics of the Module:</div>
        <div className="rfid-graph-container">
          {graphImage ? (
            <img src={graphImage} alt="IV Characteristics" className="rfid-graph-image" />
          ) : (
            <div className="rfid-graph-placeholder">IV Curve Graph not available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFIDTemplate;
