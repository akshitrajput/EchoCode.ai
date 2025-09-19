import React, { useState } from 'react';
import { FiHome, FiClock, FiInfo, FiUser, FiPlus } from 'react-icons/fi';

const ICONS = {
  home: <FiHome size={22} />,
  new: <FiPlus size={22} />,
  history: <FiClock size={22} />,
  about: <FiInfo size={22} />,
  user: <FiUser size={28} />,
};

function Sidebar() {
  const [open, setOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('home');

  const sections = [
    { key: 'home', label: 'Home' },
    { key: 'new', label: 'New Chat' },
    { key: 'history', label: 'History' },
    { key: 'about', label: 'About' },
  ];

  const handleSectionClick = (key) => {
    setActiveSection(key);
    // Add your navigation logic here
  };

  return (
    <div className={`flex flex-col h-screen ${open ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg transition-all duration-300`} style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="flex flex-col items-center p-4 border-b border-gray-700">
        <button
          onClick={() => setOpen(!open)}
          className="focus:outline-none flex items-center justify-center"
        >
          <img
            src="/assets/app_icon.png"
            alt="App Icon"
            className={`w-8 h-8 drop-shadow transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </button>
        {open && <span className="font-bold text-xl tracking-wide mt-2 mb-1">EchoCode.AI</span>}
      </div>
      <nav className="flex-1 p-4 space-y-2 flex flex-col items-center">
        {sections.map((item) => (
          <button
            key={item.key}
            onClick={() => handleSectionClick(item.key)}
            className={`flex items-center py-2 px-3 rounded hover:bg-gray-700 font-semibold transition-all duration-200 w-full ${open ? '' : 'justify-center'} ${activeSection === item.key ? 'bg-gray-700' : ''}`}
            style={{ outline: 'none' }}
          >
            <span className="flex items-center justify-center w-8 h-8">{ICONS[item.key]}</span>
            {open && <span className="ml-3">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 flex items-center justify-center mt-auto">
        <div className="flex items-center">
          <span className="flex items-center justify-center w-8 h-8">{ICONS.user}</span>
          {open && <span className="ml-3 font-medium">You</span>}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
