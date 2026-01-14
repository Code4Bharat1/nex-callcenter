import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import './AbandonedCheckouts.css';

const PAGE_SIZE = 25;

const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

const formatCurrency = (value) => {
  if (!value) return '—';
  const numeric = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
  if (Number.isNaN(numeric)) return value;
  return `₹${numeric.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusPill = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('queued')) return 'queued';
  if (normalized.includes('complete')) return 'success';
  if (normalized.includes('fail') || normalized.includes('not_pick')) return 'danger';
  return 'neutral';
};

const AbandonedCheckouts = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadOrders = async ({ pageOverride, searchOverride } = {}) => {
    if (!shop) return;
    setLoading(true);
    setError('');

    const currentPage = pageOverride ?? page;
    const currentSearch = searchOverride ?? searchQuery;

    try {
      const params = new URLSearchParams({
        shop,
        limit: PAGE_SIZE,
        page: currentPage,
        timeRange
      });

      if (currentSearch?.trim()) {
        params.append('search', currentSearch.trim());
      }

      const response = await fetch(`/api/abandoned-checkouts?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load abandoned checkouts');
      }

      setOrders(data.orders || []);
      setPagination(data.pagination || null);
      setPage(currentPage);
    } catch (err) {
      console.error('[Abandoned] Fetch error:', err);
      setError(err.message || 'Failed to load abandoned checkout orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shop) return;
    loadOrders({ pageOverride: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, timeRange]);

  useEffect(() => {
    if (!shop) return;
    const handle = setTimeout(() => {
      loadOrders({ pageOverride: 1, searchOverride: searchQuery });
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const totalValue = useMemo(() => {
    return orders.reduce((sum, order) => {
      const numeric = parseFloat((order.totalPrice || '').toString().replace(/[^\d.-]/g, ''));
      if (Number.isNaN(numeric)) return sum;
      return sum + numeric;
    }, 0);
  }, [orders]);

  const queuedCount = useMemo(
    () => orders.filter((order) => (order.callStatus || '').toLowerCase().includes('queue')).length,
    [orders]
  );

  const needsAttentionCount = useMemo(
    () =>
      orders.filter((order) => {
        const status = (order.callStatus || '').toLowerCase();
        return !status || status.includes('not_called') || status.includes('failed');
      }).length,
    [orders]
  );

  const handlePageChange = (direction) => {
    if (!pagination) return;
    const nextPage = direction === 'next' ? page + 1 : page - 1;
    if (nextPage < 1 || (pagination.totalPages && nextPage > pagination.totalPages)) return;
    loadOrders({ pageOverride: nextPage });
  };

  const activeTimeLabel =
    TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.label || 'Custom';

  return (
    <div className="abandoned-page">
      <section className="abandoned-hero">
        <div className="hero-copy">
          <p className="abandoned-eyebrow">Revenue Recovery · Journey Endpoints</p>
          <h1>Abandoned Orders</h1>
          <p className="abandoned-subtitle">
            Track shoppers who stalled after entering shipping details and push them back to
            conversion with live calling.
          </p>
          <div className="hero-badges">
            <span className="hero-badge success-dot">Stripe & Shopify synced</span>
            <span className="hero-badge neutral-dot">{activeTimeLabel} window</span>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-metric">
            <p>Abandoned pipeline</p>
            <strong>{(pagination?.totalCount ?? 0).toLocaleString()}</strong>
            <span>Orders captured inside this view</span>
          </div>
          <div className="hero-metric bordered">
            <p>Recovery potential</p>
            <strong>{formatCurrency(totalValue)}</strong>
            <span>Value sitting inside current page</span>
          </div>
          <button
            className="abandoned-refresh-btn"
            onClick={() => loadOrders({ pageOverride: 1 })}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh data
          </button>
        </div>
      </section>

      <section className="abandoned-stats-grid">
        <article className="abandoned-stat-card gradient">
          <div className="stat-icon pulse">
            <div />
          </div>
          <div>
            <p>Total abandoned</p>
            <h2>{(pagination?.totalCount ?? 0).toLocaleString()}</h2>
            <span>Across the selected time window</span>
          </div>
        </article>
        <article className="abandoned-stat-card info">
          <div className="stat-icon info-dot" />
          <div>
            <p>Queued / Active callbacks</p>
            <h3>{queuedCount.toLocaleString()}</h3>
            <span>Orders already in dialer queue</span>
          </div>
        </article>
        <article className="abandoned-stat-card warning">
          <div className="stat-icon warning-dot" />
          <div>
            <p>Requires human follow-up</p>
            <h3>{needsAttentionCount.toLocaleString()}</h3>
            <span>Failed first attempt or never contacted</span>
          </div>
        </article>
        <article className="abandoned-stat-card success">
          <div className="stat-icon success-dot" />
          <div>
            <p>Win-back routing health</p>
            <h3>{Math.max(0, (queuedCount - needsAttentionCount)).toLocaleString()}</h3>
            <span>Orders ready for next attempt</span>
          </div>
        </article>
      </section>

      <div className="abandoned-controls">
        <div className="abandoned-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by order number, customer, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="abandoned-filter-group">
          <Filter size={16} />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            {TIME_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="abandoned-error">
          <div className="error-icon">
            <AlertCircle size={18} />
          </div>
          <div>
            <p>Failed to fetch abandoned checkout feed</p>
            <small>{error}</small>
          </div>
        </div>
      )}

      <div className="abandoned-table-card">
        {loading ? (
          <div className="abandoned-loading">
            <RefreshCw size={20} className="spinning" />
            <span>Crunching abandoned checkout telemetry…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="abandoned-empty">
            <div className="empty-illustration">
              <span>🛒</span>
            </div>
            <h3>No abandoned baskets for {activeTimeLabel.toLowerCase()}.</h3>
            <p>Great news! Expand the time filter or refresh again to monitor new signals.</p>
          </div>
        ) : (
          <div className="abandoned-table-wrapper">
            <table className="abandoned-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Call Status</th>
                  <th>Created</th>
                  <th>Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const orderStatusClass = `status-pill ${getStatusPill(order.orderStatus)}`;
                  const callStatusClass = `status-pill ${getStatusPill(order.callStatus)}`;
                  return (
                    <tr key={order.orderId || order.id}>
                      <td>
                        <div className="order-cell">
                          <span className="order-number">#{order.orderNumber || order.orderId || '—'}</span>
                          <span className="order-source">{order.shop || shop}</span>
                        </div>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span>{order.customerName || 'Unknown customer'}</span>
                          {order.customerEmail && <small>{order.customerEmail}</small>}
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>{order.customerPhone || '—'}</span>
                          {order.customerAddress && (
                            <small>{order.customerAddress.length > 60 ? `${order.customerAddress.slice(0, 60)}…` : order.customerAddress}</small>
                          )}
                        </div>
                      </td>
                      <td>{formatCurrency(order.totalPrice)}</td>
                      <td>
                        <span className={orderStatusClass}>{order.orderStatus || 'Pending'}</span>
                      </td>
                      <td>
                        <span className={callStatusClass}>{order.callStatus || 'Not called'}</span>
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>{order.lastCallAttempt ? formatDateTime(order.lastCallAttempt) : 'Never'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && pagination && (
          <div className="abandoned-pagination">
            <button onClick={() => handlePageChange('prev')} disabled={page <= 1}>
              <ChevronLeft size={16} />
              Prev
            </button>
            <span>
              Page {pagination.currentPage || page} {pagination.totalPages ? `of ${pagination.totalPages}` : null}
            </span>
            <button
              onClick={() => handlePageChange('next')}
              disabled={pagination.totalPages ? page >= pagination.totalPages : orders.length < PAGE_SIZE}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbandonedCheckouts;


