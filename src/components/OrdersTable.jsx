import React, { useState } from 'react';
import './OrdersTable.css';

// Status tag configurations with consistent colors
const STATUS_CONFIG = {
  // Call Status
  'not_called': { label: 'Not Called', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
  'queued': { label: 'Queued', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  'in_progress': { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  'completed': { label: 'Completed', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'failed': { label: 'Failed', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  'on_call': { label: 'On Call', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'talking': { label: 'Talking', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'connected': { label: 'Connected', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  
  // Order Status
  'pending': { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  'confirmed': { label: 'Confirmed', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'cancelled': { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  'refunded': { label: 'Refunded', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' },
  
  // Fulfillment Status
  'fulfilled': { label: 'Fulfilled', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'unfulfilled': { label: 'Unfulfilled', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
  'partial': { label: 'Partial', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  
  // Payment Status
  'prepaid': { label: 'Prepaid', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'cod': { label: 'COD', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  'paid': { label: 'Paid', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'pending_payment': { label: 'Pending Payment', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
  
  // RTO Reasons
  'bad_address': { label: 'Bad Address', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  'impulsive': { label: 'Impulsive', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' },
  'high_intent': { label: 'High Intent', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  'sussy': { label: 'Suspicious', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  'spam': { label: 'Spam', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
};

// Status Badge Component
const StatusBadge = ({ status, type = 'call' }) => {
  const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG['not_called'];
  
  return (
    <span 
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {config.label}
    </span>
  );
};

// Priority Indicator Component
const PriorityIndicator = ({ priority, hasIssue = false }) => {
  if (hasIssue) {
    return (
      <span style={{ color: '#DC2626', fontSize: '16px', fontWeight: 'bold' }}>!</span>
    );
  }
  
  if (priority && priority > 0) {
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[...Array(Math.min(priority, 3))].map((_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: '12px',
              backgroundColor: priority === 3 ? '#DC2626' : priority === 2 ? '#F59E0B' : '#2563EB',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
    );
  }
  
  return null;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  if (!amount) return 'N/A';
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(num);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

// Format relative date
const formatRelativeDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (orderDateOnly.getTime() === today.getTime()) {
    return `Today at ${time}`;
  }
  
  if (orderDateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday at ${time}`;
  }
  
  const daysDiff = Math.floor((today - orderDateOnly) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} at ${time}`;
  }
  
  return formatDate(dateString);
};

// Main Orders Table Component
const OrdersTable = ({ 
  orders = [], 
  onOrderSelect,
  selectedOrders = new Set(),
  onSelectAll,
  selectAll = false,
  onSort,
  sortColumn = null,
  sortDirection = 'asc',
  loading = false
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  const handleSort = (column) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    if (onSort) {
      onSort(column, newDirection);
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <span style={{ color: '#9CA3AF', fontSize: '12px' }}>↕</span>;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
        No orders found
      </div>
    );
  }

  return (
    <div className="orders-table-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </th>
            <th 
              onClick={() => handleSort('priority')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Priority
                {getSortIcon('priority')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('orderNumber')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Order #
                {getSortIcon('orderNumber')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('customerName')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Customer
                {getSortIcon('customerName')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('totalPrice')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Amount
                {getSortIcon('totalPrice')}
              </div>
            </th>
            <th>Address</th>
            <th>Payment</th>
            <th>Fulfillment</th>
            <th 
              onClick={() => handleSort('callStatus')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Status
                {getSortIcon('callStatus')}
              </div>
            </th>
            <th 
              onClick={() => handleSort('createdAt')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Date
                {getSortIcon('createdAt')}
              </div>
            </th>
            <th>Next Step</th>
            <th style={{ width: '50px' }}></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const orderId = order.id || order.orderId;
            const isSelected = selectedOrders.has(orderId);
            const isHovered = hoveredRow === orderId;
            
            // Determine payment status
            const paymentMethod = order.paymentGatewayNames?.[0] || 
                                 order.paymentMethod || 
                                 (order.totalPrice && parseFloat(order.totalPrice) > 0 ? 'prepaid' : 'cod');
            const isPrepaid = paymentMethod?.toLowerCase().includes('prepaid') || 
                             paymentMethod?.toLowerCase().includes('paid') ||
                             paymentMethod?.toLowerCase() === 'prepaid';
            
            // Determine fulfillment status
            const fulfillmentStatus = order.fulfillmentStatus || 'unfulfilled';
            
            // Determine call status
            const callStatus = order.callStatus || 'not_called';
            
            // Determine priority (can be based on order value, urgency, etc.)
            const priority = order.callPriority || 0;
            const hasIssue = order.riskReasons && order.riskReasons.length > 0;
            
            // Next step logic
            const getNextStep = () => {
              if (callStatus === 'not_called') return 'Initiate call';
              if (callStatus === 'queued') return 'Waiting in queue';
              if (callStatus === 'in_progress' || callStatus === 'on_call') return 'Call in progress';
              if (callStatus === 'completed') return 'Review call';
              if (callStatus === 'failed') return 'Retry call';
              return 'Follow up';
            };

            return (
              <tr
                key={orderId}
                className={`order-row ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredRow(orderId)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  backgroundColor: isSelected ? '#F9FAFB' : isHovered ? '#F9FAFB' : '#FFFFFF',
                  transition: 'background-color 0.15s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onOrderSelect && onOrderSelect(order)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (onOrderSelect) {
                        onOrderSelect(order, !isSelected);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <PriorityIndicator priority={priority} hasIssue={hasIssue} />
                </td>
                <td style={{ fontWeight: 600, color: '#111827' }}>
                  #{order.orderNumber || order.orderId || orderId}
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: '#111827' }}>
                    {order.customerName || 'N/A'}
                  </div>
                  {order.customerEmail && (
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {order.customerEmail}
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 500, color: '#111827' }}>
                  {formatCurrency(order.totalPrice, order.currency)}
                </td>
                <td style={{ 
                  color: '#6B7280', 
                  maxWidth: '200px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {order.customerAddress || 'N/A'}
                </td>
                <td>
                  <StatusBadge 
                    status={isPrepaid ? 'prepaid' : 'cod'} 
                    type="payment"
                  />
                </td>
                <td>
                  <StatusBadge 
                    status={fulfillmentStatus} 
                    type="fulfillment"
                  />
                </td>
                <td>
                  <StatusBadge 
                    status={callStatus} 
                    type="call"
                  />
                </td>
                <td style={{ color: '#6B7280', fontSize: '13px' }}>
                  {formatRelativeDate(order.createdAt)}
                </td>
                <td style={{ color: '#6B7280', fontSize: '13px' }}>
                  {getNextStep()}
                </td>
                <td 
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'relative' }}
                >
                  <button
                    className="action-menu-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === orderId ? null : orderId);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                      color: '#6B7280',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    ⋯
                  </button>
                  {openActionMenu === orderId && (
                    <div 
                      className="action-menu-dropdown"
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '100%',
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        zIndex: 1000,
                        minWidth: '140px',
                        marginTop: '4px',
                        overflow: 'hidden'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="action-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenu(null);
                          // TODO: Implement call functionality
                        }}
                      >
                        Call
                      </div>
                      <div
                        className="action-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenu(null);
                          // TODO: Implement view details
                        }}
                      >
                        View Details
                      </div>
                      <div
                        className="action-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenu(null);
                          // TODO: Implement tag functionality
                        }}
                      >
                        Add Tag
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;


