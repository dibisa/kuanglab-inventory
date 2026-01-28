import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  Microscope, 
  MapPin, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { getStats, getChemicals, getEquipment } from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentChemicals, setRecentChemicals] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, chemicalsData, equipmentData] = await Promise.all([
        getStats(),
        getChemicals(),
        getEquipment()
      ]);
      setStats(statsData);
      setRecentChemicals(chemicalsData.slice(0, 5));
      setRecentEquipment(equipmentData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to your Lab Inventory Management System</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/chemicals')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div>
              <div className="stat-value">{stats?.chemicalCount || 0}</div>
              <div className="stat-label">Total Chemicals</div>
            </div>
            <div className="stat-icon blue">
              <FlaskConical size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/equipment')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div>
              <div className="stat-value">{stats?.equipmentCount || 0}</div>
              <div className="stat-label">Instruments</div>
            </div>
            <div className="stat-icon green">
              <Microscope size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/locations')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div>
              <div className="stat-value">{stats?.locationCount || 0}</div>
              <div className="stat-label">Storage Locations</div>
            </div>
            <div className="stat-icon purple">
              <MapPin size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-value" style={{ color: stats?.lowStock > 0 ? '#f59e0b' : 'inherit' }}>
                {stats?.lowStock || 0}
              </div>
              <div className="stat-label">Low Stock Items</div>
            </div>
            <div className="stat-icon orange">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Chemicals */}
        <div className="data-table-container">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Recent Chemicals</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/chemicals')}>
              View All
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>CAS #</th>
                <th>Quantity</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {recentChemicals.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No chemicals added yet
                  </td>
                </tr>
              ) : (
                recentChemicals.map(chem => (
                  <tr key={chem.id} onClick={() => navigate(`/chemicals/${chem.id}`)}>
                    <td>{chem.name}</td>
                    <td>{chem.cas_number || '-'}</td>
                    <td>{chem.quantity ? `${chem.quantity} ${chem.unit || ''}` : '-'}</td>
                    <td>{chem.room ? `${chem.building || ''} ${chem.room}` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Equipment */}
        <div className="data-table-container">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Recent Instruments</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/equipment')}>
              View All
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {recentEquipment.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No instruments added yet
                  </td>
                </tr>
              ) : (
                recentEquipment.map(eq => (
                  <tr key={eq.id} onClick={() => navigate(`/equipment/${eq.id}`)}>
                    <td>{eq.name}</td>
                    <td>{eq.model || '-'}</td>
                    <td>
                      <span className={`badge ${eq.status === 'Available' ? 'badge-green' : eq.status === 'In Use' ? 'badge-orange' : 'badge-gray'}`}>
                        {eq.status || 'Available'}
                      </span>
                    </td>
                    <td>{eq.room ? `${eq.building || ''} ${eq.room}` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      {stats?.categories?.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Chemical Categories</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.categories.filter(c => c).map((category, idx) => (
              <span key={idx} className="badge badge-blue">
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats?.hazardClasses?.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Hazard Classes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stats.hazardClasses.filter(h => h).map((hazard, idx) => (
              <span key={idx} className="badge badge-red">
                {hazard}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
