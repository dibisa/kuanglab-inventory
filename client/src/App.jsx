import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  FlaskConical, 
  Microscope, 
  MapPin, 
  Calendar,
  LayoutDashboard,
  Upload,
  DollarSign,
  Package,
  Settings,
  Search,
  Bell
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Chemicals from './pages/Chemicals';
import ChemicalDetail from './pages/ChemicalDetail';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import Locations from './pages/Locations';
import Reservations from './pages/Reservations';
import Import from './pages/Import';
import Budget from './pages/Budget';
import Consumables from './pages/Consumables';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <FlaskConical size={28} />
          <h1>Lab Inventory</h1>
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/chemicals" className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/chemicals') ? 'active' : ''}`}>
              <FlaskConical size={20} />
              <span>Chemicals</span>
            </NavLink>
            <NavLink to="/equipment" className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/equipment') ? 'active' : ''}`}>
              <Microscope size={20} />
              <span>Instruments</span>
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Organization</div>
            <NavLink to="/locations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <MapPin size={20} />
              <span>Locations</span>
            </NavLink>
            <NavLink to="/reservations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Reservations</span>
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Financial</div>
            <NavLink to="/budget" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <DollarSign size={20} />
              <span>Budget</span>
            </NavLink>
            <NavLink to="/consumables" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={20} />
              <span>Consumables</span>
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Tools</div>
            <NavLink to="/import" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Upload size={20} />
              <span>Import Data</span>
            </NavLink>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chemicals" element={<Chemicals />} />
          <Route path="/chemicals/:id" element={<ChemicalDetail />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/consumables" element={<Consumables />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
