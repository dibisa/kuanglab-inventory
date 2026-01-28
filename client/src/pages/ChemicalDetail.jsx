import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FlaskConical,
  AlertTriangle,
  MapPin,
  Building,
  Package,
  FileText,
  ExternalLink,
  Save,
  X
} from 'lucide-react';
import { getChemical, updateChemical, deleteChemical, getLocations } from '../api';

function ChemicalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chemical, setChemical] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [chemData, locData] = await Promise.all([
        getChemical(id),
        getLocations()
      ]);
      setChemical(chemData);
      setFormData(chemData);
      setLocations(locData);
    } catch (error) {
      console.error('Failed to load chemical:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await updateChemical(id, formData);
      setChemical({ ...chemical, ...formData });
      setEditing(false);
    } catch (error) {
      alert('Failed to update chemical: ' + error.message);
    }
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this chemical?')) {
      try {
        await deleteChemical(id);
        navigate('/chemicals');
      } catch (error) {
        alert('Failed to delete chemical');
      }
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!chemical) {
    return (
      <div className="empty-state">
        <h3>Chemical not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/chemicals')}>
          Back to Chemicals
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/chemicals')}>
          <ArrowLeft size={20} />
          Back to Chemicals
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setFormData(chemical); }}>
                <X size={20} />
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={20} />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <Edit size={20} />
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={20} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '2rem' }}>
        <div className="detail-header">
          <div className="detail-icon">
            <FlaskConical size={40} />
          </div>
          <div className="detail-info">
            {editing ? (
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}
              />
            ) : (
              <h2>{chemical.name}</h2>
            )}
            <div className="detail-meta">
              {chemical.cas_number && <span>CAS: {chemical.cas_number}</span>}
              {chemical.formula && <span>Formula: {chemical.formula}</span>}
              {chemical.category && <span className="badge badge-blue">{chemical.category}</span>}
              {chemical.hazard_class && <span className="badge badge-red">{chemical.hazard_class}</span>}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Package size={20} />
            Basic Information
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">CAS Number</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.cas_number || ''}
                  onChange={(e) => setFormData({ ...formData, cas_number: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.cas_number || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Molecular Formula</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.formula || ''}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                />
              ) : (
                <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>{chemical.formula || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Molecular Weight</div>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.molecular_weight || ''}
                  onChange={(e) => setFormData({ ...formData, molecular_weight: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.molecular_weight ? `${chemical.molecular_weight} g/mol` : 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Physical State</div>
              {editing ? (
                <select
                  className="form-select"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="">Select state</option>
                  <option value="Solid">Solid</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Gas">Gas</option>
                  <option value="Solution">Solution</option>
                  <option value="Powder">Powder</option>
                  <option value="Crystal">Crystal</option>
                </select>
              ) : (
                <div className="detail-item-value">{chemical.state || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Purity / Grade</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.purity || ''}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.purity || chemical.grade || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Category</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.category || 'Not specified'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Package size={20} />
            Inventory
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Quantity</div>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-select"
                    value={formData.unit || 'g'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: '100px' }}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mg">mg</option>
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="mol">mol</option>
                  </select>
                </div>
              ) : (
                <div className="detail-item-value" style={{ color: chemical.quantity < 10 ? '#f59e0b' : 'inherit' }}>
                  {chemical.quantity ? `${chemical.quantity} ${chemical.unit || ''}` : 'Not specified'}
                </div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Supplier</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.supplier || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Catalog Number</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.catalog_number || ''}
                  onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.catalog_number || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Lot Number</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.lot_number || ''}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.lot_number || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Expiry Date</div>
              {editing ? (
                <input
                  type="date"
                  className="form-input"
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.expiry_date || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Date Received</div>
              {editing ? (
                <input
                  type="date"
                  className="form-input"
                  value={formData.date_received || ''}
                  onChange={(e) => setFormData({ ...formData, date_received: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.date_received || 'Not specified'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Safety & Storage */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <AlertTriangle size={20} />
            Safety & Storage
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Hazard Class</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.hazard_class || ''}
                  onChange={(e) => setFormData({ ...formData, hazard_class: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.hazard_class || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Storage Conditions</div>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.storage_conditions || ''}
                  onChange={(e) => setFormData({ ...formData, storage_conditions: e.target.value })}
                />
              ) : (
                <div className="detail-item-value">{chemical.storage_conditions || 'Not specified'}</div>
              )}
            </div>
            {chemical.sds_url && (
              <div className="detail-item">
                <div className="detail-item-label">Safety Data Sheet</div>
                <a href={chemical.sds_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  <ExternalLink size={16} />
                  View SDS
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <MapPin size={20} />
            Storage Location
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Location</div>
              {editing ? (
                <select
                  className="form-select"
                  value={formData.location_id || ''}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {`${loc.building || ''} ${loc.room || ''}${loc.cabinet ? ` - ${loc.cabinet}` : ''}${loc.shelf ? ` (${loc.shelf})` : ''}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="detail-item-value">
                  {chemical.room 
                    ? `${chemical.building || ''} ${chemical.room}${chemical.cabinet ? `, ${chemical.cabinet}` : ''}${chemical.shelf ? ` - ${chemical.shelf}` : ''}`
                    : 'Not assigned'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {(chemical.notes || editing) && (
          <div className="detail-section">
            <h3 className="detail-section-title">
              <FileText size={20} />
              Notes
            </h3>
            {editing ? (
              <textarea
                className="form-textarea"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%' }}
              />
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>{chemical.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChemicalDetail;
