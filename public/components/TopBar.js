// TopBar React Component
(function() {
    const { createElement: h, useState, useEffect } = React;

    const TopBar = ({ pageTitle, shop, walletBalance, onWalletClick, onLogout }) => {
        const [walletAmount, setWalletAmount] = useState('Loading...');
        const [userProfile, setUserProfile] = useState({ name: '', avatar: '' });

        useEffect(() => {
            // Load wallet balance if provided
            if (walletBalance) {
                setWalletAmount(walletBalance);
            } else {
                // Fetch wallet balance from API
                const urlParams = new URLSearchParams(window.location.search);
                const shop = urlParams.get('shop');
                
                if (shop) {
                    fetch(`/api/shop-balance?shop=${shop}`, {
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.data && data.data.currentBalance !== undefined) {
                            const balance = data.data.currentBalance;
                            setWalletAmount(`₹${balance.toFixed(2)}`);
                        } else {
                            setWalletAmount('Error');
                        }
                    })
                    .catch(error => {
                        console.error('Error loading wallet balance:', error);
                        setWalletAmount('Error');
                    });
                } else {
                    setWalletAmount('No Shop');
                }
            }

            // Load user profile
            fetch('/api/user/profile', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    setUserProfile({
                        name: data.data.name || '',
                        avatar: data.data.avatar || ''
                    });
                }
            })
            .catch(error => {
                console.error('Error loading user profile:', error);
            });
        }, [walletBalance]);

        const handleWalletClick = () => {
            if (onWalletClick) {
                onWalletClick();
            } else {
                // Default behavior - navigate to usage page
                const currentShop = new URLSearchParams(window.location.search).get('shop');
                window.location.href = `/usage?shop=${encodeURIComponent(currentShop || '')}`;
            }
        };

        const handleLogout = () => {
            if (onLogout) {
                onLogout();
            } else {
                // Default behavior - navigate to logout
                window.location.href = '/auth/logout';
            }
        };

        return h('div', { className: 'main-header' },
            h('h1', null, pageTitle || 'Page Title'),
            h('div', { className: 'user-menu' },
                h('div', { 
                    className: 'wallet-balance', 
                    onClick: handleWalletClick,
                    style: { cursor: 'pointer' }
                },
                    h('div', { className: 'wallet-icon' },
                        h('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                            h('path', { d: 'M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z', stroke: 'currentColor', strokeWidth: '2' }),
                            h('path', { d: 'M12 6V12L16 14', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
                        )
                    ),
                    h('span', { className: 'wallet-amount' }, walletAmount)
                ),
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    userProfile.avatar ? h('img', {
                        src: userProfile.avatar,
                        alt: 'Profile',
                        style: {
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e5e7eb'
                        }
                    }) : null,
                    h('span', null, `Welcome, ${userProfile.name || shop || 'User'}`)
                ),
                h('a', {
                    href: 'https://www.truecaller.com/search/in/1913528324',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    style: { textDecoration: 'underline', color: '#1F2937', marginRight: '16px' }
                }, '1913528324'),
                h('a', { 
                    href: '#', 
                    className: 'logout-btn',
                    onClick: (e) => {
                        e.preventDefault();
                        handleLogout();
                    }
                }, 'Logout')
            )
        );
    };

    window.TopBar = TopBar; // Expose TopBar globally
})();
