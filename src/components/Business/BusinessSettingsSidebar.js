import React from 'react';
import '../../styles/Sidebar.css';

const sections = [
  { key: 'profile', label: 'Profile', icon: 'fas fa-user' },
  { key: 'payments', label: 'Payments', icon: 'fas fa-dollar-sign' },
  { key: 'ai', label: 'AI', icon: 'fas fa-robot' },
  { key: 'admin', label: 'Admin', icon: 'fas fa-shield-alt' },
];

const BusinessSettingsSidebar = ({ activeSection, setActiveSection, isAdmin }) => {
  return (
    <aside className="sidebar-settings visible" style={{ minWidth: 220 }}>
      <ul className="sidebar-links">
        {sections.map(section => {
          if (section.key === 'admin' && !isAdmin) return null;
          return (
            <li
              key={section.key}
              className={activeSection === section.key ? 'active' : ''}
              onClick={() => setActiveSection(section.key)}
            >
              <i className={section.icon} style={{ marginRight: 12, width: 24, textAlign: 'center' }}></i>
              <span className="sidebar-link-text">{section.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default BusinessSettingsSidebar; 