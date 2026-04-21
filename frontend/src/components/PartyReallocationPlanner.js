import React, { useEffect, useMemo, useState } from 'react';
import '../styles/PartyReallocationPlanner.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5003/api'
  : '/api';

// Only these parties should appear in the Packed Under Party selector.
const VALID_PACKING_PARTY_NAMES = [
  'KPI GREEN ENERGY LIMITED',
  'BONDADA ENGINEERING LIMITED',
  'STERLING AND WILSON RENEWABLE ENERGY LIMITED',
  'ILIOS POWER PRIVATE LIMITED',
  'PURSHOTAM PROFILES PVT LTD',
  'ORIANA POWER LIMITED',
  'MEGHA ENGINEERING AND INFRASTRUCTURES LIMITED',
  'PERIMETER SOLUTIONS',
  'EASTMAN AUTO & POWER LIMITED',
  'SUNDROPS ENERGIA PRIVATE LIMITED',
  'RENNY STRIPS PVT LTD',
  'KIRLOSKAR SOLAR TECHNOLOGIES PVT LTD',
  'M/S VIDYUT ENERGY SYSTEMS PRIVATE LIMITED',
  'ENRICH ENERGY PVT. LTD.',
  'RMC SWITCH GEARS LIMITED',
  'ENERTURE TECHNOLOGIES PVT LTD',
  'ULTRA VIBRANT SOLAR ENERGY PVT. LTD.',
  'MATHURESH SYNERGY PVT LTD',
  'B R MANJU CONSTRUCTION COMPANY',
  'POLYCAB INDIA LIMITED',
  'EAPRO GLOBAL ENERGY PRIVATE LIMITED',
  'QUANT SOLAR',
  'SMARTEN POWER SYSTEMS LTD',
  'TERAVON GREEN ENERGIES LIMITED',
  'SARIKA NHPC',
  'GODREJ & BOYCE MFG CO LTD.',
  'JOTTER RENEWABLES PRIVATE LIMITED',
  'GO SOLAR ENERGY SOLUTION PRIVATE LIMITED',
  'NEVRONAS SOLAR PRIVATE LIMITED',
  'LIVGUARD ENERGY TECHNOLOGIES PVT LTD',
  'MOGLI LABS (INDIA) PRIVATE LIMITED',
  'SU-KAM POWER SYSTEMS LTD',
  'LIVFAST BATTERIES PVT. LTD.',
  'VIDYUT ENERGY SYSTEMS PRIVATE LIMITED',
  'NEXUS SOLAR ENERGY PVT LTD',
  'RENEWPRO ENERGY PVT. LTD.',
  'ABORIGINAL ENERGY PVT LTD',
  'GALO ENERGY PVT LTD',
  'SOLAR ERA',
  'KIRLOSKAR SOLAR TECHNOLOGIES PVT LTD,MH',
  'NEXAUM ENERGY PVT.LTD.',
  'RAYS POWER INFRA LIMITED',
  'SMART CONSTRUCTION',
  'ROCS ENGINEERS',
  'CARTWHEEL ENERGY',
  'GHANPRIYA ENERGY SOLUTION PRIVATE LIMITED',
  'TEST',
  'REDINGTON LIMITED KARNATAKA'
];

const filterBySearch = (parties, term) => {
  const query = (term || '').trim().toLowerCase();
  if (!query) return parties;
  return parties.filter((p) => (p.companyName || '').toLowerCase().includes(query));
};

const normalizeName = (value) => (value || '').trim().toLowerCase();

