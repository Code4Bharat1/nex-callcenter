// Pricing Content Component - JavaScript version (no JSX)

(function() {
    const { createElement: h, useState, useEffect } = React;

    const PricingContent = ({ shop }) => {
        const [billingData, setBillingData] = useState({
            usageCharges: 0,
            channelCharges: 0,
            combinedTotal: 0
        });
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            loadBillingData();
        }, [shop]);

        const loadBillingData = async () => {
            try {
                console.log('💰 Loading billing data for shop:', shop);
                setLoading(true);
                
                const response = await fetch(`/api/billing-data?shop=${shop}`);
                const data = await response.json();
                
                if (data.success) {
                    setBillingData(data.data);
                } else {
                    console.error('❌ Failed to load billing data:', data.error);
                }
            } catch (error) {
                console.error('❌ Error loading billing data:', error);
            } finally {
                setLoading(false);
            }
        };

        return h('div', { className: 'pricing-content' },
            // Pricing Header
            h('div', { className: 'pricing-header' },
                h('p', { className: 'pricing-subtitle' }, 'Transparent pricing for AI calling services')
            ),
            
            // Context Note
            h('div', { className: 'context-note' },
                h('div', { className: 'context-icon' }, 'ℹ️'),
                h('div', { className: 'context-text' },
                    h('div', { className: 'context-title' }, 'Billing Structure'),
                    h('div', null, 'Channel fees are a monthly charge and are shown separately from running call fees. The combined total reflects both line items.')
                )
            ),
            
            // Pricing Grid
            h('div', { className: 'pricing-grid' },
                // Per-Second Rate Card
                h('div', { className: 'pricing-card featured' },
                    h('h3', { className: 'card-title' }, 'Per-Second Rate'),
                    h('div', { className: 'rate-comparison' },
                        h('div', { className: 'rate-item' },
                            h('div', { className: 'rate-value' }, '₹0.042'),
                            h('div', { className: 'rate-label' }, 'PER SECOND')
                        )
                    ),
                    h('div', { className: 'rate-description' },
                        'Pay only for the time you use. No hidden fees or minimum charges.'
                    )
                ),
                
                // Minute Rate Card
                h('div', { className: 'pricing-card' },
                    h('h3', { className: 'card-title' }, 'Minute Rate (for comparison)'),
                    h('div', { className: 'rate-comparison' },
                        h('div', { className: 'rate-item' },
                            h('div', { className: 'rate-value' }, '₹4'),
                            h('div', { className: 'rate-label' }, 'PER MINUTE')
                        )
                    ),
                    h('div', { className: 'rate-description' },
                        h('span', { className: 'highlight' }, '₹0.068 per minute (6.8 paisa/min)'),
                        h('br'),
                        'Billed per minute'
                    )
                )
            ),
            
            // Channel Pricing
            h('div', { className: 'channel-pricing' },
                h('h3', { className: 'channel-title' }, 'Channel Pricing'),
                h('div', { className: 'channel-info' },
                    h('div', { className: 'channel-item' },
                        h('div', { className: 'channel-price' }, '₹1,200'),
                        h('div', { className: 'channel-details' }, 'Per channel per month')
                    ),
                    h('div', { className: 'channel-item' },
                        h('div', { className: 'channel-price' }, '2 Free'),
                        h('div', { className: 'channel-details' }, 'Channels included at no cost')
                    )
                )
            ),
            
            // Billing Summary
            h('div', { className: 'billing-summary' },
                h('h3', { className: 'billing-title' }, 'Billing Summary'),
                h('div', { className: 'billing-breakdown' },
                    h('div', { className: 'billing-item' },
                        h('div', { className: 'billing-label' }, 'Usage Charges'),
                        h('div', { className: 'billing-value' }, 
                            loading ? 'Loading...' : `₹${billingData.usageCharges.toLocaleString()}`
                        )
                    ),
                    h('div', { className: 'billing-item' },
                        h('div', { className: 'billing-label' }, 'Channel Charges'),
                        h('div', { className: 'billing-value' }, 
                            loading ? 'Loading...' : `₹${billingData.channelCharges.toLocaleString()}`
                        )
                    ),
                    h('div', { className: 'billing-item' },
                        h('div', { className: 'billing-label' }, 'Combined Total'),
                        h('div', { className: 'billing-value' }, 
                            loading ? 'Loading...' : `₹${billingData.combinedTotal.toLocaleString()}`
                        )
                    )
                ),
                h('div', { className: 'billing-note' },
                    'Usage charges calculated at ₹0.042 per second. Channel charges are ₹1,200 per month (2 channels free).'
                )
            )
        );
    };

    window.PricingContent = PricingContent;
})();
