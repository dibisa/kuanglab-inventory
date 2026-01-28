import { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus } from 'lucide-react';

export default function Consumables() {
  const [consumables, setConsumables] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const res = await fetch('/api/consumables');
      const data = await res.json();
      setConsumables(data.items || []);
      setSummary(data.summary || []);
    } catch (err) {
      console.error('Failed to fetch consumables:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const categories = ['all', ...new Set(consumables.map(c => c.category))];

  const filteredConsumables = consumables.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = filteredConsumables.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalCost = consumables.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading consumables...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Lab Consumables</h1>
          <p className="subtitle">Supplies and recurring items organized by category</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Consumable
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {summary.map(cat => (
          <div key={cat.category} className="stat-card clickable" onClick={() => setSelectedCategory(cat.category)}>
            <div className="stat-icon" style={{ 
              background: cat.category === 'General' 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : 'linear-gradient(135deg, #10b981, #059669)'
            }}>
              <Package size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{cat.item_count}</span>
              <span className="stat-label">{cat.category}</span>
              <span className="stat-sublabel">{formatCurrency(cat.total_cost)}</span>
            </div>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(totalCost)}</span>
            <span className="stat-label">Total Estimated</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search consumables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={20} />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consumables by Category */}
      {Object.entries(groupedByCategory).map(([category, items]) => (
        <div key={category} className="card consumables-category-card">
          <div className="category-header">
            <h3>{category}</h3>
            <span className="category-total">
              {items.length} items • {formatCurrency(items.reduce((sum, i) => sum + (i.estimated_cost || 0), 0))}
            </span>
          </div>
          
          <div className="consumables-grid">
            {items.map((item, idx) => (
              <div key={idx} className="consumable-item">
                <div className="consumable-info">
                  <span className="consumable-name">{item.item}</span>
                  <span className="consumable-vendor">{item.vendor || 'Vendor TBD'}</span>
                </div>
                <span className="consumable-cost">{formatCurrency(item.estimated_cost)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredConsumables.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No consumables found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Consumable</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              // TODO: Implement add consumable
              setShowAddModal(false);
            }}>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select>
                  <option value="General">General</option>
                  <option value="Cell culture">Cell Culture</option>
                </select>
              </div>
              <div className="form-group">
                <label>Vendor</label>
                <input type="text" />
              </div>
              <div className="form-group">
                <label>Estimated Cost</label>
                <input type="number" step="0.01" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Consumable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
