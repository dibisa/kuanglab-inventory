import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, ChevronDown, ChevronRight, Search } from 'lucide-react';

export default function Budget() {
  const [budgetData, setBudgetData] = useState({ items: [], summary: [] });
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const res = await fetch('/api/budget');
      const data = await res.json();
      setBudgetData(data);
      // Expand all categories by default
      const expanded = {};
      data.summary.forEach(cat => {
        expanded[cat.category] = true;
      });
      setExpandedCategories(expanded);
    } catch (err) {
      console.error('Failed to fetch budget:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const grandTotal = budgetData.summary.reduce((sum, cat) => sum + cat.total_cost, 0);

  const filteredItems = budgetData.items.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading budget data...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Lab Budget Overview</h1>
          <p className="subtitle">3-Year Financial Plan</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(grandTotal)}</span>
            <span className="stat-label">Total Budget</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{budgetData.items.length}</span>
            <span className="stat-label">Budget Items</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{budgetData.summary.length}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Budget Allocation by Category</h3>
        <div className="budget-chart">
          {budgetData.summary.sort((a, b) => b.total_cost - a.total_cost).map((cat, idx) => {
            const percentage = (cat.total_cost / grandTotal) * 100;
            const colors = [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
              '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
            ];
            return (
              <div key={cat.category} className="budget-bar-row">
                <div className="budget-bar-label">
                  <span className="budget-category-name">{cat.category}</span>
                  <span className="budget-category-amount">{formatCurrency(cat.total_cost)}</span>
                </div>
                <div className="budget-bar-container">
                  <div 
                    className="budget-bar" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colors[idx % colors.length]
                    }}
                  />
                  <span className="budget-bar-percent">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: '1rem' }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Search budget items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Detailed Budget Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Detailed Budget Breakdown</h3>
        <div className="budget-accordion">
          {Object.entries(groupedItems).map(([category, items]) => {
            const categoryTotal = items.reduce((sum, item) => sum + item.cost, 0);
            const isExpanded = expandedCategories[category];
            
            return (
              <div key={category} className="budget-category-section">
                <div 
                  className="budget-category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="budget-category-left">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="budget-category-title">{category}</span>
                    <span className="badge">{items.length} items</span>
                  </div>
                  <span className="budget-category-total">{formatCurrency(categoryTotal)}</span>
                </div>
                
                {isExpanded && (
                  <table className="data-table budget-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Vendor/Model</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.item}</td>
                          <td>{item.vendor_model || '-'}</td>
                          <td className="description-cell">{item.description || '-'}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                            {formatCurrency(item.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grand Total Footer */}
      <div className="budget-grand-total">
        <span>Grand Total</span>
        <span className="grand-total-amount">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
