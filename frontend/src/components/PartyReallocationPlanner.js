import React, { useEffect, useMemo, useState } from 'react';
import '../styles/PartyReallocationPlanner.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5003/api'
  : '/api';

// Only these parties should appear in the Packed Under Party selector.
const VALID_PACKING_PARTY_IDS = [
  'fda91e0b-f0fd-4749-863f-ed7a56842a0e',
  'ec1a1584-a5d2-4bfe-bb02-150c844dcf6a',
  '141b81a0-2bab-4790-b825-3c8734d41484',
  '0700f941-cfea-41b7-af89-4f07f48d3f03',
  '4eb20c96-03f6-4ae7-97d7-7e9377a7ef85',
  'dc60ecbe-e490-4063-8ab5-385d2698bf7f',
  'e6c9c89a-df64-4dbd-8e2e-68442513d0fa',
  'f0c1cca6-ec37-4e07-ab28-b067dc7020f5',
  '6831a72b-a8cf-4d3e-969a-d1376dea07b2',
  '41c8dd06-ef43-453a-bcec-d6a2e115b408',
  'b1f03e86-b8dd-43dc-9daa-f97db87d9f8c',
  '56e5d3c9-3a47-4f3e-b7e8-a464d04c70d3',
  '61b36a5d-a521-4c5c-afef-de24e20795e3',
  '6a65c156-ad9f-44d7-a981-219a50b3a326',
  '640f8f8a-f8db-4944-aba3-cadb1bc37a3b',
  'cdd7fde6-22ef-42fb-a3c1-b885f4ede3ff',
  'bcf78c5c-03e1-4ab0-84af-16ed0e82e492',
  'f9d1d0b3-1321-4fa5-a1a3-3ce218e26761',
  '4f349ea4-c00f-4e9e-aa84-49c9b33ebd04',
  '027b287b-d263-4dde-b791-a14319254edf',
  '105f975a-92d5-4b44-bb25-ab38db14e6bd',
  '88943d4f-8114-4f10-b7b0-c8ce8f851036',
  'a28ee199-97ec-4fdd-9b69-10e1b3a3710b',
  'c3a077f7-8fcd-45e1-b5c1-c52254f0a7c2',
  '1dbdc9dd-1371-4dce-b6ef-88c5aefa1822',
  '2e6eccad-11b3-400c-899a-b6601585b878',
  '9c62bda6-1dca-4ecb-9e90-ddf93d230a99',
  'bf29ae45-a8ad-4148-889f-0c6e68408104',
  '37f25d1d-07c7-4f7d-abab-55fa8a5cb76a',
  'a5663a7b-a757-4a93-b9d6-ca0d4383ef37',
  '2a10a825-9060-4b89-ae4c-36341ecbcc2d',
  '1b787595-4dee-4d78-8863-94ec1a258bb0',
  '6b825e44-2617-425f-aca1-55468543fdf5',
  '4666e7a6-9d5e-4456-8b73-0d5211fc73f4',
  'af8f8a8b-7667-4202-a45b-f698f7869357',
  '7c01ecff-e66d-49f8-9c74-c5ea92285b63',
  '9fa1b570-cff2-4f6e-8292-847efe465b90',
  '6121c749-f501-4afa-a2f8-2fbd2e98506a',
  '84db7871-439e-404c-b6f8-994a79d2790d',
  'a46e1a8d-e5f2-4584-a7db-44c41bcedce4',
  '6ab5098c-6232-49e3-ac87-1124c0556e9b',
  '931db2c5-b016-4914-b378-69e9f22562a7',
  'a868e97e-afd7-48fc-9068-abd4d093d8bf',
  '6ed97fd8-6bbb-4371-8d56-f9af22e55bb0',
  '125d8a73-a049-4072-886f-a9bb232a92eb',
  '22f70b96-f5c5-49d3-9cb2-6d147f4c8544',
  'd4e90eed-ae2c-41f7-abc4-c4c009018537',
  'd7e17b71-aa20-4165-a729-6f62f0505943'
];

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

