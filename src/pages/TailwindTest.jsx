import React from 'react';

const TailwindTest = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-semibold">Scalysis</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-indigo-600 text-white"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" 
                alt="Dashboard" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/profile-8535329.svg" 
                alt="Team" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Team</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/folder-8532416.svg" 
                alt="Projects" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Projects</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/clock-8535542.svg" 
                alt="Calendar" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Calendar</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/document-text-8535503.svg" 
                alt="Documents" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Documents</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <img 
                src="/images/Raycons Icons Pack (Community)/chart-8532178.svg" 
                alt="Reports" 
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Reports</span>
            </a>
          </div>

          {/* Teams Section */}
          <div className="mt-8 px-3">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Your teams
              </h3>
            </div>
            <div className="space-y-1">
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                  H
                </div>
                <span className="text-sm font-medium">Heroicons</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                  T
                </div>
                <span className="text-sm font-medium">Tailwind Labs</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                  W
                </div>
                <span className="text-sm font-medium">Workcation</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Settings Link */}
        <div className="p-4 border-t border-gray-800">
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <img 
              src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" 
              alt="Settings" 
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Settings</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Light Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img 
                  src="/images/Raycons Icons Pack (Community)/box-search-8535205.svg" 
                  alt="Search" 
                  className="w-5 h-5 text-gray-400"
                />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <img 
                src="/images/Raycons Icons Pack (Community)/notification-8532408.svg" 
                alt="Notifications" 
                className="w-5 h-5"
              />
            </button>

            {/* Theme Toggle */}
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <img 
                src="/images/Raycons Icons Pack (Community)/autobrightness-8535594.svg" 
                alt="Theme" 
                className="w-5 h-5"
              />
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Tom Cook</span>
                <span className="text-xs text-gray-500">tom@example.com</span>
              </div>
              <button className="ml-2 text-gray-400 hover:text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Tailwind Test Page
                </h2>
                <p className="text-gray-500 mb-6">
                  This is a test page to demonstrate Tailwind CSS with a dark sidebar and light header layout.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Features:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Dark sidebar with navigation</li>
                    <li>Light header with search and user profile</li>
                    <li>Pure Tailwind CSS utility classes</li>
                    <li>Responsive design</li>
                    <li>Hover states and transitions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TailwindTest;

