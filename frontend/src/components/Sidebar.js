import React from 'react';
import { FiHome, FiClock, FiInfo, FiUser, FiPlus } from 'react-icons/fi';

const ICONS = {
  home: <FiHome size={22} />,
  new: <FiPlus size={22} />,
  history: <FiClock size={22} />,
  about: <FiInfo size={22} />,
  user: <FiUser size={28} />,
};

function Sidebar({ open, onToggle, activeSection, onSectionClick }) {
  const sections = [
    { key: 'home', label: 'Home' },
    { key: 'new', label: 'New Chat' },
    { key: 'history', label: 'History' },
    { key: 'about', label: 'About' },
  ];

  return (
    <aside
      className={`flex flex-col h-screen ${open ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg transition-all duration-300`}
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Logo and Sidebar Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <button
          onClick={onToggle}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="rounded-full bg-gray-700 hover:bg-gray-600 p-2 transition-colors duration-300 focus:outline-none flex items-center justify-center"
        >
          <img
            src="/assets/app_icon.png"
            alt="App Icon"
            className={`w-8 h-8 drop-shadow transform transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
          />
        </button>
        {/* {open && <span className="font-bold text-xl tracking-wide ml-2">EchoCode.AI</span>} */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1">
        {sections.map((item) => (
          <button
            key={item.key}
            onClick={() => onSectionClick?.(item.key)}
            className={`flex items-center py-2 pl-4 pr-3 rounded-lg font-semibold transition-all duration-200 outline-none
                        ${open ? 'justify-start w-[95%]' : 'justify-center w-12 mx-auto'}
                        ${activeSection === item.key ? 'bg-gray-700' : 'hover:bg-gray-700/70'}
            `}
          >
            <span className="flex items-center justify-center w-8 h-8">{ICONS[item.key]}</span>
            {open && <span className="ml-3">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* EchoCode text above the border line */}
      {open && (
        <div className="px-4 py-2 text-xs font-light text-gray-400 select-none border-t border-gray-700">
          EchoCode © 2025
        </div>
      )}

      {/* Profile / User section */}
      <div className="p-4 flex items-center">
        <span className="flex items-center justify-center w-8 h-8">{ICONS.user}</span>
        {open && <span className="ml-3 font-medium truncate">You</span>}
      </div>
    </aside>
  );
}

export default Sidebar;
