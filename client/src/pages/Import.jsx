import { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle,
  Download,
  FlaskConical,
  Microscope
} from 'lucide-react';
import { importFile } from '../api';

function Import() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedType, setSelectedType] = useState('chemicals');
  const fileInputRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await importFile(selectedType, file);
      setResult({
        success: true,
        message: `Successfully imported ${data.imported} of ${data.total} items`
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Import failed'
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function downloadTemplate(type) {
    let csvContent = '';
    
    if (type === 'chemicals') {
      csvContent = 'Name,CAS Number,Formula,Molecular Weight,Quantity,Unit,Category,Hazard Class,Purity,Supplier,Catalog Number,Lot Number,State,Notes\n';
      csvContent += 'Sodium Chloride,7647-14-5,NaCl,58.44,500,g,Salt,,99.9%,Sigma-Aldrich,S7653,MKCJ1234,Powder,Example entry\n';
    } else {
      csvContent = 'Name,Model,Manufacturer,Serial Number,Category,Status,Notes\n';
      csvContent += 'Analytical Balance,XPE205,Mettler Toledo,B123456789,Balance,Available,Example entry\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Data</h1>
          <p className="page-subtitle">Import chemicals or equipment from Excel/CSV files</p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="tabs">
        <button 
          className={`tab ${selectedType === 'chemicals' ? 'active' : ''}`}
          onClick={() => setSelectedType('chemicals')}
        >
          <FlaskConical size={18} style={{ marginRight: '0.5rem' }} />
          Chemicals
        </button>
        <button 
          className={`tab ${selectedType === 'equipment' ? 'active' : ''}`}
          onClick={() => setSelectedType('equipment')}
        >
          <Microscope size={18} style={{ marginRight: '0.5rem' }} />
          Equipment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Upload Section */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Upload File</h3>
          
          <div 
            style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: '12px', 
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border)';
              const file = e.dataTransfer.files[0];
              if (file) {
                const input = fileInputRef.current;
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                handleFileSelect({ target: input });
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {importing ? (
              <div>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p>Importing data...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Excel (.xlsx, .xls) or CSV files
                </p>
              </>
            )}
          </div>

          {/* Result */}
          {result && (
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '8px',
              background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {result.success ? (
                <CheckCircle size={20} color="#10b981" />
              ) : (
                <XCircle size={20} color="#ef4444" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Instructions</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Expected Columns for {selectedType === 'chemicals' ? 'Chemicals' : 'Equipment'}:
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedType === 'chemicals' ? (
                <>
                  <span className="badge badge-blue">Name *</span>
                  <span className="badge badge-gray">CAS Number</span>
                  <span className="badge badge-gray">Formula</span>
                  <span className="badge badge-gray">Molecular Weight</span>
                  <span className="badge badge-gray">Quantity</span>
                  <span className="badge badge-gray">Unit</span>
                  <span className="badge badge-gray">Category</span>
                  <span className="badge badge-gray">Hazard Class</span>
                  <span className="badge badge-gray">Purity</span>
                  <span className="badge badge-gray">Supplier</span>
                  <span className="badge badge-gray">Catalog Number</span>
                  <span className="badge badge-gray">Lot Number</span>
                  <span className="badge badge-gray">State</span>
                  <span className="badge badge-gray">Notes</span>
                </>
              ) : (
                <>
                  <span className="badge badge-blue">Name *</span>
                  <span className="badge badge-gray">Model</span>
                  <span className="badge badge-gray">Manufacturer</span>
                  <span className="badge badge-gray">Serial Number</span>
                  <span className="badge badge-gray">Category</span>
                  <span className="badge badge-gray">Status</span>
                  <span className="badge badge-gray">Notes</span>
                </>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              * Required field. Column names are flexible (e.g., "CAS", "CAS Number", "CAS#" all work).
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tips:</h4>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <li>First row should contain column headers</li>
              <li>Only rows with a valid "Name" will be imported</li>
              <li>Duplicate entries will be added as new items</li>
              <li>Empty cells will be skipped</li>
            </ul>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => downloadTemplate(selectedType)}
            style={{ width: '100%' }}
          >
            <Download size={20} />
            Download Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default Import;