const parseSerials = (value) => {
  const tokens = (value || '')
    .split(/[\s,;|]+/)
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);

  return Array.from(new Set(tokens));
};

const getWorkspaceCounts = (workspace = {}) => ({
  pdiCount: Number(workspace?.counts?.pdi || 0),
  runningCount: Number(workspace?.counts?.runningOrder || 0),
  barcodeCount: Number(workspace?.counts?.barcode || 0),
  rejectionCount: Number(workspace?.counts?.rejection || 0),
  smtModuleCount: Number(workspace?.counts?.smtModule || 0)
});

const buildWorkspaceComparison = (pdiText, runningOrderText, barcodeText, rejectionText, smtModuleText) => {
  const pdiSet = new Set(parseSerials(pdiText));
  const runningSet = new Set(parseSerials(runningOrderText));
  const barcodeSet = new Set(parseSerials(barcodeText));
  const rejectionSet = new Set(parseSerials(rejectionText));
  const smtSet = new Set(parseSerials(smtModuleText));

  const pdiOnly = Array.from(pdiSet).filter((x) => !runningSet.has(x));
  const runningOnly = Array.from(runningSet).filter((x) => !pdiSet.has(x));
  const barcodeOnly = Array.from(barcodeSet).filter((x) => !pdiSet.has(x));
  const pdiNotInBarcode = Array.from(pdiSet).filter((x) => !barcodeSet.has(x));
  const matchedPdiRunning = Array.from(pdiSet).filter((x) => runningSet.has(x));
  const matchedPdiBarcode = Array.from(pdiSet).filter((x) => barcodeSet.has(x));
  const rejectedAlsoInPdi = Array.from(rejectionSet).filter((x) => pdiSet.has(x));
  const smtNotInPdi = Array.from(smtSet).filter((x) => !pdiSet.has(x));

  return {
    totals: {
      pdi: pdiSet.size,
      running: runningSet.size,
      barcode: barcodeSet.size,
      rejection: rejectionSet.size,
      smtModule: smtSet.size,
      matchedPdiRunning: matchedPdiRunning.length,
      matchedPdiBarcode: matchedPdiBarcode.length,
      rejectedAlsoInPdi: rejectedAlsoInPdi.length
    },
    pdiOnly,
    runningOnly,
    barcodeOnly,
    pdiNotInBarcode,
    smtNotInPdi
  };
};

