import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import OrdersTable from '../components/OrdersTable';
import Loading from '../components/Loading';
import './OrdersPage.css';

const OrdersPage = ({ shop }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Active filters count
  const activeFiltersCount = [
    searchQuery && 1,
    statusFilter !== 'all' && 1,
    paymentFilter !== 'all' && 1,
    fulfillmentFilter !== 'all' && 1,
    dateRange !== 'all' && 1
  ].filter(Boolean).length;

  useEffect(() => {
    loadOrders();
  }, [shop, currentPage, pageSize, sortColumn, sortDirection, statusFilter, paymentFilter, fulfillmentFilter, dateRange]);

  const loadOrders = async () => {
    if (!shop) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shop: shop,
        limit: pageSize,
        page: currentPage,
        sortBy: sortColumn,
        sortDirection: sortDirection
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('paymentType', paymentFilter);
      if (fulfillmentFilter !== 'all') params.append('fulfillmentStatus', fulfillmentFilter);
      if (dateRange !== 'all') params.append('timeRange', dateRange);

      const response = await api.get(`/api/orders?${params.toString()}`);
      
      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        setTotalCount(response.data.pagination?.totalCount || response.data.orders.length);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(orders.map(o => o.id || o.orderId));
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleOrderSelect = (order, isSelected) => {
    const orderId = order.id || order.orderId;
    const newSelected = new Set(selectedOrders);
    
    if (isSelected) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    
    setSelectedOrders(newSelected);
    setSelectAll(newSelected.size === orders.length && orders.length > 0);
  };

  const handleSort = (column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setFulfillmentFilter('all');
    setDateRange('all');
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }
    
    // TODO: Implement bulk actions
    console.log(`Bulk ${action} for ${selectedOrders.size} orders`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-page-header">
        <div>
          <h1 className="orders-page-title">All Orders</h1>
          <p className="orders-page-subtitle">
            {totalCount} {totalCount === 1 ? 'order' : 'orders'} found
          </p>
        </div>
        <div className="orders-page-actions">
          <button 
            className="btn-secondary"
            onClick={() => {/* TODO: Import/Export */}}
          >
            Import/Export
          </button>
          <button 
            className="btn-primary"
            onClick={() => {/* TODO: Add new */}}
          >
            + Add new
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-count">
            {selectedOrders.size} {selectedOrders.size === 1 ? 'order' : 'orders'} selected
          </span>
          <div className="bulk-actions-buttons">
            <button 
              className="bulk-action-btn"
              onClick={() => handleBulkAction('update')}
            >
              Update
            </button>
            <button 
              className="bulk-action-btn"
              onClick={() => handleBulkAction('tag')}
            >
              Add Tag
            </button>
            <button 
              className="bulk-action-btn"
              onClick={() => handleBulkAction('export')}
            >
              Export
            </button>
            <button 
              className="bulk-action-btn-clear"
              onClick={() => {
                setSelectedOrders(new Set());
                setSelectAll(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-row">
          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              placeholder="Search orders, customers, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="filter-group">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="not_called">Not Called</option>
              <option value="queued">Queued</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Payment</option>
              <option value="prepaid">Prepaid</option>
              <option value="cod">COD</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={fulfillmentFilter}
              onChange={(e) => {
                setFulfillmentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Fulfillment</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="unfulfilled">Unfulfilled</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>

        <div className="filters-actions">
          {activeFiltersCount > 0 && (
            <button 
              className="filter-badge"
              onClick={clearFilters}
            >
              Filter {activeFiltersCount}
            </button>
          )}
          <button 
            className="btn-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sort Info */}
      {sortColumn && (
        <div className="sort-info">
          <span>
            ↑↓ Sort {sortColumn === 'orderNumber' ? 'Order' : 
                     sortColumn === 'customerName' ? 'Customer' :
                     sortColumn === 'totalPrice' ? 'Amount' :
                     sortColumn === 'callStatus' ? 'Status' :
                     sortColumn === 'createdAt' ? 'Date' : sortColumn} ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
          </span>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-wrapper">
        {loading ? (
          <Loading />
        ) : (
          <OrdersTable
            orders={orders}
            onOrderSelect={handleOrderSelect}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            selectAll={selectAll}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            loading={loading}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;


