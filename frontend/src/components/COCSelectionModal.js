import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MATERIAL_REQUIREMENTS, calculateMaterialRequirements } from '../constants/materialRequirements';
import '../styles/COCSelectionModal.css';

const COCSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productionQty,
  companyId,
  existingSelections = {}
}) => {
  const [availableCOCs, setAvailableCOCs] = useState([]);
  const [selectedCOCs, setSelectedCOCs] = useState(existingSelections);
  const [loading, setLoading] = useState(true);
  const [materialRequirements, setMaterialRequirements] = useState({});

  useEffect(() => {
    if (isOpen && productionQty > 0) {
      // Calculate requirements
      const requirements = calculateMaterialRequirements(productionQty);
      setMaterialRequirements(requirements);
      
      // Fetch available COCs
      fetchAvailableCOCs();
    }
  }, [isOpen, productionQty]);

  const fetchAvailableCOCs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5002/api/coc/list', {
        params: {
          company_id: companyId // Filter by company if needed
        }
      });

      // Group COCs by material type
      const groupedCOCs = {};
      const cocList = response.data.data || response.data.coc_list || [];
      
      cocList.forEach(coc => {
        const material = coc.material; // Field name is 'material' not 'material_name'
        if (!groupedCOCs[material]) {
          groupedCOCs[material] = [];
        }
        groupedCOCs[material].push(coc);
      });

      console.log('Grouped COCs:', groupedCOCs); // Debug log
      setAvailableCOCs(groupedCOCs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching COCs:', error);
      setLoading(false);
    }
  };

  const handleCOCSelect = (materialName, coc) => {
    setSelectedCOCs(prev => ({
      ...prev,
      [materialName]: {
        lot_batch_no: coc.lot_batch_no,
        invoice_no: coc.invoice_no,
        invoice_date: coc.invoice_date,
        brand: coc.brand,
        available_qty: coc.available_qty,
        consumed_qty: coc.consumed_qty,
        received_qty: coc.coc_qty, // Use coc_qty as received_qty
        material: coc.material // Correct field name
      }
    }));
  };

  const handleRemoveCOC = (materialName) => {
    setSelectedCOCs(prev => {
      const updated = { ...prev };
      delete updated[materialName];
      return updated;
    });
  };

  const calculateModulesFromCOC = (availableQty, requiredPerModule) => {
    return Math.floor(availableQty / requiredPerModule);
  };

  const calculateRemainingAfterProduction = (availableQty, totalRequired) => {
    return availableQty - totalRequired;
  };

  const handleConfirm = () => {
    // Check if all required materials have COC selected
    const missingMaterials = Object.keys(materialRequirements).filter(
      mat => !selectedCOCs[mat]
    );

    if (missingMaterials.length > 0) {
      alert(`Please select COC for: ${missingMaterials.join(', ')}`);
      return;
    }

    onConfirm(selectedCOCs);
  };

  if (!isOpen) return null;

  return (
    <div className="coc-modal-overlay">
      <div className="coc-modal-container">
        <div className="coc-modal-header">
          <h2>Select COC for Materials</h2>
          <div className="production-info">
            Production Quantity: <strong>{productionQty} modules</strong>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="coc-modal-body">
          {loading ? (
            <div className="loading">Loading COC data...</div>
          ) : (
            <div className="materials-grid">
              {Object.entries(materialRequirements).map(([materialName, requirement]) => {
                const cocMaterialType = requirement.cocMaterial;
                const availableCOCsList = availableCOCs[cocMaterialType] || [];
                const selectedCOC = selectedCOCs[materialName];
                const requiredQty = requirement.totalRequired;

                return (
                  <div key={materialName} className="material-section">
                    <div className="material-header">
                      <h3>{materialName}</h3>
                      <div className="material-requirement">
                        Required: <strong>{requiredQty.toFixed(3)} {requirement.unit}</strong>
                        {requirement.description && (
                          <span className="material-desc"> ({requirement.description})</span>
                        )}
                      </div>
                    </div>

                    {selectedCOC ? (
                      <div className="selected-coc-card">
                        <div className="coc-card-header">
                          <span className="invoice-badge">
                            Invoice: {selectedCOC.invoice_no}
                          </span>
                          <button 
                            className="remove-btn"
                            onClick={() => handleRemoveCOC(materialName)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="coc-details">
                          <div className="coc-detail-row">
                            <span>Lot/Batch:</span>
                            <strong>{selectedCOC.lot_batch_no}</strong>
                          </div>
                          <div className="coc-detail-row">
                            <span>Brand:</span>
                            <strong>{selectedCOC.brand}</strong>
                          </div>
                          <div className="coc-detail-row">
                            <span>Available:</span>
                            <strong>{selectedCOC.available_qty} {requirement.unit}</strong>
                          </div>
                          <div className="coc-detail-row">
                            <span>Modules Possible:</span>
                            <strong className="modules-possible">
                              {calculateModulesFromCOC(selectedCOC.available_qty, requirement.quantity)} modules
                            </strong>
                          </div>
                          <div className="coc-detail-row">
                            <span>After This Production:</span>
                            <strong className={
                              calculateRemainingAfterProduction(selectedCOC.available_qty, requiredQty) < 0 
                                ? 'negative-qty' 
                                : 'positive-qty'
                            }>
                              {calculateRemainingAfterProduction(selectedCOC.available_qty, requiredQty).toFixed(3)} {requirement.unit}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="coc-selection-area">
                        <div className="no-coc-warning">
                          ⚠️ No COC Selected
                        </div>
                        <div className="available-cocs-list">
                          {availableCOCsList.length > 0 ? (
                            availableCOCsList.map((coc, idx) => {
                              const modulesPossible = calculateModulesFromCOC(
                                coc.available_qty, 
                                requirement.quantity
                              );
                              const remainingAfter = calculateRemainingAfterProduction(
                                coc.available_qty, 
                                requiredQty
                              );
                              const isInsufficient = remainingAfter < 0;

                              return (
                                <button
                                  key={idx}
                                  className={`coc-option-btn ${isInsufficient ? 'insufficient' : ''}`}
                                  onClick={() => handleCOCSelect(materialName, coc)}
                                  disabled={isInsufficient}
                                >
                                  <div className="coc-btn-header">
                                    <span className="invoice-no">📄 {coc.invoice_no}</span>
                                    {isInsufficient && (
                                      <span className="insufficient-badge">Insufficient</span>
                                    )}
                                  </div>
                                  <div className="coc-btn-details">
                                    <div className="coc-btn-row">
                                      <span>Brand:</span> {coc.brand}
                                    </div>
                                    <div className="coc-btn-row">
                                      <span>Available:</span> {coc.available_qty} {requirement.unit}
                                    </div>
                                    <div className="coc-btn-row">
                                      <span>Can Produce:</span> 
                                      <strong>{modulesPossible} modules</strong>
                                    </div>
                                    <div className="coc-btn-row">
                                      <span>After Production:</span>
                                      <strong className={remainingAfter < 0 ? 'negative' : 'positive'}>
                                        {remainingAfter.toFixed(3)} {requirement.unit}
                                      </strong>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="no-coc-available">
                              No COC available for {cocMaterialType}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="coc-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm COC Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default COCSelectionModal;