const PartyReallocationPlanner = () => {
  const [parties, setParties] = useState([]);
  const [packedPartyIds, setPackedPartyIds] = useState([]);
  const [dispatchPartyIds, setDispatchPartyIds] = useState([]);
  const [packedSearch, setPackedSearch] = useState('');
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const packingNameSet = useMemo(
    () => new Set(VALID_PACKING_PARTY_NAMES.map(normalizeName)),
    []
  );

  useEffect(() => {
    const loadParties = async () => {
      setLoadingParties(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/ftr/sales-parties`);
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load parties');
        }
        const list = Array.isArray(data.parties) ? data.parties : [];
        setParties(list);
      } catch (err) {
        setError(err.message || 'Unable to load party list');
        setParties([]);
      } finally {
        setLoadingParties(false);
      }
    };

    loadParties();
  }, []);

  const packedOnlyParties = useMemo(
    () => parties.filter((p) => packingNameSet.has(normalizeName(p.companyName))),
    [parties, packingNameSet]
  );

  const packedFiltered = useMemo(
    () => filterBySearch(packedOnlyParties, packedSearch),
    [packedOnlyParties, packedSearch]
  );
  const dispatchFiltered = useMemo(() => filterBySearch(parties, dispatchSearch), [parties, dispatchSearch]);

  useEffect(() => {
    // Keep only valid packed-party selections when list changes.
    setPackedPartyIds((prev) => prev.filter((id) => packedOnlyParties.some((p) => p.id === id)));
  }, [packedOnlyParties]);

  const togglePacked = (id) => {
    setPackedPartyIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const toggleDispatch = (id) => {
    setDispatchPartyIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const selectAllPackedFiltered = () => {
    setPackedPartyIds((prev) => {
      const next = new Set(prev);
      packedFiltered.forEach((p) => next.add(p.id));
      return Array.from(next);
    });
  };

  const selectAllDispatchFiltered = () => {
    setDispatchPartyIds((prev) => {
      const next = new Set(prev);
      dispatchFiltered.forEach((p) => next.add(p.id));
      return Array.from(next);
    });
  };

  const runAnalysis = async () => {
    if (packedPartyIds.length === 0 || dispatchPartyIds.length === 0) {
      setError('Please select at least one packed party and one dispatch party.');
      return;
    }

    setLoadingAnalysis(true);
    setError('');
    setAnalysis(null);

    try {
      const packedSelections = parties.filter((p) => packedPartyIds.includes(p.id));
      const dispatchSelections = parties.filter((p) => dispatchPartyIds.includes(p.id));

      const packedSummaries = await Promise.all(
        packedSelections.map(async (party) => {
          const resp = await fetch(`${API_BASE_URL}/ftr/packing-count-by-party/${party.id}`);
          const data = await resp.json();
          if (!data.success) {
            throw new Error(data.error || `Unable to fetch packing count for ${party.companyName}`);
          }
          return {
            partyId: party.id,
            partyName: party.companyName,
            packingCount: Number(data.packing_count || 0)
          };
        })
      );

      const dispatchSummaries = await Promise.all(
        dispatchSelections.map(async (party) => {
          const resp = await fetch(
            `${API_BASE_URL}/ftr/dispatch-by-party/${party.id}?name=${encodeURIComponent(party.companyName || '')}`
          );
          const data = await resp.json();
          if (!data.success) {
            throw new Error(data.error || `Unable to fetch dispatch data for ${party.companyName}`);
          }
          return {
            partyId: party.id,
            partyName: party.companyName,
            dispatchCount: Number(data?.summary?.dispatched || 0),
            vehicleGroups: (data.dispatch_groups || []).length,
            palletGroups: (data.pallet_groups || []).length
          };
        })
      );

      const rows = [];
      packedSummaries.forEach((packed) => {
        dispatchSummaries.forEach((dispatch) => {
          rows.push({
            packedPartyName: packed.partyName,
            packedPartyId: packed.partyId,
            packedCount: packed.packingCount,
            dispatchPartyName: dispatch.partyName,
            dispatchPartyId: dispatch.partyId,
            dispatchCount: dispatch.dispatchCount,
            status: packed.packingCount > 0 ? 'Possible' : 'No packed modules found'
          });
        });
      });

      setAnalysis({
        packedSummaries,
        dispatchSummaries,
        rows,
        totalPackedCount: packedSummaries.reduce((sum, x) => sum + x.packingCount, 0),
        totalDispatchedCount: dispatchSummaries.reduce((sum, x) => sum + x.dispatchCount, 0)
      });
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="party-reallocation-planner">
      <div className="planner-header">
        <h1>Dynamic Party Reallocation Planner</h1>
        <p>
          Read-only analysis tool: packed party aur dispatch party ko dynamic select karo.
          Existing Dispatch Tracker logic unchanged rahega.
        </p>
      </div>

      <div className="planner-card">
        <div className="planner-grid">
          <div className="planner-field">
            <label>Packed Under Party (Validated Packing Parties Only)</label>
            <input
              type="text"
              placeholder="Search packed parties..."
              value={packedSearch}
              onChange={(e) => setPackedSearch(e.target.value)}
              disabled={loadingParties || loadingAnalysis}
              className="party-search"
            />
            <div className="mini-actions">
              <button type="button" onClick={selectAllPackedFiltered} disabled={loadingParties || loadingAnalysis}>Select Filtered</button>
              <button type="button" onClick={() => setPackedPartyIds([])} disabled={loadingParties || loadingAnalysis}>Clear</button>
              <span>{packedPartyIds.length} selected</span>
            </div>
            <div className="checkbox-list">
              {packedFiltered.map((p) => (
                <label key={p.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={packedPartyIds.includes(p.id)}
                    onChange={() => togglePacked(p.id)}
                    disabled={loadingParties || loadingAnalysis}
                  />
                  <span>{p.companyName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="planner-field">
            <label>Dispatch To Party (Search + Checkbox Multi-select)</label>
            <input
              type="text"
              placeholder="Search dispatch parties..."
              value={dispatchSearch}
              onChange={(e) => setDispatchSearch(e.target.value)}
              disabled={loadingParties || loadingAnalysis}
              className="party-search"
            />
            <div className="mini-actions">
              <button type="button" onClick={selectAllDispatchFiltered} disabled={loadingParties || loadingAnalysis}>Select Filtered</button>
              <button type="button" onClick={() => setDispatchPartyIds([])} disabled={loadingParties || loadingAnalysis}>Clear</button>
              <span>{dispatchPartyIds.length} selected</span>
            </div>
            <div className="checkbox-list">
              {dispatchFiltered.map((p) => (
                <label key={p.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={dispatchPartyIds.includes(p.id)}
                    onChange={() => toggleDispatch(p.id)}
                    disabled={loadingParties || loadingAnalysis}
                  />
                  <span>{p.companyName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="planner-actions">
          <button
            className="analyze-btn"
            type="button"
            onClick={runAnalysis}
            disabled={loadingParties || loadingAnalysis}
          >
            {loadingAnalysis ? 'Analyzing...' : 'Analyze Reallocation'}
          </button>
        </div>

        {loadingParties && <p className="info">Loading parties...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {analysis && (
        <>
        <div className="planner-results">
          <div className="result-card">
            <h3>Packed Parties</h3>
            <p><strong>Selected:</strong> {analysis.packedSummaries.length}</p>
            <p><strong>Total Packing Count:</strong> {analysis.totalPackedCount.toLocaleString()}</p>
          </div>

          <div className="result-card">
            <h3>Dispatch Parties</h3>
            <p><strong>Selected:</strong> {analysis.dispatchSummaries.length}</p>
            <p><strong>Total Already Dispatched:</strong> {analysis.totalDispatchedCount.toLocaleString()}</p>
          </div>

          <div className="result-card highlight">
            <h3>Decision Support</h3>
            <p><strong>Comparison Rows:</strong> {analysis.rows.length}</p>
            <p><strong>Status Rule:</strong> Possible if packed count &gt; 0</p>
            <p><strong>Mode:</strong> Multi-party matrix</p>
          </div>
        </div>

        <div className="result-table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Packed Party</th>
                <th>Packed Count</th>
                <th>Dispatch Party</th>
                <th>Already Dispatched</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((row, idx) => (
                <tr key={`${row.packedPartyId}-${row.dispatchPartyId}`}>
                  <td>{idx + 1}</td>
                  <td>{row.packedPartyName}</td>
                  <td>{row.packedCount.toLocaleString()}</td>
                  <td>{row.dispatchPartyName}</td>
                  <td>{row.dispatchCount.toLocaleString()}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};

export default PartyReallocationPlanner;
