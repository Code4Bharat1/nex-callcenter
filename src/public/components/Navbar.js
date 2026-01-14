// Navbar Component - JavaScript version (no JSX)

const Navbar = ({ activePage, shop }) => {
  // Menu items configuration
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard2.0',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('rect', { x: "3", y: "3", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "2", fill: "none" }),
        React.createElement('rect', { x: "11", y: "3", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "2", fill: "none" }),
        React.createElement('rect', { x: "3", y: "11", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "2", fill: "none" }),
        React.createElement('rect', { x: "11", y: "11", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "2", fill: "none" })
      )
    },
    {
      id: 'csv',
      label: 'CSV Upload',
      href: '/csv',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M14 2V8H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M8 12H16", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M8 16H12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'playground',
      label: 'Agents',
      href: '/playground',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M12 2L2 7L12 12L22 7L12 2Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M2 17L12 22L22 17", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M2 12L12 17L22 12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'scripts',
      label: 'Scripts',
      href: '/scripts',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M8 2V5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M16 2V5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M3 7H21", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M9 11H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M9 15H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'call-history',
      label: 'Call History',
      href: '/call-history',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('circle', { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "2" }),
        React.createElement('path', { d: "M12 6V12L16 14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'stats',
      label: 'Stats',
      href: '/stats',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M3 3V21H21", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M9 9L12 6L16 10L20 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "6", y: "12", width: "3", height: "6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "10", y: "9", width: "3", height: "9", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "14", y: "6", width: "3", height: "12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'usage',
      label: 'Usage',
      href: '/usage',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M3 3V21H21", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M9 9L12 6L16 10L20 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "6", y: "12", width: "3", height: "6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "10", y: "9", width: "3", height: "9", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('rect', { x: "14", y: "6", width: "3", height: "12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'pricing',
      label: 'Pricing',
      href: '/pricing',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'voices',
      label: 'Voices',
      href: '/voices',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M19 10V11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11V10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M12 18V22M12 22H9M12 22H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'clone-voice',
      label: 'Clone Voice',
      href: '/clone-voice',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M19 10V11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11V10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M12 18V22M12 22H9M12 22H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M16 6H20M18 4V8", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'integrations',
      label: 'Integrations',
      href: '/integrations',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('circle', { cx: "12", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "2" })
      )
    },
    {
      id: 'phone-numbers',
      label: 'Phone Numbers',
      href: '/phone-numbers',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2131 21.3523 21.4011C21.1473 21.5891 20.9053 21.7321 20.6399 21.8208C20.3745 21.9095 20.0922 21.9418 19.8125 21.9155C16.7425 21.5715 13.787 20.5125 11.19 18.8255C8.77382 17.3125 6.72533 15.264 5.2125 12.8475C3.43253 10.1775 2.35053 7.12752 2.0625 3.93752C2.03623 3.65859 2.06859 3.37709 2.15731 3.1124C2.24603 2.84771 2.38905 2.60633 2.57706 2.40185C2.76507 2.19737 2.99402 2.03418 3.24904 1.92278C3.50406 1.81138 3.77977 1.75438 4.05825 1.75552H7.05825C7.68119 1.75214 8.28378 1.98719 8.74825 2.41252C9.21272 2.83785 9.50406 3.42281 9.5625 4.04252C9.67825 5.41252 9.99825 6.75752 10.5125 8.03252C10.6423 8.39252 10.7075 8.77752 10.7025 9.16502C10.6975 9.55252 10.6225 9.93502 10.4825 10.29L9.2925 13.11C11.1679 16.605 14.3925 19.8295 17.8883 21.705L20.7083 20.515C21.0633 20.3751 21.4458 20.3001 21.8333 20.2951C22.2208 20.2901 22.6058 20.3553 22.9658 20.485C24.2408 20.9993 25.5858 21.3193 26.9558 21.435C27.5755 21.4935 28.1605 21.7848 28.5858 22.2493C29.0111 22.7138 29.2462 23.3164 29.2428 23.9393L29.2425 23.94Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: React.createElement('svg', { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        React.createElement('path', { d: "M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
        React.createElement('path', { d: "M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5166 9 19.41C8.69838 19.2769 8.36381 19.2372 8.03941 19.296C7.71502 19.3548 7.41568 19.5095 7.18 19.74L7.12 19.8C6.93425 19.986 6.71368 20.1335 6.47088 20.2341C6.22808 20.3348 5.96783 20.3866 5.705 20.3866C5.44217 20.3866 5.18192 20.3348 4.93912 20.2341C4.69632 20.1335 4.47575 19.986 4.29 19.8C4.10405 19.6143 3.95653 19.3937 3.85588 19.1509C3.75523 18.9081 3.70343 18.6478 3.70343 18.385C3.70343 18.1222 3.75523 17.8619 3.85588 17.6191C3.95653 17.3763 4.10405 17.1557 4.29 16.97L4.35 16.91C4.58054 16.6743 4.73519 16.375 4.794 16.0506C4.85282 15.7262 4.81312 15.3916 4.68 15.09C4.55324 14.7942 4.34276 14.542 4.07447 14.3643C3.80618 14.1866 3.49179 14.0913 3.17 14.09H3C2.46957 14.09 1.96086 13.8793 1.58579 13.5042C1.21071 13.1291 1 12.6204 1 12.09C1 11.5596 1.21071 11.0509 1.58579 10.6758C1.96086 10.3007 2.46957 10.09 3 10.09H3.09C3.42099 10.0823 3.742 9.97512 4.01062 9.78251C4.27925 9.5899 4.48266 9.32074 4.59 9.01C4.72312 8.70838 4.76282 8.37381 4.704 8.04941C4.64519 7.72502 4.49054 7.42568 4.26 7.19L4.2 7.13C4.01405 6.94425 3.86653 6.72368 3.76588 6.48088C3.66523 6.23808 3.61343 5.97783 3.61343 5.715C3.61343 5.45217 3.66523 5.19192 3.76588 4.94912C3.86653 4.70632 4.01405 4.48575 4.2 4.3C4.38575 4.11405 4.60632 3.96653 4.84912 3.86588C5.09192 3.76523 5.35217 3.71343 5.615 3.71343C5.87783 3.71343 6.13808 3.76523 6.38088 3.86588C6.62368 3.96653 6.84425 4.11405 7.03 4.3L7.09 4.36C7.32568 4.59054 7.62502 4.74519 7.94941 4.804C8.27381 4.86282 8.60838 4.82312 8.91 4.69H9C9.29577 4.56324 9.54802 4.35276 9.72569 4.08447C9.90337 3.81618 9.99872 3.50179 10 3.18V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
      )
    }
  ];

  // Build URL with shop parameter
  const buildUrl = (href) => {
    return shop ? `${href}?shop=${encodeURIComponent(shop)}` : href;
  };

  // Load wallet balance
  React.useEffect(() => {
    const loadWalletBalance = async () => {
      const balanceEl = document.getElementById('navbar-wallet-balance');
      if (!balanceEl) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const currentShop = urlParams.get('shop');
      
      if (currentShop) {
        try {
          const response = await fetch(`/api/shop-balance?shop=${encodeURIComponent(currentShop)}`, {
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.success && data.data && data.data.currentBalance !== undefined) {
            balanceEl.textContent = `₹${data.data.currentBalance.toFixed(2)}`;
          } else {
            balanceEl.textContent = '₹0.00';
          }
        } catch (error) {
          console.error('Error loading wallet balance:', error);
          balanceEl.textContent = 'Error';
        }
      } else {
        balanceEl.textContent = 'No Shop';
      }
    };
    
    loadWalletBalance();
    // Refresh every 30 seconds
    const interval = setInterval(loadWalletBalance, 30000);
    return () => clearInterval(interval);
  }, [shop]);

  // Tooltip functionality for collapsed sidebar
  React.useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    function ensureTitles() {
      const items = sidebar.querySelectorAll('button, a');
        items.forEach(el => {
        const label = el.querySelector && (el.querySelector('.menu__label') || el.querySelector('span.label'));
        if (label && !el.title) {
          el.title = label.textContent.trim();
        }
      });
    }
    
    function updateCollapsedClass() {
      if (window.innerWidth <= 1024) sidebar.classList.add('collapsed');
      else sidebar.classList.remove('collapsed');
    }
    
    ensureTitles();
    updateCollapsedClass();
    
    const handleResize = () => {
      updateCollapsedClass();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return React.createElement('aside', { className: "sidebar", 'aria-label': "Main navigation" },
    React.createElement('div', { className: "sidebar__inner" },
      React.createElement('div', { className: "sidebar__brand" },
        React.createElement('div', { className: "brand__content" },
          React.createElement('img', { 
            src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjEyMDAiIHhtbG5zOnY9Imh0dHBzOi8vdmVjdGEuaW8vbmFubyI+PHBhdGggZD0iTTE0OS4xMjUtLjI1N2w0LjgwNC0uMDExIDEzLjE1Ny0uMDAxIDE0LjMzMi0uMDEyIDI1LjEwNC0uMDExIDM3LjMzMy0uMDE2IDcwLjU2Mi0uMDI2IDU0LjQ5OC0uMDExIDE1LjY5LS4wMDUgMy45NC0uMDAxIDEwOS43MTgtLjAxOWg0LjE3OCAxOC44NjMgOC40MTEgNC4yMWwxMzMuMDgxLS4wNDEgMzMuNTI1LS4wMjEgMi4wODUtLjAwMSA2My42NjUtLjAyMmgyLjAybDQ1Ljg4MS0uMDAyaDE1LjY5OSAzLjkwNGw2Mi4xNi0uMDMgNjIuNDk0LS4wMDYgMzcuMTA2LS4wMTYgMjQuODE2LjAwNSAxNC4xMTktLjAwN0MxMDcxLjUyMi0uNjMgMTEwNC45MjMgNC4yODcgMTEzNiAyNmwyLjk2NSAyLjA2M2MzMi40MDQgMjMuNzEyIDUzLjQyMiA1OC4zMzEgNjAuMDcgOTcuODE1IDEuMDc2IDcuMTAzIDEuMjUgMTQuMDQ0IDEuMjMzIDIxLjIxOGwuMDE0IDQuMTIuMDEgMTEuMjA5LjAyIDEyLjEzNC4wMjMgMjMuNzMzLjAxMSAxOS4zMTUuMDI1IDU0Ljg4M3YyLjk4MyAyLjk4N2wuMDQ3IDQ3Ljg3LjA0MSA0OS4yNzIuMDI2IDI3LjYxNC4wMDkgMjMuNTIyLjAxMSAxMS45NzJjLjE0NiAzNS40ODctNS44MjcgNjcuNjk3LTI2LjUwNCA5Ny4yOTFsLTIuMDYyIDIuOTY1Yy0yMy43MTMgMzIuNDA1LTU4LjM1MSA1My40NDgtOTcuODQ2IDYwLjA3LTYuOTM0IDEuMDUxLTEzLjY5OCAxLjI0OS0yMC43IDEuMjNsLTMuOTYxLjAxMy0xMC43Ny4wMDljLTMuODg3IDAtNy43NzQuMDExLTExLjY2MS4wMmwtMjAuMTguMDI4LTI5LjI0NS4wNDYtNDcuNTQ4LjA4Ni0yLjg3LjAwNEw5MDcgNjAwLjVsLTIyLjk4NC4wMzItMi44NTkuMDA0LTQ3LjM1LjA4OC0yOS4xMzYuMDQyLTIwLjAwMi4wMzItMTEuNTAzLjAxM2MtNDkuMjQzLS4wMjctOTEuNDc3IDguNTY1LTEyOC4zNjUgNDMuNDU3LTMxLjI1IDMxLjU5OS00My45OTYgNzEuNzgtNDMuOTMyIDExNS41NTRsLS4wMDYgMy45NjEtLjAwNSA4LjUyNy0uMDEgMTMuODgzLS4wMTYgMjAuMTYyLS4wNDEgMzEuOTI5LS4wMTkgMTAuOTUzLS4wMDUgMi43NjQtLjA0OSAzMS4wOTEtLjAwNCAyLjg2OC0uMDQgNDUuOTU5LS4wNjggNDcuMzItLjAyNSAyOS4xMTEtLjAzMSAxOS45ODYtLjAwOCAxMS40OTJjLjA5NSAzNS4xMjEtNi4xMSA2Ny4wMy0yNi41NDEgOTYuMjcybC0yLjA2MiAyLjk2NWMtMjMuNzEyIDMyLjQwNC01OC4zMzEgNTMuNDIyLTk3LjgxNSA2MC4wNy03LjEwMyAxLjA3Ni0xNC4wNDQgMS4yNS0yMS4yMTggMS4yMzNsLTQuMTIuMDE0LTExLjIwOS4wMWMtNC4wNDUgMC04LjA4OS4wMTEtMTIuMTM0LjAybC0yMy43MzMuMDIzLTE5LjMxNS4wMTEtNTQuODgzLjAyNWgtMi45ODMtMi45ODdjLTE1Ljk1Ny0uMDAxLTMxLjkxMy4wMTgtNDcuODcuMDQ3bC00OS4yNzIuMDQxYy05LjIwNS0uMDAxLTE4LjQwOS4wMDUtMjcuNjE0LjAyNmwtMjMuNTIyLjAwOWExOTg4LjE4IDE5ODguMTggMCAwIDAtMTEuOTcyLjAxMWMtMzUuNDg3LjE0Ni02Ny42OTctNS44MjctOTcuMjkxLTI2LjUwNGwtMi45NjUtMi4wNjJjLTMyLjQwNC0yMy43MTItNTMuMzA2LTU4LjI0Ni02MC4wNzEtOTcuNjg4LTEuMTgtNy43OTYtMS4yNDUtMTUuNTEzLTEuMjIyLTIzLjM3NGwtLjAxMS00LjgwNC0uMDAxLTEzLjE1Ny0uMDEyLTE0LjMzMi0uMDExLTI1LjEwNC0uMDE2LTM3LjMzMy0uMDI2LTcwLjU2Mi0uMDExLTU0LjQ5OC0uMDA1LTE1LjY5LS4wMDEtMy45NC0uMDE5LTEwOS43MTh2LTQuMTc4LTE4Ljg2My04LjQxMS00LjIxbC0uMDQxLTEzMy4wODEtLjAyMS0zMy41MjUtLjAwMS0yLjA4NS0uMDIyLTYzLjY2NXYtMi4wMmwtLjAwMi00NS44ODF2LTE1LjY5OS0zLjkwNGwtLjAzLTYyLjE2LS4wMDYtNjIuNDk0LS4wMTYtMzcuMTA2LjAwNS0yNC44MTYtLjAwNy0xNC4xMTlDLS42MyAxMjguNDc4IDQuMjg3IDk1LjA3NyAyNiA2NGwyLjA2My0yLjk2NUM1MS43NzUgMjguNjMxIDg2LjMwOSA3LjcyOSAxMjUuNzUxLjk2NWM3Ljc5Ni0xLjE4IDE1LjUxMy0xLjI0NSAyMy4zNzQtMS4yMjJ6IiBmaWxsPSIjNTA2NWQyIi8+PHBhdGggZD0iTTc5MS44MzQgNzA4Ljg2NmwzLjU1OC0uMDE0IDMuODk2LjAwMSA0LjE0OS0uMDExIDExLjQtLjAxNiAxMi4yOTctLjAyMiAyOS43MDMtLjAzOSAxNC0uMDE1IDQ2LjU2My0uMDM5IDEyLjA4MS0uMDA2IDMuMDMzLS4wMDEgNDguNTkyLS4wNjYgNDkuOTI5LS4wNTQgMjguMDE2LS4wMzYgMjMuODcxLS4wMiAxMi4xNjQtLjAxN2MzMS4yNjItLjE0MiAzMS4yNjItLjE0MiA0My45MTYgNC40OWwzLjM0MSAxLjIwOGMxMi45MDEgNC45IDIzLjAwNCAxMi4xNTEgMzIuNjU5IDIxLjc5MmwyLjQ3MyAyLjQzOGMxNi4xMDYgMTYuNzk3IDIzLjAyNCAzOS4wMzIgMjIuOTE1IDYxLjkyNWwuMDE2IDQuMTcuMDAzIDExLjMzNC4wMTggMTIuMjcyLjAxMyAyMy45OTUuMDAzIDE5LjUxOC4wMDIgMi44MTQuMDA1IDUuNjYtLjAwMyA1Mi45OTYuMDI3IDQ4LjM5NC4wMjcgNDkuNzkxLjAxNiAyNy45MTQtLjAwMiAyMy43NjMuMDA1IDEyLjEwNGMuMTMyIDM3LjIyNS4xMzIgMzcuMjI1LTguMjY3IDUzLjc4OWwtMS4wMzUgMi4xMTdjLTMuMTAzIDYuMTU5LTYuODY0IDExLjY1OS0xMS4yMTUgMTcuMDA4bC0xLjQ0OSAxLjkwNmMtMTMuMjExIDE2LjY1Ni0zNS4wMiAyNi43NTMtNTUuNTUxIDMwLjA5NC00Ljc5NC4zODEtOS41NTUuNDExLTE0LjM2My4zODhsLTQuMTcuMDE2LTExLjMzNC4wMDNjLTQuMDkxLS4wMDUtOC4xODIuMDA4LTEyLjI3Mi4wMThsLTIzLjk5NS4wMTNjLTYuNTA2LS4wMDQtMTMuMDEyLS4wMDMtMTkuNTE4LjAwM2wtMi44MTQuMDAyLTUuNjYuMDA1Yy0xNy42NjUuMDE0LTM1LjMzLjAwOC01Mi45OTYtLjAwMy0xNi4xMzEtLjAxLTMyLjI2My4wMDMtNDguMzk0LjAyN2wtNDkuNzkxLjAyN2MtOS4zMDUtLjAwMy0xOC42MDktLjAwMS0yNy45MTQuMDE2LTcuOTIxLjAxNS0xNS44NDIuMDE1LTIzLjc2My0uMDAyLTQuMDM1LS4wMDgtOC4wNjktLjAxMS0xMi4xMDQuMDA1LTM3LjIuMTMyLTM3LjIuMTMyLTUzLjcyNi04LjIwNWwtMi4xMi0xLjA0Yy0yMi4zMzUtMTEuMzM1LTM4LjA1Ni0zMS4wNjMtNDYuMTg3LTU0LjUtNC4wMDUtMTQuMzk5LTMuNDQ1LTI5LjEzMS0zLjM4OC00My45NDdsLS4wMS0xMi4yNDcuMDA5LTIzLjkyNC4wMS0yNy45MDguMDMzLTQ5LjgxNS4wMjEtNDguMjU1LjAwMS01Mi42NTYuMDA1LTUuNjIxLjAwMi0yLjc5My0uMDAxLTE5LjQyLjAyMS0yMy42ODIuMDA3LTEyLjA2Ni4wMTgtMTEuMDcxLS4wMTItNS44NDVjLjE3OS0yNS4xMjMgMTAuNTE4LTQ2LjEyMyAyNy41MzEtNjQuMDg1IDE0LjM0My0xNC4wNDUgMzUuNDExLTI0LjUzNiA1NS43MDktMjQuNTcyeiIgZmlsbD0iIzUwNjZkMyIvPjxwYXRoIGQ9Ik04MzQuOTA0IDc4OC43MzlsMy4zMzUtLjAxMiAxMS4wNjgtLjAwMiA3LjkzNC0uMDE1IDE5LjMxOS0uMDEyIDE1LjcwOS0uMDA0IDIuMjYtLjAwMiA0LjU0NS0uMDA0IDQyLjYxNS0uMDAzIDM4Ljk1Mi0uMDI1IDQwLjAyMy0uMDI0IDIyLjQ1OS0uMDE1IDE5LjEyNS0uMDAxIDkuNzQ5LS4wMDUgMTAuNTkuMDEgMy4wODMtLjAyMmM5LjkzNC4wNzUgMTguODIgMi4wNjUgMjYuMTQyIDkuMTUgNy4zNDEgNy44MTUgOC42MzYgMTUuMDk2IDguNTc1IDI1LjUwNWwuMDE2IDMuMzc4djExLjE3NGwuMDIxIDguMDI0LjAxMyAxOS41MTQuMDAzIDE1Ljg2Ny4wMDIgMi4yODQuMDA1IDQuNTk0LS4wMDMgNDMuMDUyLjAyNyAzOS4zNS4wMjcgNDAuNDQ0LjAxNiAyMi42OS0uMDAyIDE5LjMxNy4wMDUgOS44NDctLjAxNiAxMC42OTUuMDI5IDMuMTE0Yy0uMDgxIDcuOTk2LTEuODkyIDE1LjIzNC02Ljc4IDIxLjcxMS02LjE4MSA2LjA0MS0xMy4xODUgOS45NTYtMjEuOTM3IDEwLjA2My04LjMzMS0uMTUxLTE2LjA0NC0yLjQxNC0yMi4xMDItOC4zOTUtOC43MjctMTAuMTAxLTguNTQ2LTIwLjg1OC04LjM5Mi0zMy40MjZsLS4wMDMtNS44MjguMDc1LTE1LjcyMy4wNDgtMTYuNDY4LjEyOC0zMS4xNC4xMy0zNS40NzFMMTA2MiA4ODloLTJsLS43NzEgMS43NTVjLTEuMzYzIDIuNDktMi44ODEgNC4xNS00Ljg4NSA2LjE1OWwtMi4zMTggMi4zMzctMi41NTggMi41NDgtMi43MDggMi43MjItNy40NTkgNy40NjktOC4wMzkgOC4wNTktMTUuNzYyIDE1Ljc4NS0xMi44MTkgMTIuODMtMzYuMzUxIDM2LjM3Ni0xLjk4MSAxLjk4LTEuOTgzIDEuOTgzLTMxLjc3NyAzMS44MjQtMzIuNjM2IDMyLjY3Ny0xOC4zMTkgMTguMzQ2LTE1LjYwOCAxNS42MTctNy45NTcgNy45NjctOC42NDggOC42MzgtMi41MSAyLjU0MmMtNC45MDEgNC44NDMtOS42ODUgOC40MTktMTUuOTEgMTEuMzg1bC0yLjcwMyAxLjI4OWMtNy4wMzUgMi4xNzctMTQuNzI1IDEuNDA3LTIxLjIwNy0xLjk4LTguMTEzLTUuMDgtMTMuMDEtMTEuMTM1LTE2LjA5LTIwLjMwOS0xLjQyOS04Ljc5NC4zNzMtMTUuODQyIDUuNDQ5LTIzLjA2MSA0LjUwMy01Ljg1MiA5LjQyNC0xMS4wOTUgMTQuNjU1LTE2LjI5OGwyLjcxMS0yLjcyMSA3LjM5OC03LjM5NiA3Ljk5OC04LjAwNiAxNS42NDItMTUuNjQ0IDEyLjcwOC0xMi43MDUgMS44MjktMS44MyAzLjY3OC0zLjY4IDM0LjQ1MS0zNC40MzkgMjkuNTc0LTI5LjU3NiAzNC4zNTMtMzQuMzYyIDMuNjYtMy42NTggMS44MTktMS44MTggMTIuNzA0LTEyLjcxIDE1LjQ2NS0xNS40NTggNy44OTMtNy44OTMgOC41NDMtOC41MzEgMi41MzgtMi41NTIgMi4zLTIuMjg0IDEuOTkzLTEuOTkyQzEwMTggODQ5IDEwMTggODQ5IDEwMjAgODQ5di0ybC0zLjAzMy4wMTEtNzMuMTE0LjE5Ni0zNS4zNTguMDk1LTMwLjgyMy4wNzUtMTYuMzE2LjA0Ny0xNS4zNy4wMy01LjYyOC4wMjRjLTExLjcxNC4wOTEtMjIuNzA4LjA1NC0zMS43NTItOC41MzktNi4xNDYtNy40MTctOC41NzQtMTUuMDE3LTguMTI5LTI0LjU5OCAxLjU5NC0xMC4xNjggNy41OTktMTYuMzIxIDE1LjU4Mi0yMi4yMjcgNi4xMDItMy40OTkgMTIuMDE2LTMuMzk5IDE4Ljg0Ni0zLjM3NHoiIGZpbGw9IiNmZGZlZmUiLz48L3N2Zz4=", 
            alt: "Scalysis", 
            className: "brand__logo"
          }),
          React.createElement('span', { className: "brand__text" }, "Scalysis")
        )
      ),
      React.createElement('nav', { className: "sidebar__nav", role: "navigation" },
        React.createElement('ul', { className: "menu" },
          ...menuItems.map((item) => 
            React.createElement('li', { 
              key: item.id, 
              className: `menu__item ${activePage === item.id ? 'menu__item--active' : ''}`
            },
              React.createElement('a', { 
                href: buildUrl(item.href), 
                className: "menu__btn",
                ...(activePage === item.id ? { 'aria-current': 'page' } : {})
              },
                React.createElement('span', { className: "menu__icon", 'aria-hidden': "true" }, item.icon),
                React.createElement('span', { className: "menu__label" }, item.label)
              )
            )
          )
        )
      ),
      React.createElement('div', { className: "sidebar__footer" },
        // Wallet balance section
        React.createElement('div', { 
          className: "wallet-section",
          style: {
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }
        },
          React.createElement('div', { 
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1F2937'
            }
          },
            React.createElement('span', null, 'Balance:'),
            React.createElement('span', { id: 'navbar-wallet-balance', style: { color: '#10B981' } }, 'Loading...')
          ),
          React.createElement('button', {
            className: "btn btn-primary",
            style: {
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              background: '#4B5CFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            },
            onClick: () => {
              const modal = document.getElementById('recharge-modal');
              if (modal) {
                modal.style.display = 'flex';
              } else {
                console.error('Recharge modal not found on this page');
              }
            }
          }, 'Recharge')
        ),
        // Settings, Help, Logout buttons
        React.createElement('div', { style: { display: 'flex', gap: '4px', padding: '8px' } },
          React.createElement('button', { 
            className: "footer__btn", 
            title: "Settings", 
            'aria-label': "Settings",
            onClick: () => {
              const shop = new URLSearchParams(window.location.search).get('shop');
              window.location.href = `/settings${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`;
            }
          },
            React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
              React.createElement('path', { d: "M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
              React.createElement('path', { d: "M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5166 9 19.41C8.69838 19.2769 8.36381 19.2372 8.03941 19.296C7.71502 19.3548 7.41568 19.5095 7.18 19.74L7.12 19.8C6.93425 19.986 6.71368 20.1335 6.47088 20.2341C6.22808 20.3348 5.96783 20.3866 5.705 20.3866C5.44217 20.3866 5.18192 20.3348 4.93912 20.2341C4.69632 20.1335 4.47575 19.986 4.29 19.8C4.10405 19.6143 3.95653 19.3937 3.85588 19.1509C3.75523 18.9081 3.70343 18.6478 3.70343 18.385C3.70343 18.1222 3.75523 17.8619 3.85588 17.6191C3.95653 17.3763 4.10405 17.1557 4.29 16.97L4.35 16.91C4.58054 16.6743 4.73519 16.375 4.794 16.0506C4.85282 15.7262 4.81312 15.3916 4.68 15.09C4.55324 14.7942 4.34276 14.542 4.07447 14.3643C3.80618 14.1866 3.49179 14.0913 3.17 14.09H3C2.46957 14.09 1.96086 13.8793 1.58579 13.5042C1.21071 13.1291 1 12.6204 1 12.09C1 11.5596 1.21071 11.0509 1.58579 10.6758C1.96086 10.3007 2.46957 10.09 3 10.09H3.09C3.42099 10.0823 3.742 9.97512 4.01062 9.78251C4.27925 9.5899 4.48266 9.32074 4.59 9.01C4.72312 8.70838 4.76282 8.37381 4.704 8.04941C4.64519 7.72502 4.49054 7.42568 4.26 7.19L4.2 7.13C4.01405 6.94425 3.86653 6.72368 3.76588 6.48088C3.66523 6.23808 3.61343 5.97783 3.61343 5.715C3.61343 5.45217 3.66523 5.19192 3.76588 4.94912C3.86653 4.70632 4.01405 4.48575 4.2 4.3C4.38575 4.11405 4.60632 3.96653 4.84912 3.86588C5.09192 3.76523 5.35217 3.71343 5.615 3.71343C5.87783 3.71343 6.13808 3.76523 6.38088 3.86588C6.62368 3.96653 6.84425 4.11405 7.03 4.3L7.09 4.36C7.32568 4.59054 7.62502 4.74519 7.94941 4.804C8.27381 4.86282 8.60838 4.82312 8.91 4.69H9C9.29577 4.56324 9.54802 4.35276 9.72569 4.08447C9.90337 3.81618 9.99872 3.50179 10 3.18V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
            )
          ),
          React.createElement('button', { className: "footer__btn", title: "Help", 'aria-label': "Help" },
            React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
              React.createElement('path', { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z", fill: "currentColor" })
            )
          ),
          React.createElement('button', { 
            className: "footer__btn", 
            title: "Logout", 
            'aria-label': "Logout", 
            onClick: () => window.location.href = '/auth/logout'
          },
            React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
              React.createElement('path', { d: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z", fill: "currentColor" })
            )
          )
        )
      )
    )
  );
};

// Make Navbar available globally
window.Navbar = Navbar;