const PartyReallocationPlanner = () => {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialPartyIdFromUrl = (queryParams.get('partyId') || '').trim();
  const isPartyDetailMode = Boolean(initialPartyIdFromUrl);

  const [parties, setParties] = useState([]);
  const [packedPartyIds, setPackedPartyIds] = useState([]);
  const [dispatchPartyIds, setDispatchPartyIds] = useState([]);
  const [packedSearch, setPackedSearch] = useState('');
  const [dispatchSearch, setDispatchSearch] = useState('');
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [partyCardSearch, setPartyCardSearch] = useState('');
  const [activePartyId, setActivePartyId] = useState(initialPartyIdFromUrl);

  // New PDI lookup (mrp.umanerp.com/get/get_pdi_barcodes.php)
  const [pdiIdInput, setPdiIdInput] = useState('');
  const [pdiLookupLoading, setPdiLookupLoading] = useState(false);
  const [pdiLookupError, setPdiLookupError] = useState('');
  const [pdiLookupData, setPdiLookupData] = useState(null);
  const [pdiBarcodeFilter, setPdiBarcodeFilter] = useState('');

  const [pdiCards, setPdiCards] = useState([]);
  const [loadingPdiCards, setLoadingPdiCards] = useState(false);
  const [newPdiCardName, setNewPdiCardName] = useState('');
  const [activePdiKey, setActivePdiKey] = useState('');
  const [partyWorkspaceMap, setPartyWorkspaceMap] = useState({});
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [editorPdi, setEditorPdi] = useState('');
  const [editorRunningOrder, setEditorRunningOrder] = useState('');
  const [editorBarcode, setEditorBarcode] = useState('');
  const [editorRejection, setEditorRejection] = useState('');
  const [editorSmtModule, setEditorSmtModule] = useState('');
  const [editorPdiNumber, setEditorPdiNumber] = useState('');
  const [editorRunningOrderNumber, setEditorRunningOrderNumber] = useState('');
  const [rfidExcelFile, setRfidExcelFile] = useState(null);
  const [uploadingRfid, setUploadingRfid] = useState(false);
  const [rfidRowCount, setRfidRowCount] = useState(0);
  const [rfidUploadedAt, setRfidUploadedAt] = useState('');
  const [workspaceSavedAt, setWorkspaceSavedAt] = useState('');

  const packingNameSet = useMemo(
    () => new Set(VALID_PACKING_PARTY_NAMES.map(normalizeName)),
    []
  );
  const packingIdSet = useMemo(() => new Set(VALID_PACKING_PARTY_IDS), []);

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

        const summaryRes = await fetch(`${API_BASE_URL}/ftr/party-workspace-summaries`);
        const summaryData = await summaryRes.json();
        if (summaryData?.success && summaryData?.summaries) {
          setPartyWorkspaceMap(summaryData.summaries);
        }
      } catch (err) {
        setError(err.message || 'Unable to load party list');
        setParties([]);
      } finally {
        setLoadingParties(false);
      }
    };

    loadParties();
  }, []);

  useEffect(() => {
    if (!isPartyDetailMode && !activePartyId && parties.length > 0) {
      setActivePartyId(parties[0].id);
    }
  }, [activePartyId, parties, isPartyDetailMode]);

  const packedOnlyParties = useMemo(
    () => parties.filter((p) => (
      packingIdSet.has(p.id) || packingNameSet.has(normalizeName(p.companyName))
    )),
    [parties, packingIdSet, packingNameSet]
  );

  const packedFiltered = useMemo(
    () => filterBySearch(packedOnlyParties, packedSearch),
    [packedOnlyParties, packedSearch]
  );
  const dispatchFiltered = useMemo(() => filterBySearch(parties, dispatchSearch), [parties, dispatchSearch]);
  const partyCardsFiltered = useMemo(() => filterBySearch(parties, partyCardSearch), [parties, partyCardSearch]);

  const activeParty = useMemo(
    () => parties.find((p) => p.id === activePartyId) || null,
    [activePartyId, parties]
  );

  const comparison = useMemo(
    () => buildWorkspaceComparison(editorPdi, editorRunningOrder, editorBarcode, editorRejection, editorSmtModule),
    [editorPdi, editorRunningOrder, editorBarcode, editorRejection, editorSmtModule]
  );

  useEffect(() => {
    const loadPdiCards = async () => {
      if (!isPartyDetailMode || !activePartyId) return;
      setLoadingPdiCards(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards`);
        const data = await resp.json();
        if (!data?.success) {
          throw new Error(data?.error || 'Unable to load PDI cards');
        }
        const cards = Array.isArray(data.cards) ? data.cards : [];
        setPdiCards(cards);

        if (!activePdiKey && cards.length > 0) {
          setActivePdiKey(cards[0].pdiKey || '');
        }
      } catch (err) {
        setError(err.message || 'Unable to load PDI cards');
      } finally {
        setLoadingPdiCards(false);
      }
    };

    loadPdiCards();
  }, [activePartyId, activePdiKey, isPartyDetailMode]);

  useEffect(() => {
    const loadActiveWorkspace = async () => {
      if (!isPartyDetailMode || !activePartyId || !activePdiKey) return;
      setLoadingWorkspace(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}`);
        const data = await resp.json();
        if (!data?.success) {
          throw new Error(data?.error || 'Unable to load PDI workspace');
        }
        const ws = data.workspace || {};
        setEditorPdi(ws.pdiSerials || '');
        setEditorRunningOrder(ws.runningOrderSerials || '');
        setEditorBarcode(ws.barcodeSerials || '');
        setEditorRejection(ws.rejectionSerials || '');
        setEditorSmtModule(ws.smtModuleSerials || '');
        setEditorPdiNumber(ws.pdiNumber || activePdiKey);
        setEditorRunningOrderNumber(ws.runningOrderNumber || '');
        setRfidRowCount(Number(ws.rfidRowCount || 0));
        setRfidUploadedAt(ws.rfidUploadedAt || '');
        setRfidExcelFile(null);
        setWorkspaceSavedAt(ws.updatedAt || '');
      } catch (err) {
        setError(err.message || 'Unable to load PDI workspace');
      } finally {
        setLoadingWorkspace(false);
      }
    };

    loadActiveWorkspace();
  }, [activePartyId, activePdiKey, isPartyDetailMode]);

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

  const openPartyWorkspace = (partyId) => {
    const url = `${window.location.pathname}?section=party-reallocation&partyId=${encodeURIComponent(partyId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Fetch barcodes from MRP using just the PDI ID
  const fetchPdiBarcodesFromMrp = async () => {
    const pdiId = (pdiIdInput || '').trim();
    if (!pdiId) {
      setPdiLookupError('Please enter a PDI ID');
      return;
    }
    setPdiLookupLoading(true);
    setPdiLookupError('');
    setPdiLookupData(null);
    try {
      const resp = await fetch('https://mrp.umanerp.com/get/get_pdi_barcodes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdi_id: pdiId })
      });
      const data = await resp.json();
      if (!resp.ok || data?.status !== 'success') {
        throw new Error(data?.message || data?.error || 'Failed to fetch PDI barcodes');
      }
      setPdiLookupData({
        pdiId,
        pdiName: data?.pdi_details?.pdi_name || '',
        wattage: data?.pdi_details?.wattage || '',
        quantity: Number(data?.pdi_details?.quantity || 0),
        barcodeCount: Number(data?.barcode_count || 0),
        barcodes: Array.isArray(data?.barcodes) ? data.barcodes : []
      });
    } catch (err) {
      setPdiLookupError(err.message || 'Failed to fetch PDI barcodes');
    } finally {
      setPdiLookupLoading(false);
    }
  };

  const downloadPdiBarcodesCsv = () => {
    if (!pdiLookupData || !pdiLookupData.barcodes.length) return;
    const header = 'barcode\n';
    const body = pdiLookupData.barcodes.join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdi_${pdiLookupData.pdiId}_barcodes.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyPdiBarcodesToClipboard = async () => {
    if (!pdiLookupData || !pdiLookupData.barcodes.length) return;
    try {
      await navigator.clipboard.writeText(pdiLookupData.barcodes.join('\n'));
    } catch (e) {
      // ignore clipboard failures
    }
  };

  const createNewPdiCard = async () => {
    if (!activePartyId) return;

    const key = (newPdiCardName || '').trim();
    if (!key) {
      setError('PDI card name required. Example: 1 or PDI-1');
      return;
    }

    const selectedParty = parties.find((p) => p.id === activePartyId);

    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: selectedParty?.companyName || '',
          pdiNumber: key,
          runningOrderNumber: '',
          pdiSerials: '',
          runningOrderSerials: '',
          barcodeSerials: '',
          rejectionSerials: '',
          smtModuleSerials: ''
        })
      });
      const data = await resp.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Unable to create PDI card');
      }

      setPdiCards((prev) => {
        const exists = prev.some((x) => (x.pdiKey || '') === key);
        if (exists) return prev;
        return [{
          pdiKey: key,
          pdiNumber: key,
          runningOrderNumber: '',
          counts: { pdi: 0, runningOrder: 0, barcode: 0, rejection: 0, smtModule: 0 },
          rfidRowCount: 0,
          updatedAt: null
        }, ...prev];
      });
      setActivePdiKey(key);
      setEditorPdi('');
      setEditorRunningOrder('');
      setEditorBarcode('');
      setEditorRejection('');
      setEditorSmtModule('');
      setEditorPdiNumber(key);
      setEditorRunningOrderNumber('');
      setRfidRowCount(0);
      setRfidUploadedAt('');
      setWorkspaceSavedAt('');
      setNewPdiCardName('');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to create PDI card');
    }
  };

  const savePartyWorkspace = async () => {
    if (!activePartyId || !activePdiKey) {
      setError('Create or select a PDI card first.');
      return;
    }

    const selectedParty = parties.find((p) => p.id === activePartyId);
    if (!editorPdiNumber.trim() || !editorRunningOrderNumber.trim()) {
      setError('PDI Number and Running Order Number are required before save.');
      return;
    }
    setSavingWorkspace(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: selectedParty?.companyName || '',
          pdiKey: activePdiKey,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          pdiSerials: editorPdi,
          runningOrderSerials: editorRunningOrder,
          barcodeSerials: editorBarcode,
          rejectionSerials: editorRejection,
          smtModuleSerials: editorSmtModule
        })
      });
      const data = await resp.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to save party data');
      }

      const now = new Date().toISOString();
      setWorkspaceSavedAt(now);
      setPdiCards((prev) => prev.map((card) => {
        if ((card.pdiKey || '') !== activePdiKey) return card;
        return {
          ...card,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount,
          rfidUploadedAt,
          counts: data.counts || card.counts,
          updatedAt: now
        };
      }));
      setPartyWorkspaceMap((prev) => ({
        ...prev,
        [activePartyId]: {
          partyName: selectedParty?.companyName || '',
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount,
          rfidUploadedAt,
          counts: data.counts || {
            pdi: 0,
            runningOrder: 0,
            barcode: 0,
            rejection: 0,
            smtModule: 0
          },
          updatedAt: now
        }
      }));
    } catch (err) {
      setError(err.message || 'Failed to save party data');
    } finally {
      setSavingWorkspace(false);
    }
  };

  const clearActivePartyWorkspace = () => {
    if (!activePartyId) return;
    setEditorPdi('');
    setEditorRunningOrder('');
    setEditorBarcode('');
    setEditorRejection('');
    setEditorSmtModule('');
    setEditorPdiNumber('');
    setEditorRunningOrderNumber('');
    setRfidExcelFile(null);
    setRfidRowCount(0);
    setRfidUploadedAt('');
    setWorkspaceSavedAt('');
  };

  const uploadRfidExcel = async () => {
    if (!activePartyId || !activePdiKey) {
      setError('Create or select a PDI card first.');
      return;
    }
    if (!rfidExcelFile) {
      setError('Please select RFID Excel file first.');
      return;
    }

    setUploadingRfid(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', rfidExcelFile);

      const resp = await fetch(`${API_BASE_URL}/ftr/party-workspace/${activePartyId}/pdi-cards/${encodeURIComponent(activePdiKey)}/upload-rfid-excel`, {
        method: 'POST',
        body: form
      });
      const data = await resp.json();
      if (!data?.success) {
        if (Array.isArray(data?.missingColumns) && data.missingColumns.length) {
          throw new Error(`Missing RFID columns: ${data.missingColumns.join(', ')}`);
        }
        throw new Error(data?.error || 'RFID upload failed');
      }

      const now = new Date().toISOString();
      setRfidRowCount(Number(data.rfidRows || 0));
      setRfidUploadedAt(now);
      setRfidExcelFile(null);
      setEditorBarcode((prev) => prev);
      setPdiCards((prev) => prev.map((card) => {
        if ((card.pdiKey || '') !== activePdiKey) return card;
        return {
          ...card,
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount: Number(data.rfidRows || 0),
          counts: {
            ...(card.counts || {}),
            barcode: Number(data.barcodeCount || 0)
          },
          updatedAt: now
        };
      }));

      setPartyWorkspaceMap((prev) => ({
        ...prev,
        [activePartyId]: {
          ...(prev[activePartyId] || {}),
          pdiNumber: editorPdiNumber,
          runningOrderNumber: editorRunningOrderNumber,
          rfidRowCount: Number(data.rfidRows || 0),
          rfidUploadedAt: now,
          counts: {
            ...((prev[activePartyId] || {}).counts || {}),
            barcode: Number(data.barcodeCount || 0)
          }
        }
      }));
    } catch (err) {
      setError(err.message || 'RFID upload failed');
    } finally {
      setUploadingRfid(false);
    }
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

      <div className="planner-card workspace-card">
        <div className="workspace-header-row">
          <h2>PDI Barcode Lookup</h2>
          <small>Source: mrp.umanerp.com / get_pdi_barcodes.php</small>
        </div>

        <div className="workspace-editor-grid">
          <div className="workspace-field">
            <label>PDI ID</label>
            <input
              type="text"
              value={pdiIdInput}
              onChange={(e) => setPdiIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchPdiBarcodesFromMrp(); }}
              placeholder="Example: 009"
            />
          </div>
          <div className="workspace-field">
            <label>&nbsp;</label>
            <button type="button" onClick={fetchPdiBarcodesFromMrp} disabled={pdiLookupLoading}>
              {pdiLookupLoading ? 'Fetching...' : 'Fetch Barcodes'}
            </button>
          </div>
        </div>

        {pdiLookupError && <p className="error">{pdiLookupError}</p>}

        {pdiLookupData && (
          <div className="workspace-editor">
            <div className="workspace-editor-header">
              <h3>{pdiLookupData.pdiName || `PDI ${pdiLookupData.pdiId}`}</h3>
              <p><strong>PDI ID:</strong> {pdiLookupData.pdiId}</p>
              <p><strong>Wattage:</strong> {pdiLookupData.wattage || '-'}</p>
              <p><strong>Quantity:</strong> {pdiLookupData.quantity}</p>
              <p><strong>Barcodes Returned:</strong> {pdiLookupData.barcodeCount}</p>
            </div>

            <div className="workspace-actions">
              <button type="button" onClick={downloadPdiBarcodesCsv} disabled={!pdiLookupData.barcodes.length}>
                Download CSV
              </button>
              <button type="button" className="secondary" onClick={copyPdiBarcodesToClipboard} disabled={!pdiLookupData.barcodes.length}>
                Copy All
              </button>
            </div>

            <div className="workspace-editor-grid">
              <div className="workspace-field">
                <label>Filter Barcodes</label>
                <input
                  type="text"
                  value={pdiBarcodeFilter}
                  onChange={(e) => setPdiBarcodeFilter(e.target.value)}
                  placeholder="Type to filter..."
                />
              </div>
            </div>

            <div className="compare-list-box" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <h5>Barcodes ({pdiLookupData.barcodes.filter((b) => !pdiBarcodeFilter || String(b).toLowerCase().includes(pdiBarcodeFilter.toLowerCase())).length} shown)</h5>
              <ul>
                {pdiLookupData.barcodes
                  .filter((b) => !pdiBarcodeFilter || String(b).toLowerCase().includes(pdiBarcodeFilter.toLowerCase()))
                  .slice(0, 1000)
                  .map((b, i) => <li key={`bc-${i}-${b}`}>{b}</li>)}
              </ul>
              {pdiLookupData.barcodes.length > 1000 && (
                <p className="info">Showing first 1000. Use filter or download CSV for full list.</p>
              )}
            </div>
          </div>
        )}
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
