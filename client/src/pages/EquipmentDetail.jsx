import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Microscope,
  MapPin,
  Calendar,
  Save,
  X,
  Gauge,
  AlertCircle,
  FileText,
  ExternalLink,
  Clock,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';
import { getEquipmentById, updateEquipment, deleteEquipment, getLocations } from '../api';

function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [eqData, locData] = await Promise.all([
        getEquipmentById(id),
        getLocations()
      ]);
      setEquipment(eqData);
      setFormData(eqData);
      setLocations(locData);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await updateEquipment(id, formData);
      setEquipment({ ...equipment, ...formData });
      setEditing(false);
    } catch (error) {
      alert('Failed to update equipment: ' + error.message);
    }
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this instrument?')) {
      try {
        await deleteEquipment(id);
        navigate('/equipment');
      } catch (error) {
        alert('Failed to delete instrument');
      }
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'Available': return 'badge-green';
      case 'In Use': return 'badge-orange';
      case 'Reserved': return 'badge-blue';
      case 'Under Maintenance': return 'badge-purple';
      case 'Out of Service': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!equipment) {
    return (
      <div className="empty-state">
        <h3>Instrument not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/equipment')}>
          Back to Instruments
        </button>
      </div>
    );
  }

  const isCalibrationDue = equipment.next_calibration && new Date(equipment.next_calibration) < new Date();

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/equipment')}>
          <ArrowLeft size={20} />
          Back to Instruments
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/reservations?equipment=${id}`)}>
            <Calendar size={20} />
            Reservations
          </button>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setFormData(equipment); }}>
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
        {/* Header */}
        <div className="detail-header">
          <div className="detail-icon" style={{ background: 'var(--gradient-2)' }}>
            <Microscope size={40} />
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
              <h2>{equipment.name}</h2>
            )}
            <div className="detail-meta">
              {equipment.manufacturer && <span>{equipment.manufacturer}</span>}
              {equipment.model && <span>Model: {equipment.model}</span>}
              <span className={`badge ${getStatusBadge(equipment.status)}`}>
                {equipment.status || 'Available'}
              </span>
              {equipment.category && <span className="badge badge-purple">{equipment.category}</span>}
            </div>
          </div>
        </div>

        {/* Calibration Warning */}
        {isCalibrationDue && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <AlertCircle size={24} color="#ef4444" />
            <div>
              <strong style={{ color: '#ef4444' }}>Calibration Overdue</strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                This instrument was due for calibration on {equipment.next_calibration}
              </p>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Activity size={20} />
            Basic Information
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Model</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.model || ''} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.model || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">SDS/Manual URL</div>
              {editing ? (
                <input type="url" className="form-input" value={formData.sds_url || ''} onChange={(e) => setFormData({ ...formData, sds_url: e.target.value })} placeholder="https://..." />
              ) : (
                equipment.sds_url ? (
                  <a href={equipment.sds_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={16} />
                    View SDS/Manual
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>Not specified</span>
                )
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Technical Paper URL</div>
              {editing ? (
                <input type="url" className="form-input" value={formData.tech_url || ''} onChange={(e) => setFormData({ ...formData, tech_url: e.target.value })} placeholder="https://..." />
              ) : (
                equipment.tech_url ? (
                  <a href={equipment.tech_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={16} />
                    View Technical Paper
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>Not specified</span>
                )
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Manufacturer</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.manufacturer || ''} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.manufacturer || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Serial Number</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.serial_number || ''} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
              ) : (
                <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>{equipment.serial_number || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Asset Tag</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.asset_tag || ''} onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.asset_tag || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Category</div>
              {editing ? (
                <select className="form-select" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select category</option>
                  <option value="Balance">Balance / Scale</option>
                  <option value="Chromatography">Chromatography</option>
                  <option value="Spectroscopy">Spectroscopy</option>
                  <option value="Microscopy">Microscopy</option>
                  <option value="Centrifuge">Centrifuge</option>
                  <option value="pH Meter">pH Meter</option>
                  <option value="Pipette">Pipette</option>
                  <option value="Thermometer">Thermometer</option>
                  <option value="Incubator">Incubator</option>
                  <option value="Fume Hood">Fume Hood</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div className="detail-item-value">{equipment.category || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Status</div>
              {editing ? (
                <select className="form-select" value={formData.status || 'Available'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              ) : (
                <div className="detail-item-value">
                  <span className={`badge ${getStatusBadge(equipment.status)}`}>{equipment.status || 'Available'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Measurement Specifications */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Gauge size={20} />
            Measurement Specifications
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Measurement Range</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.measurement_range || ''} onChange={(e) => setFormData({ ...formData, measurement_range: e.target.value })} placeholder="e.g., 0.1 mg - 220 g" />
              ) : (
                <div className="detail-item-value">{equipment.measurement_range || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Accuracy</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.accuracy || ''} onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })} placeholder="e.g., ±0.1 mg" />
              ) : (
                <div className="detail-item-value" style={{ color: equipment.accuracy ? '#10b981' : 'inherit' }}>
                  {equipment.accuracy || 'Not specified'}
                </div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Resolution</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.resolution || ''} onChange={(e) => setFormData({ ...formData, resolution: e.target.value })} placeholder="e.g., 0.01 mg" />
              ) : (
                <div className="detail-item-value">{equipment.resolution || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Measurement Units</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.measurement_units || ''} onChange={(e) => setFormData({ ...formData, measurement_units: e.target.value })} placeholder="e.g., mg, g, pH" />
              ) : (
                <div className="detail-item-value">{equipment.measurement_units || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <div className="detail-item-label">Operating Conditions</div>
              {editing ? (
                <input type="text" className="form-input" value={formData.operating_conditions || ''} onChange={(e) => setFormData({ ...formData, operating_conditions: e.target.value })} placeholder="e.g., 15-30°C, 20-80% RH" />
              ) : (
                <div className="detail-item-value">{equipment.operating_conditions || 'Not specified'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Limitations */}
        {(equipment.limitations || editing) && (
          <div className="detail-section">
            <h3 className="detail-section-title">
              <Target size={20} />
              Limitations & Constraints
            </h3>
            {editing ? (
              <textarea
                className="form-textarea"
                value={formData.limitations || ''}
                onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                placeholder="Document any limitations, constraints, or special requirements..."
                style={{ width: '100%' }}
              />
            ) : (
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.1)', 
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{equipment.limitations}</p>
              </div>
            )}
          </div>
        )}

        {/* Calibration & Maintenance */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <Clock size={20} />
            Calibration & Maintenance
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Last Calibration</div>
              {editing ? (
                <input type="date" className="form-input" value={formData.calibration_date || ''} onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.calibration_date || 'Not recorded'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Next Calibration Due</div>
              {editing ? (
                <input type="date" className="form-input" value={formData.next_calibration || ''} onChange={(e) => setFormData({ ...formData, next_calibration: e.target.value })} />
              ) : (
                <div className="detail-item-value" style={{ color: isCalibrationDue ? '#ef4444' : 'inherit' }}>
                  {equipment.next_calibration || 'Not scheduled'}
                </div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Purchase Date</div>
              {editing ? (
                <input type="date" className="form-input" value={formData.purchase_date || ''} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.purchase_date || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Warranty Expiry</div>
              {editing ? (
                <input type="date" className="form-input" value={formData.warranty_expiry || ''} onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.warranty_expiry || 'Not specified'}</div>
              )}
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Cost</div>
              {editing ? (
                <input type="number" step="0.01" className="form-input" value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
              ) : (
                <div className="detail-item-value">{equipment.cost ? `$${Number(equipment.cost).toLocaleString()}` : 'Not specified'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="detail-section">
          <h3 className="detail-section-title">
            <MapPin size={20} />
            Location
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Storage Location</div>
              {editing ? (
                <select className="form-select" value={formData.location_id || ''} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}>
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {`${loc.building || ''} ${loc.room || ''}${loc.cabinet ? ` - ${loc.cabinet}` : ''}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="detail-item-value">
                  {equipment.room 
                    ? `${equipment.building || ''} ${equipment.room}${equipment.cabinet ? `, ${equipment.cabinet}` : ''}`
                    : 'Not assigned'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {(equipment.notes || editing) && (
          <div className="detail-section">
            <h3 className="detail-section-title">
              <FileText size={20} />
              Notes & Instructions
            </h3>
            {editing ? (
              <textarea
                className="form-textarea"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%' }}
              />
            ) : (
              <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{equipment.notes}</p>
            )}
          </div>
        )}

        {/* Manual Link */}
        {equipment.manual_url && (
          <div style={{ marginTop: '1.5rem' }}>
            <a href={equipment.manual_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <ExternalLink size={20} />
              View Manual / Documentation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentDetail;
