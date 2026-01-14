import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Settings } from 'lucide-react';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { parseTranscript } from '../utils/transcriptParser';
import './Dashboard2.css';
import './Settings.css';
import './Campaigns.css';

// Memoji files array
const MEMOJI_FILES = [
  '/images/1 Happy.svg',
  '/images/2 Happy.svg',
  '/images/3 happy.svg',
  '/images/4 happy.svg',
  '/images/6 happy.svg',
  '/images/Character=Angela, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Darlene, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Jeniffer, Skin tone=White, Posture=1 Happy.svg',
  '/images/Character=Kim, Skin tone=White, Posture=1 Happy.svg',
];

// Light background colors for memojis
const MEMOJI_BACKGROUNDS = [
  '#F9FFF1', '#FFF9F0', '#F0F9FF', '#F9F0FF', '#FFF0F9',
  '#F0FFF9', '#FFF5F0', '#F5F0FF', '#F0F5FF', '#FFF0F5',
];

// Get memoji and background for an agent (consistent based on agent ID)
const getAgentMemoji = (agentId) => {
  const index = agentId ? (parseInt(agentId) % MEMOJI_FILES.length) : 0;
  const bgIndex = agentId ? (parseInt(agentId) % MEMOJI_BACKGROUNDS.length) : 0;
  return {
    memoji: MEMOJI_FILES[index],
    background: MEMOJI_BACKGROUNDS[bgIndex],
  };
};

// Format date relative to today (e.g., "today at 2:43 PM", "yesterday at 2:43 PM")
const formatRelativeDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Format time
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Check if today
  if (orderDateOnly.getTime() === today.getTime()) {
    return `today at ${time}`;
  }
  
  // Check if yesterday
  if (orderDateOnly.getTime() === yesterday.getTime()) {
    return `yesterday at ${time}`;
  }
  
  // For older dates, show a shorter format
  const daysDiff = Math.floor((today - orderDateOnly) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    // Within a week, show day name
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} at ${time}`;
  }
  
  // Older than a week, show date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  }) + ` at ${time}`;
};

// Format date as "DD Mon, YYYY" (e.g., "11 Feb, 2024")
const formatTableDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

// Mini Graph Component for RTO Bucket Boxes
const MiniGraph = ({ data = [], isActive = false, animate = false }) => {
  const width = 80;
  const height = 35;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Use provided data or show empty
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <text x={width/2} y={height/2} textAnchor="middle" fontSize="10" fill="#9CA3AF">No data</text>
      </svg>
    );
  }
  
  const currentData = data;
  const previousData = currentData.map(v => v * 0.85); // Previous period (85% of current)
  
  const maxValue = Math.max(...currentData, ...previousData, 100);
  const minValue = Math.min(...currentData, ...previousData, 0);
  const valueRange = maxValue - minValue || 1;
  
  const currentPoints = currentData.map((value, i) => {
    const x = padding.left + (i / (currentData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((value - minValue) / valueRange) * graphHeight;
    return { x, y };
  });
  
  const previousPoints = previousData.map((value, i) => {
    const x = padding.left + (i / (previousData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((value - minValue) / valueRange) * graphHeight;
    return { x, y };
  });
  
  const createPath = (points, progress = 1) => {
    if (points.length < 2) return '';
    const visiblePoints = Math.ceil(points.length * progress);
    if (visiblePoints < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < visiblePoints; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    // If partial progress, add the last point interpolated
    if (visiblePoints < points.length && progress < 1) {
      const lastIndex = visiblePoints - 1;
      const nextIndex = visiblePoints;
      const t = (progress * points.length) - lastIndex;
      const x = points[lastIndex].x + (points[nextIndex].x - points[lastIndex].x) * t;
      const y = points[lastIndex].y + (points[nextIndex].y - points[lastIndex].y) * t;
      path += ` L ${x} ${y}`;
    }
    return path;
  };
  
  // Animation effect
  useEffect(() => {
    if (animate) {
      setAnimationProgress(0);
      const duration = 1000; // 1 second
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setAnimationProgress(1);
    }
  }, [animate]);
  
  const currentPath = createPath(currentPoints, animationProgress);
  const previousPath = createPath(previousPoints, animationProgress);
  
  const lineColor = isActive ? '#B7FA7B' : '#3B82F6';
  const dashedColor = isActive ? 'rgba(183, 250, 123, 0.4)' : 'rgba(59, 130, 246, 0.4)';
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* Dashed previous line */}
      <path 
        d={previousPath} 
        fill="none" 
        stroke={dashedColor} 
        strokeWidth="1.5" 
        strokeDasharray="3 3"
      />
      {/* Solid current line */}
      <path 
        d={currentPath} 
        fill="none" 
        stroke={lineColor} 
        strokeWidth="2"
      />
    </svg>
  );
};

// Graph Components
const PickupRatesGraph = ({ data, filterType = 'days' }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const svgRef = useRef(null);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
        No data available
      </div>
    );
  }
  
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value), 100);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;
  
  const points = data.map((item, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((item.value - minValue) / valueRange) * graphHeight;
    return { x, y, ...item };
  });
  
  // Create smooth path using quadratic curves
  const createSmoothPath = (points) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cp1y = points[i].y;
      const cp2x = cp1x;
      const cp2y = points[i + 1].y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };
  
  const linePath = createSmoothPath(points);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;
  
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert mouse position to SVG viewBox coordinates
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;
    
    // Find closest point
    let closest = points[0];
    let minDist = Math.abs(points[0].x - svgX);
    points.forEach(point => {
      const dist = Math.abs(point.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    });
    
    setHoveredPoint(closest);
  };
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="pickupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#pickupGradient)" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2" />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint === point ? 5 : 3}
            fill="#3B82F6"
            style={{ transition: 'r 0.2s' }}
          />
        ))}
        
        {/* X-axis labels - show only every few hours for hours view */}
        {points.map((point, i) => {
          // For hours: show 12am, 4am, 8am, 12pm, 4pm, 8pm
          // For days: show all
          const shouldShow = filterType === 'days' 
            ? true 
            : (point.label === '12am' || point.label === '4am' || point.label === '8am' || 
               point.label === '12pm' || point.label === '4pm' || point.label === '8pm');
          
          if (!shouldShow) return null;
          
          return (
          <text
            key={i}
            x={point.x}
            y={height - padding.bottom + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#6B7280"
            fontFamily="Manrope, sans-serif"
          >
            {point.label}
          </text>
          );
        })}
        
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = padding.top + graphHeight - ((value - minValue) / valueRange) * graphHeight;
          return (
            <text
              key={value}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6B7280"
              fontFamily="Manrope, sans-serif"
            >
              {value}%
            </text>
          );
        })}
        
        {/* Hover line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={padding.top}
            x2={hoveredPoint.x}
            y2={padding.top + graphHeight}
            stroke="#9CA3AF"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            padding: '6px 10px',
            background: '#1f2937',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Manrope, sans-serif',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          {hoveredPoint.label}: {hoveredPoint.value.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

const DropoffRatesGraph = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const svgRef = useRef(null);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
        No data available
      </div>
    );
  }
  
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  
  const maxValue = 100;
  const minValue = 0;
  const valueRange = maxValue - minValue;
  
  const points = data.map((item, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((item.value - minValue) / valueRange) * graphHeight;
    return { x, y, ...item };
  });
  
  // Create smooth path
  const createSmoothPath = (points) => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cp1y = points[i].y;
      const cp2x = cp1x;
      const cp2y = points[i + 1].y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return path;
  };
  
  const linePath = createSmoothPath(points);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;
  
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert mouse position to SVG viewBox coordinates
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;
    
    let closest = points[0];
    let minDist = Math.abs(points[0].x - svgX);
    points.forEach(point => {
      const dist = Math.abs(point.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    });
    
    setHoveredPoint(closest);
  };
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="dropoffGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#dropoffGradient)" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="#FB923C" strokeWidth="2" />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint === point ? 5 : 3}
            fill="#FB923C"
            style={{ transition: 'r 0.2s' }}
          />
        ))}
        
        {/* X-axis labels - show only every few hours */}
        {points.map((point, i) => {
          // Show 12am, 4am, 8am, 12pm, 4pm, 8pm, 10pm
          const shouldShow = point.label === '12am' || point.label === '4am' || point.label === '8am' || 
                            point.label === '12pm' || point.label === '4pm' || point.label === '8pm' || point.label === '10pm';
          
          if (!shouldShow) return null;
          
          return (
          <text
            key={i}
            x={point.x}
            y={height - padding.bottom + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#6B7280"
            fontFamily="Manrope, sans-serif"
          >
            {point.label}
          </text>
          );
        })}
        
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map(value => {
          const y = padding.top + graphHeight - ((value - minValue) / valueRange) * graphHeight;
          return (
            <text
              key={value}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6B7280"
              fontFamily="Manrope, sans-serif"
            >
              {value}%
            </text>
          );
        })}
        
        {/* Hover line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={padding.top}
            x2={hoveredPoint.x}
            y2={padding.top + graphHeight}
            stroke="#9CA3AF"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            padding: '6px 10px',
            background: '#1f2937',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Manrope, sans-serif',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          {hoveredPoint.label}: {hoveredPoint.value.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// Helper function to get today's date in IST (YYYY-MM-DD format)
const getTodayInIST = () => {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  // Create a date object representing current IST time
  const istNow = new Date(now.getTime() + istOffset);
  
  // Get date components - since istNow is UTC time representing IST, use UTC methods
  const year = istNow.getUTCFullYear();
  const month = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istNow.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const Dashboard2 = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shop = shopProp || searchParams.get('shop');
  
  // Function to trigger test call modal
  const handleTestCallClick = () => {
    // Find and click the floating test call button
    const floatingButton = document.querySelector('.floating-test-call-btn');
    if (floatingButton) {
      floatingButton.click();
    }
  };
  
  // Date filter state - default to today in IST
  const [fromDate, setFromDate] = useState(getTodayInIST());
  const [toDate, setToDate] = useState(getTodayInIST());
  
  // Additional filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('CREATED_AT');
  const [sortDirection, setSortDirection] = useState('desc');
  const [standardSortColumn, setStandardSortColumn] = useState('CREATED_AT');
  const [standardSortDirection, setStandardSortDirection] = useState('desc');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [hasBeenCalledFilter, setHasBeenCalledFilter] = useState('all'); // 'all', 'called', 'not_called'
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // 'all', 'cod', 'prepaid'
  const [priceMinFilter, setPriceMinFilter] = useState('');
  const [priceMaxFilter, setPriceMaxFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateTemplate, setDateTemplate] = useState('custom'); // 'today', 'yesterday', 'last7days', 'last30days', 'custom'
  const [callingStatusFilter, setCallingStatusFilter] = useState('all'); // 'all', 'called', 'not_called'
  
  // Order details modal state
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCalls, setOrderCalls] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // New RTO bucket data
  const [newRtoOrders, setNewRtoOrders] = useState([]);
  const [rtoStats, setRtoStats] = useState({}); // Original stats (always unfiltered)
  const [activeStatCard, setActiveStatCard] = useState(null); // Currently selected stat card reason
  const [selectedOrders, setSelectedOrders] = useState(new Set()); // Selected order IDs
  const [selectAll, setSelectAll] = useState(false);
  
  // Tagging state
  const [showTagModal, setShowTagModal] = useState(false);
  const [customTags, setCustomTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagging, setTagging] = useState(false);
  const [rtoTabEntered, setRtoTabEntered] = useState(false); // Track when RTO Bucket tab is entered for graph animation
  const [rtoOrdersPagination, setRtoOrdersPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
    limit: 100
  });
  
  // Sorting state for RTO Bucket table
  const [sortColumn, setSortColumn] = useState('order');
  const [rtoSortDirection, setRtoSortDirection] = useState('asc');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [hoveredReason, setHoveredReason] = useState(null);
  const [reasonTooltipPosition, setReasonTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Sticky header state
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [stickyHeaderLeft, setStickyHeaderLeft] = useState(0);
  const [stickyHeaderWidth, setStickyHeaderWidth] = useState('100%');
  const tableHeaderRef = useRef(null);
  const tableContainerRef = useRef(null);
  
  // Standard orders data - Shopify GraphQL style
  const [standardOrders, setStandardOrders] = useState([]);
  const [standardOrdersPagination, setStandardOrdersPagination] = useState({
    hasNextPage: false,
    endCursor: null,
    startCursor: null,
    hasPreviousPage: false,
    totalCount: 0 // Total count of filtered orders
  });
  const [paginationHistory, setPaginationHistory] = useState([]); // Array of cursors for previous pages
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Orders per page - default 25
  
  // Column widths state with localStorage persistence
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(`allOrdersColumnWidths_${shop || 'default'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading column widths:', e);
    }
    // Default widths
    return {
      checkbox: 40,
      order: 120,
      customer: 150,
      flags: 100,
      date: 140,
      total: 100,
      paymentStatus: 130,
      fulfillmentStatus: 140,
      items: 80,
      deliveryMethod: 150,
      tags: 150,
      callingStatus: 120
    };
  });
  
  // Resizing state
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [selectedStandardOrders, setSelectedStandardOrders] = useState(new Set()); // Selected standard order IDs
  const [selectAllStandard, setSelectAllStandard] = useState(false);
  const [orderCallStatus, setOrderCallStatus] = useState(new Map()); // Map of orderId -> hasCalls (boolean)
  
  // Clip creation state
  const [showCreateClipModal, setShowCreateClipModal] = useState(false);
  const [clipName, setClipName] = useState('');
  const [clipDescription, setClipDescription] = useState('');
  const [creatingClip, setCreatingClip] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all-orders');
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const createDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  
  // Integration source state
  const [integrationSource, setIntegrationSource] = useState('shopify'); // 'shopify' or 'ndr'
  const [showIntegrationDropdown, setShowIntegrationDropdown] = useState(false);
  const integrationDropdownRef = useRef(null);
  
  // Sticky bar state - always visible
  const stickyCreateDropdownRef = useRef(null);
  const stickyFilterDropdownRef = useRef(null);
  
  // Pickup Rates filter state
  const [pickupRatesFilter, setPickupRatesFilter] = useState('days');
  const [showPickupFilterDropdown, setShowPickupFilterDropdown] = useState(false);
  const pickupFilterRef = useRef(null);
  
  // Dashboard stats tab data (loaded from API)
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingDashboardStats, setLoadingDashboardStats] = useState(false);
  const defaultCardMetrics = {
    pendingOrders: 0,
    ndrCount: 0,
    codOrdersToday: 0,
    queuedCallsToday: 0,
    todaysOutcomes: { total: 0, outcomes: {} },
    todaysSuccessCriteria: 0,
    ndrConnected: false
  };
  const [cardMetrics, setCardMetrics] = useState(defaultCardMetrics);
  const [loadingCardMetrics, setLoadingCardMetrics] = useState(false);
  
  // Clippings data
  const [clippings, setClippings] = useState([]);
  const [loadingClippings, setLoadingClippings] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingRto, setLoadingRto] = useState(false);
  const [loadingStandard, setLoadingStandard] = useState(false);
  const [error, setError] = useState(null);
  const [isTestShop, setIsTestShop] = useState(false);
  const [fulfillmentStatus, setFulfillmentStatus] = useState({}); // Map of orderId -> fulfillment status
  
  const normalizeMetricValue = (value) => Number(value || 0);
  const pendingOrdersCount = normalizeMetricValue(cardMetrics.pendingOrders);
  const ndrCount = normalizeMetricValue(cardMetrics.ndrCount);
  const codOrdersCount = normalizeMetricValue(cardMetrics.codOrdersToday);
  const queuedCallsCount = normalizeMetricValue(cardMetrics.queuedCallsToday);

  const formatDisplayDate = (value) => {
    if (!value) return null;
    const dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const metricsDateLabel = (() => {
    if (fromDate && toDate) {
      if (fromDate === toDate) {
        return formatDisplayDate(fromDate);
      }
      const startLabel = formatDisplayDate(fromDate);
      const endLabel = formatDisplayDate(toDate);
      if (startLabel && endLabel) {
        return `${startLabel} - ${endLabel}`;
      }
      return startLabel || endLabel;
    }
    if (fromDate) return formatDisplayDate(fromDate);
    if (toDate) return formatDisplayDate(toDate);
    return formatDisplayDate(new Date());
  })();

   // Agents state
   const [agents, setAgents] = useState([]);
   const [loadingAgents, setLoadingAgents] = useState(false);
 
   // Auto Call Settings state - for inline display in Shopify Orders tab
   const [showAutoCallSettings, setShowAutoCallSettings] = useState(false);
   const [autoCallSettings, setAutoCallSettings] = useState({
     enabled: false,
     scriptId: null,
     allowedTimeStart: '09:00',
     allowedTimeEnd: '18:00',
     timezone: 'Asia/Kolkata',
     allowedDays: '0,1,2,3,4,5,6',
     maxRetries: 3,
     retryIntervalMinutes: 60,
     channels: 1,
     callConditions: [],
     notCallConditions: []
   });
   const [loadingAutoCallSettings, setLoadingAutoCallSettings] = useState(false);
   const [savingAutoCallSettings, setSavingAutoCallSettings] = useState(false);
 
   // Shopify Auto-Call Settings modal state (legacy)
   const [showShopifyAutoCallSettings, setShowShopifyAutoCallSettings] = useState(false);
   const [shopifyAutoCallSettings, setShopifyAutoCallSettings] = useState({
     enabled: false,
     scriptId: null,
     callConditions: [], // Array of statuses to call
     notCallConditions: [] // Array of statuses to NOT call
   });
   const [loadingShopifySettings, setLoadingShopifySettings] = useState(false);
   const [savingShopifySettings, setSavingShopifySettings] = useState(false);

  // RTO Stats for bar chart - will be populated from rtoStats

  // Load dashboard stats tab data
  const loadDashboardStats = async () => {
    if (!shop) return;
    
    setLoadingDashboardStats(true);
    try {
      const response = await fetch(`/api/dashboard-stats-tab?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setDashboardStats(data.data);
        console.log('[Dashboard2] Dashboard stats loaded:', data.data);
      } else {
        console.error('[Dashboard2] Failed to load dashboard stats:', data.error);
        setDashboardStats(null);
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading dashboard stats:', err);
      setDashboardStats(null);
    } finally {
      setLoadingDashboardStats(false);
    }
  };

  const loadDashboardCardMetrics = async () => {
    if (!shop) return;

    setLoadingCardMetrics(true);
    try {
      const params = new URLSearchParams({ shop });
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await fetch(`/api/dashboard-card-metrics?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();

      console.log('[Dashboard2] Dashboard card metrics response:', data);

      if (data.success && data.data) {
        console.log('[Dashboard2] Setting card metrics:', data.data);
        setCardMetrics(data.data);
      } else {
        console.warn('[Dashboard2] Failed to load card metrics, using defaults. Response:', data);
        setCardMetrics(defaultCardMetrics);
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading dashboard card metrics:', err);
      setCardMetrics(defaultCardMetrics);
    } finally {
      setLoadingCardMetrics(false);
    }
  };

  // Load clippings
  const loadClippings = async () => {
    if (!shop) return;
    
    setLoadingClippings(true);
    try {
      const response = await fetch(`/api/clips?shop=${encodeURIComponent(shop)}&limit=10`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.clips)) {
        setClippings(data.clips);
        console.log('[Dashboard2] Clippings loaded:', data.clips.length);
      } else {
        console.error('[Dashboard2] Failed to load clippings:', data.error);
        setClippings([]);
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading clippings:', err);
      setClippings([]);
    } finally {
      setLoadingClippings(false);
    }
  };

  // Load stats separately (always unfiltered)
  const loadRtoStats = async () => {
    if (!shop) return;
    
    try {
      const params = new URLSearchParams({ shop });
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      // Don't include reason filter for stats - we want all stats
      
      const response = await fetch(`/api/new-rto-bucket-orders?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setRtoStats(data.stats || {});
        console.log('[Dashboard2] RTO stats loaded:', data.stats);
      } else {
        console.error('[Dashboard2] Failed to load RTO stats:', data.error);
        setRtoStats({});
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading RTO stats:', err);
      setRtoStats({});
    }
  };

  // Load new RTO bucket orders (with optional reason filter)
  const loadNewRtoBucketOrders = async (page = 1) => {
    if (!shop) return;
    
    setLoadingRto(true);
    try {
      const params = new URLSearchParams({ 
        shop,
        page: page.toString(),
        limit: '100' // Limit initial load for better performance
      });
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (activeStatCard) params.append('reason', activeStatCard);
      // Add integration source filter
      if (integrationSource === 'ndr') {
        params.append('isNdr', 'true');
      }
      
      const response = await fetch(`/api/new-rto-bucket-orders?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setNewRtoOrders(data.orders || []);
        setRtoOrdersPagination(data.pagination || {
          totalCount: data.totalCount || 0,
          totalPages: Math.ceil((data.totalCount || 0) / 100),
          currentPage: page,
          hasNext: false,
          hasPrev: false,
          limit: 100
        });
        // Don't update stats here - stats are loaded separately and always unfiltered
        console.log('[Dashboard2] New RTO bucket orders loaded:', {
          count: data.orders?.length || 0,
          totalCount: data.totalCount,
          filteredBy: activeStatCard || 'none',
          page: data.pagination?.currentPage || page
        });
      } else {
        console.error('[Dashboard2] Failed to load new RTO bucket orders:', data.error);
        setNewRtoOrders([]);
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading new RTO bucket orders:', err);
      setNewRtoOrders([]);
    } finally {
      setLoadingRto(false);
    }
  };

  // Load agents
  const loadAgents = async () => {
    if (!shop) return;
    
    setLoadingAgents(true);
    try {
      const data = await api.getScripts(shop);
      // API returns { scripts: [...] } directly
      if (data && Array.isArray(data.scripts)) {
        setAgents(data.scripts);
      } else if (Array.isArray(data)) {
        // Fallback: if API returns array directly
        setAgents(data);
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading agents:', err);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };
 
    // Load Shopify Auto-Call Settings (legacy modal) - loads into shopifyAutoCallSettings
    const loadShopifyAutoCallSettings = async () => {
      if (!shop) return;
      
      setLoadingShopifySettings(true);
      try {
        const response = await fetch(`/api/shopify-auto-call-settings?shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.settings) {
          setShopifyAutoCallSettings({
            enabled: data.settings.enabled || false,
            scriptId: data.settings.scriptId || null,
            callConditions: data.settings.callConditions || [],
            notCallConditions: data.settings.notCallConditions || []
          });
        }
      } catch (err) {
        console.error('Error loading Shopify auto-call settings:', err);
      } finally {
        setLoadingShopifySettings(false);
      }
    };
  
    // Load auto call settings from backend (for inline display)
    const loadAutoCallSettingsFromBackend = async () => {
      if (!shop) return;
      
      setLoadingAutoCallSettings(true);
      try {
        const response = await fetch(`/api/shopify-auto-call-settings?shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.settings) {
          setAutoCallSettings({
            enabled: data.settings.enabled || false,
            scriptId: data.settings.scriptId || null,
            allowedTimeStart: data.settings.allowedTimeStart || '09:00',
            allowedTimeEnd: data.settings.allowedTimeEnd || '18:00',
            timezone: data.settings.timezone || 'Asia/Kolkata',
            allowedDays: data.settings.allowedDays || '0,1,2,3,4,5,6',
            maxRetries: data.settings.maxRetries || 3,
            retryIntervalMinutes: data.settings.retryIntervalMinutes || 60,
            channels: data.settings.channels || 1,
            callConditions: data.settings.callConditions || [],
            notCallConditions: data.settings.notCallConditions || []
          });
        }
      } catch (err) {
        console.error('Error loading auto call settings:', err);
      } finally {
        setLoadingAutoCallSettings(false);
      }
    };
  
    // Save Shopify Auto-Call Settings (legacy modal)
   const saveShopifyAutoCallSettings = async () => {
     if (!shop) return;
     
     setSavingShopifySettings(true);
     try {
       const response = await fetch(`/api/shopify-auto-call-settings?shop=${encodeURIComponent(shop)}`, {
         method: 'POST',
         credentials: 'include',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           shop,
           settings: shopifyAutoCallSettings
         })
       });
       const data = await response.json();
       if (data.success) {
         alert('Shopify auto-call settings saved successfully');
         setShowShopifyAutoCallSettings(false);
       } else {
         alert('Failed to save settings: ' + (data.error || 'Unknown error'));
       }
     } catch (error) {
       console.error('Error saving Shopify auto-call settings:', error);
       alert('Error saving settings: ' + error.message);
     } finally {
       setSavingShopifySettings(false);
     }
   };

   // Save inline auto call settings
   const handleSaveAutoCallSettings = async () => {
     if (!shop) return;
     
     setSavingAutoCallSettings(true);
     try {
       const response = await fetch(`/api/update-shop-auto-call-settings?shop=${encodeURIComponent(shop)}`, {
         method: 'POST',
         credentials: 'include',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(autoCallSettings)
       });
       const data = await response.json();
       if (data.success) {
         alert('Auto call settings saved successfully');
       } else {
         alert('Failed to save settings: ' + (data.error || 'Unknown error'));
       }
     } catch (error) {
       console.error('Error saving auto call settings:', error);
       alert('Error saving settings: ' + error.message);
     } finally {
       setSavingAutoCallSettings(false);
     }
   };

  // Handle showing order details modal
  const handleShowOrderDetails = async (order) => {
    setLoadingOrderDetails(true);
    setShowOrderDetails(true);
    
    try {
      // Extract order number from Shopify order (order.name is like "#1001")
      const orderNumber = order.name || order.orderNumber;
      // Also try to extract numeric ID from GraphQL ID if needed
      const shopifyOrderId = order.id;
      
      let response;
      let data;
      
      // Try with orderNumber first (more reliable)
      if (orderNumber) {
        try {
          response = await fetch(`/api/order-details?orderNumber=${encodeURIComponent(orderNumber.replace(/^#/, ''))}&shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          if (response.ok) {
            data = await response.json();
            if (data.success) {
              setSelectedOrder(data.order);
              setOrderCalls(data.calls || []);
              return;
            }
          }
        } catch (e) {
          console.log('[AllOrders] OrderNumber lookup failed, trying orderId:', e);
        }
      }
      
      // Fallback: Try with orderId (extract numeric part from GraphQL ID if needed)
      let orderIdToUse = shopifyOrderId;
      if (shopifyOrderId) {
        const orderIdStr = String(shopifyOrderId);
        if (orderIdStr.includes('/')) {
          // Extract numeric ID from GraphQL format: gid://shopify/Order/7324036432163
          const match = orderIdStr.match(/\/(\d+)$/);
          if (match) {
            orderIdToUse = match[1];
          }
        } else {
          orderIdToUse = orderIdStr;
        }
      }
      
      if (orderIdToUse) {
        response = await fetch(`/api/order-details?orderId=${encodeURIComponent(orderIdToUse)}&shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = await response.json();
        
        if (data.success) {
          setSelectedOrder(data.order);
          setOrderCalls(data.calls || []);
        } else {
          throw new Error(data.error || 'Failed to load order details');
        }
      } else {
        throw new Error('No order ID or order number available');
      }
    } catch (error) {
      console.error('[AllOrders] Error loading order details:', error);
      alert('Error loading order details: ' + (error.message || 'Unknown error'));
      setShowOrderDetails(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const formatISTDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'N/A';
    }
  };

  // Load standard orders - Shopify GraphQL style with cursor pagination
  const loadStandardOrders = async (after = null, direction = 'next') => {
    if (!shop) return;
    
    setLoadingStandard(true);
    try {
      const params = new URLSearchParams({ 
        shop,
        first: pageSize.toString() // Use selected page size
      });
      
      if (after) {
        params.append('after', after);
      }
      
      // Add filter parameters
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (searchFilter) params.append('search', searchFilter);
      if (callStatusFilter !== 'all') params.append('callStatus', callStatusFilter);
      if (orderStatusFilter !== 'all') params.append('orderStatus', orderStatusFilter);
      if (fulfillmentStatusFilter !== 'all') params.append('fulfillmentStatus', fulfillmentStatusFilter);
      if (callingStatusFilter !== 'all') params.append('hasBeenCalled', callingStatusFilter === 'called' ? 'true' : 'false');
      if (tagFilter) params.append('tags', tagFilter);
      if (paymentTypeFilter !== 'all') params.append('paymentType', paymentTypeFilter);
      // Use standard sort for Shopify orders
      if (standardSortColumn) params.append('sortKey', standardSortColumn);
      if (standardSortDirection) params.append('reverse', standardSortDirection === 'desc' ? 'true' : 'false');
      
      const response = await fetch(`/api/shopify-orders?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const newOrders = data.orders || [];
        setStandardOrders(newOrders);
        
        // Fetch call status for all orders in bulk (optimized)
        const callStatusMap = new Map();
        // Initialize all as false first
        newOrders.forEach(order => {
          callStatusMap.set(order.id, false);
        });
        setOrderCallStatus(callStatusMap);
        
        // Extract order numbers and orderIds for bulk query
        const orderNumbers = newOrders.map(order => order.name || '').filter(Boolean);
        const orderIds = newOrders.map(order => order.id || '').filter(Boolean);
        
        console.log('[AllOrders] Fetching call status for orders:', {
          orderNumbers: orderNumbers.slice(0, 5),
          orderIds: orderIds.slice(0, 5),
          total: orderNumbers.length
        });
        
        if (orderNumbers.length > 0 || orderIds.length > 0) {
          console.log('[AllOrders] 🚀 About to call /api/orders-call-status with:', {
            orderNumbersCount: orderNumbers.length,
            orderIdsCount: orderIds.length,
            sampleOrderNumbers: orderNumbers.slice(0, 3),
            sampleOrderIds: orderIds.slice(0, 3)
          });
          
          // Fetch call status for all orders in a single bulk request
          // Include shop in query string for requireShopAuth middleware
          const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
          fetch(`/api/orders-call-status${shopParam}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumbers, orderIds, shop }),
            credentials: 'include'
          })
            .then(response => {
              console.log('[AllOrders] ✅ API Response received. Status:', response.status, response.statusText);
              if (!response.ok) {
                return response.text().then(text => {
                  console.error('[AllOrders] ❌ API Error response:', text);
                  throw new Error(`API error: ${response.status} ${text}`);
                });
              }
              return response.json();
            })
            .catch(error => {
              console.error('[AllOrders] ❌ Fetch error (network/parsing):', error);
              throw error;
            })
            .then(data => {
              console.log('[AllOrders] 📦 API Response received:', {
                success: data.success,
                error: data.error,
                callStatusKeys: data.callStatus ? Object.keys(data.callStatus).slice(0, 20) : [],
                callStatusSample: data.callStatus ? Object.entries(data.callStatus).slice(0, 10).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}) : {}
              });
              
              // Check specifically for NK/27046 in the response
              if (data.callStatus) {
                const nk27046Keys = Object.keys(data.callStatus).filter(k => 
                  k.includes('27046') || k.includes('NK/27046') || k.includes('7323861877027')
                );
                console.log('[AllOrders] 🔍 NK/27046 keys in API response:', nk27046Keys);
                console.log('[AllOrders] 🔍 NK/27046 values in API response:', 
                  nk27046Keys.reduce((acc, k) => ({ ...acc, [k]: data.callStatus[k] }), {})
                );
              }
              
              if (data.success && data.callStatus) {
                // Update call status map based on bulk response
                newOrders.forEach(order => {
                  const orderName = order.name || '';
                  const orderId = order.id || '';
                  
                  // Build all possible keys to check
                  const keysToCheck = [];
                  
                  // Add orderId variations
                  if (orderId) {
                    keysToCheck.push(orderId); // Full GraphQL ID
                    if (orderId.includes('/')) {
                      const match = orderId.match(/\/(\d+)$/);
                      if (match) {
                        keysToCheck.push(match[1]); // Numeric part
                      }
                    }
                  }
                  
                  // Add orderName variations
                  if (orderName) {
                    keysToCheck.push(orderName); // Exact: "NK/27046"
                    const cleanOrderName = orderName.replace(/^#/, '');
                    if (cleanOrderName !== orderName) {
                      keysToCheck.push(cleanOrderName);
                    }
                    keysToCheck.push(`#${cleanOrderName}`);
                    
                    // Extract number part
                    const numberMatch = orderName.match(/(\d+)$/);
                    if (numberMatch) {
                      keysToCheck.push(numberMatch[1]); // "27046"
                      keysToCheck.push(`#${numberMatch[1]}`); // "#27046"
                    }
                  }
                  
                  // Try all keys until we find a match
                  let hasCalls = false;
                  let matchedBy = null;
                  
                  for (const key of keysToCheck) {
                    if (data.callStatus[key] !== undefined) {
                      hasCalls = data.callStatus[key];
                      matchedBy = key;
                      break; // Found a match, stop checking
                    }
                  }
                  
                  callStatusMap.set(order.id, hasCalls);
                  
                  // Debug logging
                  if (orderName === 'NK/27046' || orderName.includes('27046')) {
                    console.log(`[AllOrders] 🔍 NK/27046 DEBUG:`, {
                      orderName,
                      orderId,
                      keysToCheck,
                      matchedBy,
                      hasCalls,
                      allKeys: Object.keys(data.callStatus),
                      relevantKeys: Object.keys(data.callStatus).filter(k => 
                        keysToCheck.includes(k) || k.includes('27046') || k.includes(orderId)
                      ),
                      relevantValues: Object.entries(data.callStatus)
                        .filter(([k, v]) => keysToCheck.includes(k) || k.includes('27046') || k.includes(orderId))
                        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
                    });
                  }
                  
                  if (hasCalls) {
                    console.log(`[AllOrders] ✅ Order "${orderName}" (${orderId}) HAS CALLS - Matched by: ${matchedBy}`);
                  } else {
                    console.log(`[AllOrders] ❌ Order "${orderName}" (${orderId}) - NO CALLS. Checked keys:`, keysToCheck);
                  }
                });
                
                // Create new Map to trigger React re-render
                const updatedMap = new Map(callStatusMap);
                setOrderCallStatus(updatedMap);
                
                // Log all entries for NK/27046 specifically
                const nk27046Entries = Array.from(updatedMap.entries()).filter(([k, v]) => {
                  // Check if this key might be related to NK/27046
                  return k.includes('7323861877027') || k.includes('27046');
                });
                
                console.log('[AllOrders] Call status updated. Total entries:', updatedMap.size);
                console.log('[AllOrders] NK/27046 related entries:', nk27046Entries);
                console.log('[AllOrders] All Map entries (first 20):', 
                  Array.from(updatedMap.entries()).slice(0, 20).map(([k, v]) => `${k.substring(0, 50)}:${v}`)
                );
              } else {
                console.warn('[AllOrders] Call status response missing or invalid:', data);
              }
            })
            .catch(err => {
              console.error('[AllOrders] Error fetching bulk call status:', err);
              // Keep default false values
            });
        }
        
        // Update pagination history
        let newHistory = [...paginationHistory];
        let newPage = currentPage;
        
        if (direction === 'next' && after) {
          // Going forward - add the cursor we just used to history
          newHistory.push(after);
          newPage = currentPage + 1;
        } else if (direction === 'prev') {
          // Going back - remove last cursor from history (the one for current page)
          newHistory.pop();
          newPage = Math.max(1, currentPage - 1);
        } else if (direction === 'reset') {
          // Reset to first page
          newHistory = [];
          newPage = 1;
        }
        
        setPaginationHistory(newHistory);
        setCurrentPage(newPage);
        setStandardOrdersPagination({
          hasNextPage: data.pageInfo?.hasNextPage || false,
          endCursor: data.pageInfo?.endCursor || null,
          startCursor: data.pageInfo?.startCursor || null,
          hasPreviousPage: newHistory.length > 0,
          totalCount: data.totalCount || standardOrders.length || 0 // Use API totalCount if available, fallback to current orders length
        });
      } else {
        console.error('[Dashboard2] Failed to load Shopify orders:', data.error);
        setStandardOrders([]);
        setStandardOrdersPagination({
          hasNextPage: false,
          endCursor: null,
          startCursor: null,
          hasPreviousPage: false,
          totalCount: 0
        });
      }
    } catch (err) {
      console.error('[Dashboard2] Error loading Shopify orders:', err);
      setStandardOrders([]);
      setStandardOrdersPagination({
        hasNextPage: false,
        endCursor: null,
        startCursor: null,
        hasPreviousPage: false
      });
    } finally {
      setLoadingStandard(false);
    }
  };

  // Close create dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setShowCreateDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (pickupFilterRef.current && !pickupFilterRef.current.contains(event.target)) {
        setShowPickupFilterDropdown(false);
      }
      if (stickyCreateDropdownRef.current && !stickyCreateDropdownRef.current.contains(event.target)) {
        setShowCreateDropdown(false);
      }
      if (stickyFilterDropdownRef.current && !stickyFilterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    if (showCreateDropdown || showFilterDropdown || showPickupFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateDropdown, showFilterDropdown, showPickupFilterDropdown]);


  // Load all data
  useEffect(() => {
    if (!shop) {
      setError('No shop parameter found');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if test shop
        try {
          const balanceData = await api.getShopBalance(shop);
          if (balanceData.success && balanceData.data) {
            setIsTestShop(balanceData.data.isTestShop === true);
          }
        } catch (e) {
          console.error('Error checking shop:', e);
          setIsTestShop(false);
        }

        // Load initial data based on active tab
        // Only load dashboard stats if we're on the stats tab, otherwise skip them
        if (activeTab === 'stats') {
          // Load dashboard stats only when stats tab is active
          await Promise.all([
            loadDashboardStats(), // Load dashboard stats tab data
            loadDashboardCardMetrics(), // Load headline card metrics
            loadRtoStats(), // Load RTO stats (unfiltered) - critical for UI
            loadClippings() // Load clippings
          ]);
        }
        
        // Always load orders and agents (needed for all tabs)
        Promise.all([
          loadNewRtoBucketOrders(), // Load orders (may be filtered)
          loadStandardOrders(null, 'reset'),
          loadUserTags(),
          loadAgents() // Load agents
        ]).catch(err => console.error('Error loading data:', err));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shop]);

  // Load dashboard stats when switching to stats tab
  useEffect(() => {
    if (shop && activeTab === 'stats') {
      // Load dashboard stats when user switches to stats tab
      loadDashboardStats();
      loadDashboardCardMetrics();
      loadRtoStats();
      loadClippings();
    }
   }, [activeTab, shop]);
 
   // Load auto call settings when switching to all-orders tab
   useEffect(() => {
     if (shop && activeTab === 'all-orders') {
       loadAutoCallSettingsFromBackend();
     }
   }, [activeTab, shop]);
 
   // Reload when filters, page size, or integration source changes
  useEffect(() => {
    if (shop && activeTab === 'all-orders') {
      // Reload orders when filters or page size change
      loadStandardOrders(null, 'reset');
    }
  }, [fromDate, toDate, shop, integrationSource, searchFilter, callStatusFilter, orderStatusFilter, fulfillmentStatusFilter, callingStatusFilter, tagFilter, paymentTypeFilter, pageSize, sortBy, sortDirection]);
  
  // Reload dashboard stats when filters change (for stats tab)
  useEffect(() => {
    if (shop && activeTab === 'stats') {
      loadDashboardStats(); // Reload dashboard stats when date changes
      loadDashboardCardMetrics(); // Reload headline metrics when date changes
      loadRtoStats(); // Reload stats when date changes
      loadNewRtoBucketOrders(); // Reload orders
    }
  }, [fromDate, toDate, shop, integrationSource, searchFilter, callStatusFilter, orderStatusFilter, fulfillmentStatusFilter, sortBy, sortDirection]);

  // Handle column resizing
  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff); // Minimum width 50px
      
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        // Save to localStorage
        try {
          localStorage.setItem(`allOrdersColumnWidths_${shop || 'default'}`, JSON.stringify(updated));
        } catch (err) {
          console.error('Error saving column widths:', err);
        }
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth, shop]);

  // Helper function to create resizable header
  const createResizableHeader = (columnKey, content, sortable = false, sortColumn = null) => {
    const isSorting = sortable && standardSortColumn === sortColumn;
    return (
      <th
        key={columnKey}
        style={{
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '11px',
          cursor: sortable ? 'pointer' : 'default',
          userSelect: 'none',
          position: 'relative',
          width: columnWidths[columnKey] || 100,
          minWidth: 50,
          padding: '8px 10px',
          borderRight: '1px solid #F3F4F6'
        }}
        onClick={sortable ? () => {
          if (standardSortColumn === sortColumn) {
            setStandardSortDirection(standardSortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setStandardSortColumn(sortColumn);
            setStandardSortDirection('asc');
          }
          loadStandardOrders(null, 'reset');
        } : undefined}
        onMouseEnter={sortable ? (e) => e.currentTarget.style.background = '#F9FAFB' : undefined}
        onMouseLeave={sortable ? (e) => e.currentTarget.style.background = 'transparent' : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{content} {isSorting && (standardSortDirection === 'asc' ? '↑' : '↓')}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: resizingColumn === columnKey ? '#5167D3' : 'transparent',
            zIndex: 10
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setResizingColumn(columnKey);
            setResizeStartX(e.clientX);
            setResizeStartWidth(columnWidths[columnKey] || 100);
          }}
          onMouseEnter={(e) => {
            if (resizingColumn !== columnKey) {
              e.currentTarget.style.backgroundColor = '#D1D5DB';
            }
          }}
          onMouseLeave={(e) => {
            if (resizingColumn !== columnKey) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />
      </th>
    );
  };
  
  // Close integration dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (integrationDropdownRef.current && !integrationDropdownRef.current.contains(event.target)) {
        setShowIntegrationDropdown(false);
      }
    };
    
    if (showIntegrationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIntegrationDropdown]);

  // Reload RTO orders when stat card changes
  useEffect(() => {
    if (shop) {
      loadNewRtoBucketOrders();
    }
  }, [activeStatCard, shop]);

  // Handle stat card click
  const handleStatCardClick = (reason) => {
    if (activeStatCard === reason) {
      // Deselect if clicking the same card
      setActiveStatCard(null);
    } else {
      setActiveStatCard(reason);
    }
  };

  // Handle order selection
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      // Deselect all visible orders
      const visibleOrderIds = new Set(newRtoOrders.map(o => o.orderId || o.id));
      setSelectedOrders(prev => {
        const newSet = new Set(prev);
        visibleOrderIds.forEach(id => newSet.delete(id));
        return newSet;
      });
      setSelectAll(false);
    } else {
      // Select all visible orders
      const visibleOrderIds = newRtoOrders.map(o => o.orderId || o.id);
      setSelectedOrders(prev => {
        const newSet = new Set(prev);
        visibleOrderIds.forEach(id => newSet.add(id));
        return newSet;
      });
      setSelectAll(true);
    }
  };

  // Update selectAll state when orders or selection changes
  useEffect(() => {
    if (newRtoOrders.length === 0) {
      setSelectAll(false);
      return;
    }
    const visibleOrderIds = new Set(newRtoOrders.map(o => o.orderId || o.id));
    const allSelected = Array.from(visibleOrderIds).every(id => selectedOrders.has(id));
    setSelectAll(allSelected && visibleOrderIds.size > 0);
  }, [newRtoOrders, selectedOrders]);

  // Handle standard order selection
  const toggleStandardOrderSelection = (orderId) => {
    setSelectedStandardOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Handle select all standard orders
  const toggleSelectAllStandard = () => {
    if (selectAllStandard) {
      const visibleOrderIds = new Set(standardOrders.map(o => o.orderId || o.id));
      setSelectedStandardOrders(prev => {
        const newSet = new Set(prev);
        visibleOrderIds.forEach(id => newSet.delete(id));
        return newSet;
      });
      setSelectAllStandard(false);
    } else {
      const visibleOrderIds = standardOrders.map(o => o.orderId || o.id);
      setSelectedStandardOrders(prev => {
        const newSet = new Set(prev);
        visibleOrderIds.forEach(id => newSet.add(id));
        return newSet;
      });
      setSelectAllStandard(true);
    }
  };

  // Update selectAllStandard state when orders or selection changes
  useEffect(() => {
    if (standardOrders.length === 0) {
      setSelectAllStandard(false);
      return;
    }
    const visibleOrderIds = new Set(standardOrders.map(o => o.orderId || o.id));
    const allSelected = Array.from(visibleOrderIds).every(id => selectedStandardOrders.has(id));
    setSelectAllStandard(allSelected && visibleOrderIds.size > 0);
  }, [standardOrders, selectedStandardOrders]);

  // Handle create clip
  const handleCreateClip = async () => {
    const allSelectedOrderIds = [
      ...Array.from(selectedOrders),
      ...Array.from(selectedStandardOrders)
    ];

    if (allSelectedOrderIds.length === 0) {
      alert('Please select at least one order');
      return;
    }

    if (!clipName || clipName.trim() === '') {
      alert('Please enter a clip name');
      return;
    }

    if (!shop) {
      alert('Shop information is missing');
      return;
    }

    setCreatingClip(true);
    try {
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: clipName.trim(),
          description: clipDescription.trim() || null,
          orderIds: allSelectedOrderIds,
          shop
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Clip "${clipName.trim()}" created successfully with ${allSelectedOrderIds.length} orders!`);
        console.log('[Dashboard2] Clip created:', data.clip);
        
        // Reset form and close modal
        setClipName('');
        setClipDescription('');
        setShowCreateClipModal(false);
        setSelectedOrders(new Set());
        setSelectedStandardOrders(new Set());
        setSelectAll(false);
        setSelectAllStandard(false);
      } else {
        alert('❌ Failed to create clip: ' + (data.error || 'Unknown error'));
        console.error('[Dashboard2] Failed to create clip:', data.error);
      }
    } catch (error) {
      console.error('[Dashboard2] Error creating clip:', error);
      alert('❌ Error creating clip: ' + error.message);
    } finally {
      setCreatingClip(false);
    }
  };

  // Load user tags
  const loadUserTags = async () => {
    try {
      const response = await fetch('/api/user-tags', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.tags) {
        setCustomTags(data.tags);
      }
    } catch (error) {
      console.error('Error loading user tags:', error);
    }
  };

  // Handle tag orders (opens modal)
  const handleBulkTag = () => {
    if (selectedOrders.size === 0 && selectedStandardOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }
    setShowTagModal(true);
  };

  // Tag orders with selected tag
  const handleTagOrders = async (tag) => {
    if (!tag || !tag.trim()) {
      alert('Please enter or select a tag');
      return;
    }

    if (!shop) {
      alert('Shop information is missing');
      return;
    }

    try {
      setTagging(true);
      
      // Get selected order IDs (from both RTO and standard orders)
      const allSelectedIds = [
        ...Array.from(selectedOrders),
        ...Array.from(selectedStandardOrders)
      ];

      if (allSelectedIds.length === 0) {
        alert('Please select at least one order');
        return;
      }

      // Get orders from current data to find Shopify order IDs
      const allOrders = [...newRtoOrders, ...standardOrders];
      const orderRecords = allOrders.filter(o => allSelectedIds.includes(o.orderId || o.id));
      const shopifyOrderIds = orderRecords.map(o => {
        const orderId = o.orderId;
        if (orderId && orderId.startsWith('gid://shopify/Order/')) {
          return orderId;
        }
        return `gid://shopify/Order/${orderId}`;
      });

      const response = await fetch('/api/tag-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderIds: shopifyOrderIds, 
          tag: tag.trim(), 
          shop 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        const successCount = data.results.filter(r => r.success).length;
        const failCount = data.results.filter(r => !r.success).length;
        alert(`✅ Tagging completed!\n\n📊 Results:\n• Successfully tagged: ${successCount}\n• Failed: ${failCount}`);
        
        // Save tag to user's custom tags if it's new
        if (!customTags.includes(tag.trim())) {
          try {
            await fetch('/api/user-tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag: tag.trim() }),
              credentials: 'include'
            });
            setCustomTags([...customTags, tag.trim()]);
          } catch (err) {
            console.error('Error saving tag:', err);
          }
        }
        
        setShowTagModal(false);
        setSelectedTag('');
        setNewTagInput('');
        setSelectedOrders(new Set());
        setSelectedStandardOrders(new Set());
      } else {
        alert(`❌ Tagging failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error tagging orders:', error);
      alert('Error tagging orders');
    } finally {
      setTagging(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      // Get time in 12-hour format (lowercase, no space before am/pm)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      const timeStr = `${displayHours}:${displayMinutes}${ampm}`;
      
      // Check if today
      if (dateOnly.getTime() === today.getTime()) {
        return `today at ${timeStr}`;
      }
      
      // Check if yesterday
      if (dateOnly.getTime() === yesterday.getTime()) {
        return `yesterday at ${timeStr}`;
      }
      
      // For older dates, show "7 Dec 25" format (no time)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear().toString().slice(-2);
      
      return `${day} ${monthName} ${year}`;
    } catch (e) {
      return dateString.toString().slice(0, 19).replace('T', ' ');
    }
  };

  // Get reason display name
  const getReasonDisplayName = (reason) => {
    const reasonMap = {
      'bad_address': 'Bad Address',
      'impulsive': 'Impulsive Orders',
      'high_intent': 'High Intent',
      'sussy': 'Sussy',
      'spam': 'Spam',
      'unknown': 'Unknown'
    };
    return reasonMap[reason] || reason || 'Unknown';
  };

  // Clean Status Badge Component with consistent colors
  const StatusBadge = ({ status, type = 'default' }) => {
    const statusConfig = {
      // Payment Status
      'paid': { label: 'Paid', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      'prepaid': { label: 'Prepaid', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      'pending': { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
      'pending_payment': { label: 'Pending Payment', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
      'cod': { label: 'COD', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
      'refunded': { label: 'Refunded', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' },
      
      // Fulfillment Status
      'fulfilled': { label: 'Fulfilled', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      'unfulfilled': { label: 'Unfulfilled', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
      'partial': { label: 'Partial', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
      
      // Call Status
      'called': { label: 'Called', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      "didn't_called": { label: "Didn't Called", color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
      "didn't called": { label: "Didn't Called", color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
      'not_called': { label: 'Not Called', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' },
      'queued': { label: 'Queued', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      'in_progress': { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' },
      'completed': { label: 'Completed', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      'failed': { label: 'Failed', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
    };

    const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '_');
    const config = statusConfig[normalizedStatus] || { 
      label: status || 'N/A', 
      color: '#6B7280', 
      bg: '#F3F4F6', 
      border: '#E5E7EB' 
    };
    
    return (
      <span style={{
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
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        transition: 'all 0.15s ease'
      }}>
        {config.label}
      </span>
    );
  };

  // Helper function to get payment badge
  const getPaymentBadge = (paymentMethod) => {
    const isPrepaid = (paymentMethod || '').toLowerCase().includes('prepaid') || 
                      (paymentMethod || '').toLowerCase().includes('paid');
    return <StatusBadge status={isPrepaid ? 'prepaid' : 'cod'} type="payment" />;
  };

  // Helper function to get fulfillment badge
  const getFulfillmentBadge = (fulfillmentStatus) => {
    const status = (fulfillmentStatus || 'unfulfilled').toLowerCase();
    return <StatusBadge status={status} type="fulfillment" />;
  };

  // Helper function to get reason badge with icon
  const getReasonBadge = (reason, orderId = null) => {
    const reasonConfig = {
      'bad_address': { 
        name: 'Bad Address', 
        bgColor: '#D5EBFF',
        textColor: '#003A5A',
        iconPath: '/images/badaddress.svg',
        meaning: 'meaning that the addresses kharab hai',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'impulsive': { 
        name: 'Impulsive Orders', 
        bgColor: '#D5EBFF',
        textColor: '#003A5A',
        iconPath: '/images/impulsive.svg',
        meaning: 'meaning that the orders are impulsive',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'high_intent': { 
        name: 'High Intent', 
        bgColor: '#D1FAE5',
        textColor: '#003A5A',
        iconPath: '/images/intent.svg',
        meaning: 'meaning that the customer has high intent',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'sussy': { 
        name: 'Sussy', 
        bgColor: '#D5EBFF',
        textColor: '#003A5A',
        iconPath: '/images/sussy.svg',
        meaning: 'meaning that the orders are suspicious',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'spam': { 
        name: 'Spam', 
        bgColor: '#FEE2E2',
        textColor: '#003A5A',
        iconPath: '/images/spam.svg',
        meaning: 'meaning that the orders are spam',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      }
    };

    const config = reasonConfig[reason] || { 
      name: 'Unknown', 
      bgColor: '#F9FAFB',
      textColor: '#1f2937',
      iconPath: '/images/badaddress.svg',
      meaning: '',
      reasons: []
    };

    const handleMouseEnter = (e) => {
      if (!reason || !orderId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredReason({ reason, orderId });
      setReasonTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    };

    const handleMouseLeave = () => {
      setHoveredReason(null);
    };

    return (
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: config.bgColor,
          border: 'none',
          borderRadius: '8px',
          paddingTop: '3px',
          paddingBottom: '3px',
          paddingLeft: '6px',
          paddingRight: '6px',
          fontSize: '11px',
          fontFamily: 'Manrope, sans-serif',
          position: 'relative',
          cursor: 'pointer'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={config.iconPath} 
          alt={config.name}
          style={{ 
            width: '12px', 
            height: '12px', 
            flexShrink: 0,
            display: 'block'
          }} 
        />
        <span style={{ color: config.textColor, fontWeight: 600, fontSize: '12px' }}>{config.name}</span>
      </span>
    );
  };

  // Helper function to get reason tooltip content
  const getReasonTooltipContent = (reason) => {
    const reasonConfig = {
      'bad_address': { 
        name: 'Bad Address', 
        meaning: 'meaning that the addresses kharab hai',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'impulsive': { 
        name: 'Impulsive Orders', 
        meaning: 'meaning that the orders are impulsive',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'high_intent': { 
        name: 'High Intent', 
        meaning: 'meaning that the customer has high intent',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'sussy': { 
        name: 'Sussy', 
        meaning: 'meaning that the orders are suspicious',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      },
      'spam': { 
        name: 'Spam', 
        meaning: 'meaning that the orders are spam',
        reasons: [
          { icon: '/images/eye.svg', text: '<10 line address' },
          { icon: '/images/Scan_alt.svg', text: 'Unusual Words' },
          { icon: '/images/Flag_alt.svg', text: 'Missing Fields' }
        ]
      }
    };

    return reasonConfig[reason] || { name: 'Unknown', meaning: '', reasons: [] };
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenu && !event.target.closest('.action-menu-dropdown') && !event.target.closest('button.btn-icon')) {
        setOpenActionMenu(null);
      }
    };

    if (openActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu]);

  // Get filtered RTO orders (by active stat card)
  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setRtoSortDirection(rtoSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setRtoSortDirection('asc');
    }
  };

  // Sort orders
  const sortedRtoOrders = [...(activeStatCard
    ? newRtoOrders.filter(order => order.newRtoBucketReason === activeStatCard)
    : newRtoOrders)].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortColumn) {
      case 'order':
        aVal = (a.orderNumber || a.orderId || a.id || '').toString();
        bVal = (b.orderNumber || b.orderId || b.id || '').toString();
        break;
      case 'date':
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
        break;
      case 'customer':
        aVal = (a.customerName || '').toString().toLowerCase();
        bVal = (b.customerName || '').toString().toLowerCase();
        break;
      case 'phone':
        aVal = (a.customerPhone || '').toString();
        bVal = (b.customerPhone || '').toString();
        break;
      case 'address':
        aVal = (a.customerAddress || '').toString().toLowerCase();
        bVal = (b.customerAddress || '').toString().toLowerCase();
        break;
      case 'payment':
        aVal = (a.paymentMethod || a.paymentStatus || 'COD').toString().toLowerCase();
        bVal = (b.paymentMethod || b.paymentStatus || 'COD').toString().toLowerCase();
        break;
      case 'fulfillment':
        aVal = (a.fulfillmentStatus || 'unfulfilled').toString().toLowerCase();
        bVal = (b.fulfillmentStatus || 'unfulfilled').toString().toLowerCase();
        break;
      case 'reason':
        aVal = (a.newRtoBucketReason || '').toString().toLowerCase();
        bVal = (b.newRtoBucketReason || '').toString().toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return rtoSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return rtoSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredRtoOrders = sortedRtoOrders;

  // Track when RTO Bucket tab is entered for graph animation
  useEffect(() => {
    if (activeTab === 'rto-bucket') {
      setRtoTabEntered(true);
      // Reset animation after a delay so it can animate again if user switches tabs
      const timer = setTimeout(() => {
        setRtoTabEntered(false);
      }, 1500); // Reset after animation completes
      return () => clearTimeout(timer);
    } else {
      setRtoTabEntered(false);
    }
  }, [activeTab]);

  // Intersection Observer for sticky header detection
  useEffect(() => {
    if (activeTab !== 'rto-bucket') {
      setShowStickyHeader(false);
      return;
    }

    const headerElement = tableHeaderRef.current;
    const containerElement = tableContainerRef.current;

    if (!headerElement || !containerElement) {
      setShowStickyHeader(false);
      return;
    }

    // Calculate tabs bar bottom position
    const tabsBarBottom = 160; // TopBar (100px) + tabs bar (60px)

    // Get table container's position and width for exact matching
    const updateStickyHeaderPosition = () => {
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const sidebarWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')) || 250;
        // Calculate left offset from sidebar
        setStickyHeaderLeft(containerRect.left - sidebarWidth);
        // Set width to match table container exactly
        setStickyHeaderWidth(`${containerRect.width}px`);
      }
    };

    // Unified scroll handler that checks both header and container positions
    const handleScroll = () => {
      if (!headerElement || !containerElement) return;

      const headerRect = headerElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      // Check if we're above the table (container top is below tabs bar)
      const isAboveTable = containerRect.top > tabsBarBottom;
      
      // Check if original header is visible (header top is below tabs bar)
      const isHeaderVisible = headerRect.top > tabsBarBottom;
      
      // Check if header is scrolled past (header top is at or above tabs bar)
      const isScrolledPast = headerRect.top <= tabsBarBottom;
      
      // Show sticky header ONLY when:
      // 1. We're not above the table (container is at or past tabs bar)
      // 2. Original header is scrolled past tabs bar
      // 3. Original header is not visible (above viewport or hidden)
      const shouldShow = !isAboveTable && isScrolledPast && !isHeaderVisible;
      
      // Use functional update to avoid stale state
      setShowStickyHeader(prev => {
        if (shouldShow && !prev) {
          updateStickyHeaderPosition();
          return true;
        } else if (!shouldShow && prev) {
          return false;
        }
        // Update position if already showing
        if (shouldShow && prev) {
          updateStickyHeaderPosition();
        }
        return prev;
      });
    };

    // Intersection Observer as backup/optimization
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger scroll handler when intersection changes
        handleScroll();
      },
      {
        root: null, // viewport
        rootMargin: `-${tabsBarBottom}px 0px 0px 0px`,
        threshold: [0, 0.1, 0.5, 1] // Multiple thresholds for better detection
      }
    );

    // Observe both header and container for better detection
    observer.observe(headerElement);
    observer.observe(containerElement);
    
    // Resize handler
    const handleResize = () => {
      updateStickyHeaderPosition();
      handleScroll();
    };

    // Update position on scroll and resize
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial check
    updateStickyHeaderPosition();
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, filteredRtoOrders]);

  if (!shop) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>No shop parameter found. Please select a shop.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
          gap: '20px',
          padding: '40px 20px'
        }}>
          <DotLottieReact
            src="https://lottie.host/d76bbc89-666d-46a0-898b-cc343e4fc5b8/pxRPeuoOie.lottie"
            loop
            autoplay
            style={{ width: '300px', height: '300px' }}
          />
          <div style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#6B7280',
            fontFamily: 'Manrope, sans-serif'
          }}>
            Building Dashboard ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isTestShop ? 'dashboard-container--blurred' : ''} ${activeTab === 'rto-bucket' ? 'dashboard-container--rto-bucket' : ''} ${activeTab === 'all-orders' ? 'dashboard-container--all-orders' : ''}`}>
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Sticky Tabs and Action Buttons Bar - Removed buttons */}
      <div className="dashboard-tabs-container dashboard-tabs-container--sticky">
          {/* Buttons removed as requested */}
                </div>

      {/* Tab Content - Analytics removed, only showing Shopify Orders */}
      {false && (
        <div className="dashboard-tab-content" style={{ display: 'none' }}>
          <div className="stats-grid">
            <div className="stat-box stat-box-1x1 stat-box-gradient">
              <div className="stat-box-title">
                <span>New Orders</span>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stat-box-top-icon">
                  <rect x="1" y="1" width="38" height="38" rx="19" stroke="#5167D3" strokeWidth="2"/>
                  <path d="M14.2983 28.0284L12.4787 26.1989L23.5057 15.152H15.054L15.0739 12.6364H27.8509V25.4233H25.3153L25.3352 16.9716L14.2983 28.0284Z" fill="#ffffff"/>
                </svg>
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number">
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.newOrders || 0).toLocaleString()}
                </div>
                <div className="stat-box-change">
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Orders Called</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number">
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.ordersCalled || 0).toLocaleString()}
                </div>
                <div className="stat-box-change">
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Initiated Calls</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number">
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.initiatedCalls || 0).toLocaleString()}
                </div>
                <div className="stat-box-change">
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Pick Rate</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number">
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.pickRate || '0.00') + '%'}
                </div>
                <div className="stat-box-change">
                  <span>By Order • Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
              <div className="stat-box-title" style={{ color: '#ffffff' }}>
                <span>Conversion Rate</span>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stat-box-top-icon">
                  <rect x="1" y="1" width="38" height="38" rx="19" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M14.2983 28.0284L12.4787 26.1989L23.5057 15.152H15.054L15.0739 12.6364H27.8509V25.4233H25.3153L25.3352 16.9716L14.2983 28.0284Z" fill="#ffffff"/>
                </svg>
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number" style={{ color: '#ffffff' }}>
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.conversionRate || '0.00') + '%'}
                </div>
                <div className="stat-box-change" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
              <div className="stat-box-title" style={{ color: '#ffffff' }}>
                <span>Unclear Rate</span>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stat-box-top-icon">
                  <rect x="1" y="1" width="38" height="38" rx="19" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M14.2983 28.0284L12.4787 26.1989L23.5057 15.152H15.054L15.0739 12.6364H27.8509V25.4233H25.3153L25.3352 16.9716L14.2983 28.0284Z" fill="#ffffff"/>
                </svg>
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number" style={{ color: '#ffffff' }}>
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.unclearRate || '0.00') + '%'}
                </div>
                <div className="stat-box-change" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}>
              <div className="stat-box-title" style={{ color: '#ffffff' }}>
                <span>Cancel Rate</span>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="stat-box-top-icon">
                  <rect x="1" y="1" width="38" height="38" rx="19" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M14.2983 28.0284L12.4787 26.1989L23.5057 15.152H15.054L15.0739 12.6364H27.8509V25.4233H25.3153L25.3352 16.9716L14.2983 28.0284Z" fill="#ffffff"/>
                </svg>
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number" style={{ color: '#ffffff' }}>
                  {loadingCardMetrics ? '—' : (cardMetrics.yesterdayStats?.cancelRate || '0.00') + '%'}
                </div>
                <div className="stat-box-change" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Wallet Balance</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content">
                <div className="stat-box-number">
                  {loadingCardMetrics ? '—' : (cardMetrics.walletStats?.callsPossible || 0).toLocaleString()}
                </div>
                <div className="stat-box-change">
                  <span>Calls Available</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Calling Window</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <div className="stat-box-number" style={{ fontSize: '20px', marginBottom: '8px' }}>
                  {loadingCardMetrics ? '—' : (cardMetrics.walletStats?.callingWindow || '--')}
                </div>
                <div className="stat-box-change">
                  <span>{cardMetrics.walletStats?.timezone || 'UTC'}</span>
                </div>
              </div>
            </div>

            <div className="stat-box stat-box-1x1">
              <div className="stat-box-title">
                <span>Next Scheduled Call</span>
                <img src="/images/top right.svg" alt="" className="stat-box-top-icon" />
              </div>
              <div className="stat-box-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                {loadingCardMetrics ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
                ) : cardMetrics.nextScheduledCall ? (
                  <>
                    <div className="stat-box-number" style={{ fontSize: '18px', marginBottom: '8px' }}>
                      #{cardMetrics.nextScheduledCall.orderNumber}
                    </div>
                    <div className="stat-box-change" style={{ fontSize: '12px' }}>
                      {cardMetrics.nextScheduledCall.scheduledTime ? new Date(cardMetrics.nextScheduledCall.scheduledTime).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit'
                      }) : 'TBD'}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No scheduled calls</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rto-bucket' && (
        <div className="dashboard-tab-content dashboard-tab-content--rto-bucket">
          {/* RTO Bucket Boxes Section - REMOVED */}

      {/* Sticky Table Header - Appears below tabs bar when scrolled */}
      {activeTab === 'rto-bucket' && showStickyHeader && (
              <div
          className="sticky-table-header-wrapper"
                style={{
            left: `calc(var(--sidebar-width) + ${stickyHeaderLeft}px)`,
            width: stickyHeaderWidth
          }}
        >
          <table className="orders-table sticky-table-header" style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              {(selectAll || selectedOrders.size > 0) ? (
                <tr>
                  <th colSpan="10" style={{ padding: '8px 10px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937', fontFamily: 'Manrope, sans-serif' }}>
                        {selectedOrders.size} selected
                      </span>
                      <button
                        onClick={handleBulkTag}
                        style={{
                          padding: '2px 12px',
                          background: '#ffffff',
                          color: '#1f2937',
                          border: '1px solid #5167D3',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Manrope, sans-serif',
                  cursor: 'pointer',
                          boxShadow: '0 2px 0 #291C64',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4ff';
                          e.currentTarget.style.borderColor = '#291C64';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#5167D3';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                        }}
                      >
                        Tag orders
                      </button>
                      <button
                        onClick={handleCreateClip}
                        style={{
                          padding: '2px 12px',
                          background: '#ffffff',
                          color: '#1f2937',
                          border: '1px solid #5167D3',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Manrope, sans-serif',
                          cursor: 'pointer',
                          boxShadow: '0 2px 0 #291C64',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4ff';
                          e.currentTarget.style.borderColor = '#291C64';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#5167D3';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                }}
              >
                        Create Clip
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement export functionality
                          alert('Export functionality coming soon');
                        }}
                        style={{
                          padding: '2px 12px',
                          background: '#ffffff',
                          color: '#1f2937',
                          border: '1px solid #5167D3',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Manrope, sans-serif',
                          cursor: 'pointer',
                          boxShadow: '0 2px 0 #291C64',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4ff';
                          e.currentTarget.style.borderColor = '#291C64';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#5167D3';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                        }}
                      >
                        Export
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement more options dropdown
                          alert('More options coming soon');
                        }}
                        style={{
                          padding: '2px 12px',
                          background: '#ffffff',
                          color: '#1f2937',
                          border: '1px solid #5167D3',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Manrope, sans-serif',
                          cursor: 'pointer',
                          boxShadow: '0 2px 0 #291C64',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4ff';
                          e.currentTarget.style.borderColor = '#291C64';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#5167D3';
                          e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                        }}
                      >
                        ⋯
                      </button>
              </div>
                  </th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('order')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '100px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Order
                      <span className="sort-arrows">
                        {sortColumn === 'order' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('date')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Date
                      <span className="sort-arrows">
                        {sortColumn === 'date' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('customer')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '150px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Customer
                      <span className="sort-arrows">
                        {sortColumn === 'customer' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('phone')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '120px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Phone
                      <span className="sort-arrows">
                        {sortColumn === 'phone' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('address')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '200px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Address
                      <span className="sort-arrows">
                        {sortColumn === 'address' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('payment')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '110px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Payment
                      <span className="sort-arrows">
                        {sortColumn === 'payment' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('fulfillment')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '120px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Fulfilment
                      <span className="sort-arrows">
                        {sortColumn === 'fulfillment' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('reason')}
                    style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Reason
                      <span className="sort-arrows">
                        {sortColumn === 'reason' ? (
                          rtoSortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="sort-arrow-hover">↕</span>
                        )}
                      </span>
                    </span>
                  </th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              )}
            </thead>
          </table>
        </div>
        )}

      {/* RTO Bucket Table */}
      <div className="content-card rto-bucket-card" style={{ marginBottom: '24px' }} ref={tableContainerRef}>
        <div className="table-container">
          {loadingRto ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: '20px',
              minHeight: '400px'
            }}>
              <DotLottieReact
                src="https://lottie.host/d76bbc89-666d-46a0-898b-cc343e4fc5b8/pxRPeuoOie.lottie"
                loop
                autoplay
                style={{ width: '200px', height: '200px' }}
              />
              <div style={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#6B7280',
                fontFamily: 'Manrope, sans-serif'
              }}>
                Building Dashboard ...
              </div>
            </div>
          ) : (
            <table className="orders-table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead ref={tableHeaderRef}>
                {(selectAll || selectedOrders.size > 0) ? (
                  <tr>
                    <th colSpan="10" style={{ padding: '8px 10px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937', fontFamily: 'Manrope, sans-serif' }}>
                          {selectedOrders.size} selected
            </span>
              <button
                onClick={handleTagOrders}
                          style={{
                            padding: '2px 12px',
                            background: '#ffffff',
                            color: '#1f2937',
                            border: '1px solid #5167D3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Manrope, sans-serif',
                            cursor: 'pointer',
                            boxShadow: '0 2px 0 #291C64',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f4ff';
                            e.currentTarget.style.borderColor = '#291C64';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#5167D3';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                          }}
              >
                          Tag orders
              </button>
              <button
                          onClick={() => {
                            const allSelectedOrderIds = [
                              ...Array.from(selectedOrders),
                              ...Array.from(selectedStandardOrders)
                            ];
                            if (allSelectedOrderIds.length === 0) {
                              alert('Please select at least one order');
                              return;
                            }
                            setShowCreateClipModal(true);
                          }}
                          style={{
                            padding: '2px 12px',
                            background: '#ffffff',
                            color: '#1f2937',
                            border: '1px solid #5167D3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Manrope, sans-serif',
                            cursor: 'pointer',
                            boxShadow: '0 2px 0 #291C64',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f4ff';
                            e.currentTarget.style.borderColor = '#291C64';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#5167D3';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                          }}
              >
                Create Clip
              </button>
                        <button
                          onClick={() => {
                            // TODO: Implement export functionality
                            alert('Export functionality coming soon');
                          }}
                          style={{
                            padding: '2px 12px',
                            background: '#ffffff',
                            color: '#1f2937',
                            border: '1px solid #5167D3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Manrope, sans-serif',
                            cursor: 'pointer',
                            boxShadow: '0 2px 0 #291C64',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f4ff';
                            e.currentTarget.style.borderColor = '#291C64';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#5167D3';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                          }}
                        >
                          Export
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement more options dropdown
                            alert('More options coming soon');
                          }}
                          style={{
                            padding: '2px 12px',
                            background: '#ffffff',
                            color: '#1f2937',
                            border: '1px solid #5167D3',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'Manrope, sans-serif',
                            cursor: 'pointer',
                            boxShadow: '0 2px 0 #291C64',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f4ff';
                            e.currentTarget.style.borderColor = '#291C64';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#5167D3';
                            e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                          }}
                        >
                          ⋯
                        </button>
          </div>
                    </th>
                  </tr>
          ) : (
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('order')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '100px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Order
                        <span className="sort-arrows">
                          {sortColumn === 'order' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('date')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Date
                        <span className="sort-arrows">
                          {sortColumn === 'date' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('customer')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '150px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Customer
                        <span className="sort-arrows">
                          {sortColumn === 'customer' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('phone')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '120px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Phone
                        <span className="sort-arrows">
                          {sortColumn === 'phone' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('address')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '200px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Address
                        <span className="sort-arrows">
                          {sortColumn === 'address' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('payment')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '110px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Payment
                        <span className="sort-arrows">
                          {sortColumn === 'payment' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('fulfillment')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '120px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Fulfilment
                        <span className="sort-arrows">
                          {sortColumn === 'fulfillment' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('reason')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Reason
                        <span className="sort-arrows">
                          {sortColumn === 'reason' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th 
                      className="sortable-header"
                      onClick={() => handleSort('callingStatus')}
                      style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Calling Status
                        <span className="sort-arrows">
                          {sortColumn === 'callingStatus' ? (
                            rtoSortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className="sort-arrow-hover">↕</span>
                          )}
                        </span>
                      </span>
                    </th>
                    <th style={{ width: '60px' }}></th>
                </tr>
                )}
              </thead>
              <tbody>
                {filteredRtoOrders.length > 0 ? (
                  filteredRtoOrders.map((order, index) => {
                    const orderId = order.orderId || order.id;
                    const isSelected = selectedOrders.has(orderId);
                    
                    // For design preview: cycle through all badge types in first 10 rows
                    const paymentTypes = ['COD', 'Prepaid', 'COD', 'Prepaid', 'COD', 'Prepaid', 'COD', 'Prepaid', 'COD', 'Prepaid'];
                    const fulfillmentTypes = ['unfulfilled', 'fulfilled', 'unfulfilled', 'fulfilled', 'unfulfilled', 'fulfilled', 'unfulfilled', 'fulfilled', 'unfulfilled', 'fulfilled'];
                    const reasonTypes = ['bad_address', 'impulsive', 'high_intent', 'sussy', 'spam', 'bad_address', 'impulsive', 'high_intent', 'sussy', 'spam'];
                    
                    // Use demo values for first 10 rows, then use actual order data
                    const demoPayment = index < 10 ? paymentTypes[index] : (order.paymentMethod || order.paymentStatus);
                    const demoFulfillment = index < 10 ? fulfillmentTypes[index] : (order.fulfillmentStatus);
                    const demoReason = index < 10 ? reasonTypes[index] : (order.newRtoBucketReason);
                    
                    return (
                      <tr 
                        key={order.id || order.orderId}
                        style={{
                          background: isSelected ? '#F9FAFB' : '#ffffff',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (isSelected) {
                            e.currentTarget.style.background = '#ffffff';
                          } else {
                            e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isSelected) {
                            e.currentTarget.style.background = '#F9FAFB';
                          } else {
                            e.currentTarget.style.background = '#ffffff';
                          }
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOrderSelection(orderId)}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {order.orderNumber || order.orderId || order.id}
                        </td>
                        <td className="date-cell">{formatDate(order.createdAt)}</td>
                        <td style={{
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {(order.customerName || '').toString()}
                        </td>
                        <td>{order.customerPhone || ''}</td>
                        <td style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {order.customerAddress || 'N/A'}
                        </td>
                        <td>
                          {getPaymentBadge(demoPayment)}
                        </td>
                        <td>
                          {getFulfillmentBadge(demoFulfillment)}
                        </td>
                        <td>
                          {getReasonBadge(demoReason, orderId)}
                        </td>
                        <td>
                          {(() => {
                            // Determine calling status based on order data
                            // Check if order has calls
                            const hasCalls = order.calls && order.calls.length > 0;
                            const latestCall = hasCalls ? order.calls[0] : null;
                            
                            // Check if there's an active call (callStatus indicates active)
                            const isOnCall = latestCall && (
                              latestCall.callStatus === 'connected' || 
                              latestCall.callStatus === 'talking' ||
                              latestCall.callStatus === 'on_call'
                            );
                            
                            // Check if order is in queue (has callStatus but not completed)
                            const isInQueue = order.callStatus && 
                              order.callStatus !== 'completed' && 
                              order.callStatus !== 'failed' &&
                              !isOnCall;
                            
                            let status = 'Not initiated';
                            let statusColor = '#6b7280'; // gray
                            let statusBg = '#f3f4f6';
                            
                            if (isOnCall) {
                              status = 'On Call/talking';
                              statusColor = '#059669'; // green
                              statusBg = '#ecfdf5';
                            } else if (isInQueue) {
                              status = 'In queue';
                              statusColor = '#2563eb'; // blue
                              statusBg = '#eff6ff';
                            }
                            
                            return (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  background: statusBg,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}40`
                                }}
                              >
                                {status}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ width: '60px', position: 'relative' }}>
                          <button
                            className="btn-icon"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              fontSize: '16px',
                              padding: '4px 8px',
                              color: '#6B7280',
                              fontWeight: 'bold'
                            }}
                            title="Actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              const orderId = order.id || order.orderId;
                              setOpenActionMenu(openActionMenu === orderId ? null : orderId);
                            }}
                          >
                            ⋯
                          </button>
                          {openActionMenu === (order.id || order.orderId) && (
                            <div 
                              className="action-menu-dropdown"
                              style={{
                                position: 'absolute',
                                right: '0',
                                top: '100%',
                                background: '#ffffff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                                minWidth: '120px',
                                marginTop: '4px'
                              }}
                            >
                              <div
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#1f2937',
                                  borderBottom: '1px solid #F3F4F6'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement call functionality
                                  setOpenActionMenu(null);
                                }}
                              >
                                Call
                              </div>
                              <div
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#1f2937',
                                  borderBottom: '1px solid #F3F4F6'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement clip functionality
                                  setOpenActionMenu(null);
                                }}
                              >
                                Clip
                              </div>
                              <div
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#1f2937'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement tag functionality
                                  setOpenActionMenu(null);
                                }}
                              >
                                Tag
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      {activeStatCard ? `No orders found for ${getReasonDisplayName(activeStatCard)}` : "No today's unverified orders found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
      </div>

        {/* Reason Tooltip Modal */}
        {hoveredReason && (
          <div
            style={{
              position: 'fixed',
              top: `${reasonTooltipPosition.top}px`,
              left: `${reasonTooltipPosition.left}px`,
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 10000,
              minWidth: '280px',
              maxWidth: '320px',
              fontFamily: 'Manrope, sans-serif'
            }}
            onMouseEnter={() => setHoveredReason(hoveredReason)}
            onMouseLeave={() => setHoveredReason(null)}
          >
            {(() => {
              const tooltipContent = getReasonTooltipContent(hoveredReason.reason);
              return (
                <>
                  {/* Hand Icon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <img 
                      src="/images/image 161.svg" 
                      alt="Hand icon" 
                      style={{ width: '32px', height: '32px' }}
                      />
                  </div>
                  
                  {/* Reason Name */}
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1f2937', 
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}>
                    {tooltipContent.name}
                  </div>
                  
                  {/* Meaning */}
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6B7280', 
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    {tooltipContent.meaning}
                  </div>
                  
                  {/* Three Icons with Text */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    {tooltipContent.reasons.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          flex: 1
                        }}
                      >
                        <img 
                          src={item.icon} 
                          alt={item.text}
                          style={{ width: '20px', height: '20px' }}
                        />
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#1f2937',
                          textAlign: 'center'
                        }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* View Customer Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement view customer functionality
                      console.log('View Customer clicked for:', hoveredReason.orderId);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#1f2937',
                      border: '1px solid #5167D3',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Manrope, sans-serif',
                      cursor: 'pointer',
                      boxShadow: '0 2px 0 #291C64',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f4ff';
                      e.currentTarget.style.borderColor = '#291C64';
                      e.currentTarget.style.boxShadow = '0 2px 0 #291C64, inset 0 0 8px rgba(41, 28, 100, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#5167D3';
                      e.currentTarget.style.boxShadow = '0 2px 0 #291C64';
                    }}
                  >
                    View Customer
                  </button>
                </>
              );
            })()}
          </div>
        )}
        
        {/* Sticky Bottom Pagination Bar - Attached to table */}
        <div className="rto-bucket-pagination-bar">
          <div className="rto-bucket-pagination-content">
                  <button
              className="rto-bucket-pagination-btn"
              onClick={() => loadNewRtoBucketOrders(rtoOrdersPagination.currentPage - 1)}
              disabled={!rtoOrdersPagination.hasPrev || loadingRto}
                  >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                  </button>
                  <button
              className="rto-bucket-pagination-btn"
              onClick={() => loadNewRtoBucketOrders(rtoOrdersPagination.currentPage + 1)}
              disabled={!rtoOrdersPagination.hasNext || loadingRto}
                  >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                  </button>
            <span className="rto-bucket-pagination-text">
              {rtoOrdersPagination.currentPage === 1 
                ? `1-${Math.min(rtoOrdersPagination.limit, rtoOrdersPagination.totalCount)}`
                : `${(rtoOrdersPagination.currentPage - 1) * rtoOrdersPagination.limit + 1}-${Math.min(rtoOrdersPagination.currentPage * rtoOrdersPagination.limit, rtoOrdersPagination.totalCount)}`
              } of {rtoOrdersPagination.totalCount}
            </span>
                </div>
        </div>
      </div>
        </div>
      )}

      {/* Standard Orders Table - Show when activeTab is 'all-orders' */}
      {activeTab === 'all-orders' && (
        <div className="content-card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Premium Filter Bar */}
          <div style={{
            padding: '12px 16px',
            background: '#FAFBFC',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '12px 12px 0 0'
          }}>
            {/* Action Button Section */}
            <div style={{ 
              marginBottom: '12px',
            display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
          }}>
            <button
              onClick={() => {
                if (selectedStandardOrders.size > 0) {
                  setShowCreateClipModal(true);
                }
              }}
              disabled={selectedStandardOrders.size === 0}
              style={{
                  padding: '6px 12px',
                  background: selectedStandardOrders.size > 0 
                    ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' 
                    : '#F1F3F5',
                  color: selectedStandardOrders.size > 0 ? '#FFFFFF' : '#868E96',
                border: 'none',
                borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                cursor: selectedStandardOrders.size > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                  boxShadow: selectedStandardOrders.size > 0 
                    ? '0 2px 8px rgba(102, 126, 234, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1)' 
                    : 'none',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                if (selectedStandardOrders.size > 0) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.35), 0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStandardOrders.size > 0) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M8 5V11M5 8H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>Create Clip {selectedStandardOrders.size > 0 && `(${selectedStandardOrders.size})`}</span>
            </button>
            </div>

            {/* Filters Grid - Organized Grouping */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginBottom: '12px'
            }}>
              {/* Search Filter Group - Full Width */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                gridColumn: '1 / -1'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
                }}>Search</label>
                <input
                  type="text"
                  placeholder="Search orders, customers, phone numbers, addresses..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: '#FFFFFF',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                fontWeight: 400, 
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                />
              </div>

              {/* Date Range Filter Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
                }}>Date Range</label>
              <select
                value={dateTemplate}
                onChange={(e) => {
                  const template = e.target.value;
                  setDateTemplate(template);
                  const today = new Date();
                  const istOffset = 5.5 * 60 * 60 * 1000;
                  const istToday = new Date(today.getTime() + istOffset);
                  
                  let from, to;
                  if (template === 'today') {
                    from = to = getTodayInIST();
                  } else if (template === 'yesterday') {
                    const yesterday = new Date(istToday);
                    yesterday.setDate(yesterday.getDate() - 1);
                    from = to = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
                  } else if (template === 'last7days') {
                    const sevenDaysAgo = new Date(istToday);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    from = `${sevenDaysAgo.getUTCFullYear()}-${String(sevenDaysAgo.getUTCMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getUTCDate()).padStart(2, '0')}`;
                    to = getTodayInIST();
                  } else if (template === 'last30days') {
                    const thirtyDaysAgo = new Date(istToday);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    from = `${thirtyDaysAgo.getUTCFullYear()}-${String(thirtyDaysAgo.getUTCMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getUTCDate()).padStart(2, '0')}`;
                    to = getTodayInIST();
                  }
                  
                  if (from && to) {
                    setFromDate(from);
                    setToDate(to);
                  }
                }}
                style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  fontWeight: 400,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
              {dateTemplate === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      background: '#FFFFFF',
                        color: '#212529',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                      fontWeight: 400,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        flex: 1
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667EEA';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                      }}
                    />
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#868E96', 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                      fontWeight: 500
                    }}>to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      background: '#FFFFFF',
                        color: '#212529',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                      fontWeight: 400,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                        flex: 1
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667EEA';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                      }}
                    />
                  </div>
              )}
            </div>

              {/* Calling Status Filter Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
                }}>Calling Status</label>
              <select
                value={callingStatusFilter}
                onChange={(e) => setCallingStatusFilter(e.target.value)}
                style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  fontWeight: 400,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <option value="all">All Status</option>
                <option value="called">Called</option>
                <option value="not_called">Not Called</option>
              </select>
            </div>

              {/* Tags Filter Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
              }}>Tags</label>
              <input
                type="text"
                placeholder="Filter by tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  background: '#FFFFFF',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  fontWeight: 400,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                }}
              />
            </div>

              {/* Payment Type Filter Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
                }}>Payment Type</label>
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  fontWeight: 400,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <option value="all">All Payment</option>
                <option value="cod">COD</option>
                <option value="prepaid">Prepaid</option>
              </select>
            </div>

              {/* Fulfillment Status Filter Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
              <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  marginBottom: '2px'
              }}>Fulfillment</label>
              <select
                value={fulfillmentStatusFilter}
                onChange={(e) => setFulfillmentStatusFilter(e.target.value)}
                style={{
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                    color: '#212529',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  fontWeight: 400,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667EEA';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <option value="all">All Status</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="unfulfilled">Unfulfilled</option>
                <option value="partial">Partial</option>
              </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginTop: '4px'
            }}>
            <button
              onClick={() => {
                setFromDate(getTodayInIST());
                setToDate(getTodayInIST());
                setDateTemplate('custom');
                setSearchFilter('');
                setCallingStatusFilter('all');
                setTagFilter('');
                setPaymentTypeFilter('all');
                setFulfillmentStatusFilter('all');
              }}
              style={{
                  padding: '6px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                background: '#FFFFFF',
                cursor: 'pointer',
                  color: '#495057',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  letterSpacing: '-0.01em'
                }}
              onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8F9FA';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            >
                Clear Filters
            </button>
            </div>
          </div>

          {/* Auto Call Settings Section */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            background: '#F9FAFB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1F2937',
                fontFamily: 'Manrope, sans-serif'
              }}>Auto Call Settings</h3>
              <button
                onClick={() => setShowAutoCallSettings(!showAutoCallSettings)}
                style={{
                  padding: '6px 12px',
                  background: '#5167D3',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'Manrope, sans-serif',
                  cursor: 'pointer',
                  display: 'none', // Hidden as requested
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Settings" width="16" height="16" />
                {showAutoCallSettings ? 'Hide' : 'Show'} Settings
              </button>
            </div>

            {showAutoCallSettings && (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                {/* Enable Auto Call */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    fontFamily: 'Manrope, sans-serif',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={shopifyAutoCallSettings.enabled}
                      onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, enabled: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Enable Auto Call
                  </label>
                </div>

                {/* Script Selection */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '4px'
                    }}>Script</label>
                    <select
                      value={shopifyAutoCallSettings.scriptId || ''}
                      onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, scriptId: e.target.value ? parseInt(e.target.value) : null })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Choose a script --</option>
                      {agents.map((script) => (
                        <option key={script.id} value={script.id}>
                          {script.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Calling Window */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '4px'
                    }}>Calling Window</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="time"
                        value={shopifyAutoCallSettings.allowedTimeStart || '09:00'}
                        onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, allowedTimeStart: e.target.value })}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={shopifyAutoCallSettings.allowedTimeEnd || '18:00'}
                        onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, allowedTimeEnd: e.target.value })}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '4px'
                    }}>Timezone</label>
                    <select
                      value={shopifyAutoCallSettings.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, timezone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {/* Allowed Days */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    fontFamily: 'Manrope, sans-serif',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Allowed Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['0', '1', '2', '3', '4', '5', '6'].map((day) => (
                      <label key={day} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#374151',
                        fontFamily: 'Manrope, sans-serif',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={(shopifyAutoCallSettings.allowedDays || '').split(',').includes(day)}
                          onChange={(e) => {
                            const days = (shopifyAutoCallSettings.allowedDays || '').split(',').filter(d => d !== day);
                            setShopifyAutoCallSettings({
                              ...shopifyAutoCallSettings,
                              allowedDays: e.target.checked ? [...days, day].join(',') : days.join(',')
                            });
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        {day === '0' ? 'Sun' : day === '1' ? 'Mon' : day === '2' ? 'Tue' : day === '3' ? 'Wed' : day === '4' ? 'Thu' : day === '5' ? 'Fri' : 'Sat'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Retry Settings */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '4px'
                    }}>Max Retries</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={shopifyAutoCallSettings.maxRetries || 3}
                      onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, maxRetries: parseInt(e.target.value) || 3 })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '4px'
                    }}>Retry Interval (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={shopifyAutoCallSettings.retryIntervalMinutes || 60}
                      onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, retryIntervalMinutes: parseInt(e.target.value) || 60 })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>

                {/* Channels */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    fontFamily: 'Manrope, sans-serif',
                    display: 'block',
                    marginBottom: '8px'
                   }}>Channels (parallel calls)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={shopifyAutoCallSettings.channels || 1}
                    onChange={(e) => setShopifyAutoCallSettings({ ...shopifyAutoCallSettings, channels: parseInt(e.target.value) || 1 })}
                    style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: '1px solid #D1D5DB',
                       borderRadius: '6px',
                       fontSize: '14px',
                       background: 'white'
                     }}
                  />
                 </div>
              </div>

              {/* Call Conditions */}
              <div style={{
                marginTop: '16px',
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                    fontFamily: 'Manrope, sans-serif',
                    display: 'block',
                    marginBottom: '8px'
                  }}>Call Conditions (order statuses to call)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                     {['pending', 'paid', 'partially_paid', 'partially_refunded', 'refunded', 'voided'].map((status) => (
                       <label key={status} style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '6px',
                         fontSize: '13px',
                         color: '#374151',
                         fontFamily: 'Manrope, sans-serif',
                         cursor: 'pointer'
                       }}>
                         <input
                           type="checkbox"
                           checked={(shopifyAutoCallSettings.callConditions || []).includes(status)}
                           onChange={(e) => {
                             const conditions = shopifyAutoCallSettings.callConditions || [];
                             if (e.target.checked) {
                               setShopifyAutoCallSettings({
                                 ...shopifyAutoCallSettings,
                                 callConditions: [...conditions, status],
                                 notCallConditions: (shopifyAutoCallSettings.notCallConditions || []).filter(s => s !== status)
                               });
                             } else {
                               setShopifyAutoCallSettings({
                                 ...shopifyAutoCallSettings,
                                 callConditions: conditions.filter(s => s !== status)
                               });
                             }
                           }}
                           style={{ width: '16px', height: '16px' }}
                         />
                         {status.replace(/_/g, ' ')}
                       </label>
                     ))}
                  </div>
                </div>
                <div>
                   <label style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      fontFamily: 'Manrope, sans-serif',
                      display: 'block',
                      marginBottom: '8px'
                   }}>Do Not Call Conditions (order statuses to exclude)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                     {['fulfilled', 'cancelled', 'partially_fulfilled', 'unfulfilled'].map((status) => (
                       <label key={status} style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '6px',
                         fontSize: '13px',
                         color: '#374151',
                         fontFamily: 'Manrope, sans-serif',
                         cursor: 'pointer'
                       }}>
                         <input
                           type="checkbox"
                           checked={(shopifyAutoCallSettings.notCallConditions || []).includes(status)}
                           onChange={(e) => {
                             const conditions = shopifyAutoCallSettings.notCallConditions || [];
                             if (e.target.checked) {
                               setShopifyAutoCallSettings({
                                 ...shopifyAutoCallSettings,
                                 notCallConditions: [...conditions, status],
                                 callConditions: (shopifyAutoCallSettings.callConditions || []).filter(s => s !== status)
                               });
                             } else {
                               setShopifyAutoCallSettings({
                                 ...shopifyAutoCallSettings,
                                 notCallConditions: conditions.filter(s => s !== status)
                               });
                             }
                           }}
                           style={{ width: '16px', height: '16px' }}
                         />
                         {status.replace(/_/g, ' ')}
                       </label>
                     ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveAutoCallSettings}
                  style={{
                    padding: '10px 20px',
                    background: '#5167D3',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Manrope, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Save Settings
                </button>
               </div>
             </div>
             )}
           </div>

          <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
            {loadingStandard ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '20px',
                minHeight: '400px'
              }}>
                <DotLottieReact
                  src="https://lottie.host/d76bbc89-666d-46a0-898b-cc343e4fc5b8/pxRPeuoOie.lottie"
                  loop
                  autoplay
                  style={{ width: '200px', height: '200px' }}
                />
                <div style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#6B7280',
                  fontFamily: 'Manrope, sans-serif'
                }}>
                  Loading orders...
                </div>
              </div>
            ) : (
              <table className="orders-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      width: columnWidths.checkbox || 40,
                      minWidth: 50,
                      position: 'relative',
                      padding: '8px 10px',
                      borderRight: '1px solid #F3F4F6'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectAllStandard}
                        onChange={toggleSelectAllStandard}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          cursor: 'col-resize',
                          backgroundColor: resizingColumn === 'checkbox' ? '#5167D3' : 'transparent',
                          zIndex: 10
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setResizingColumn('checkbox');
                          setResizeStartX(e.clientX);
                          setResizeStartWidth(columnWidths.checkbox || 40);
                        }}
                        onMouseEnter={(e) => {
                          if (resizingColumn !== 'checkbox') {
                            e.currentTarget.style.backgroundColor = '#D1D5DB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (resizingColumn !== 'checkbox') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      />
                    </th>
                    {createResizableHeader('order', 'Order', true, 'NAME')}
                    {createResizableHeader('customer', 'Customer')}
                    {createResizableHeader('flags', 'Flags')}
                    {createResizableHeader('date', 'Date', true, 'CREATED_AT')}
                    {createResizableHeader('total', 'Total', true, 'TOTAL_PRICE')}
                    {createResizableHeader('paymentStatus', 'Payment status')}
                    {createResizableHeader('fulfillmentStatus', 'Fulfillment status')}
                    {createResizableHeader('items', 'Items')}
                    {createResizableHeader('deliveryMethod', 'Delivery method')}
                    {createResizableHeader('tags', 'Tags')}
                    {createResizableHeader('callingStatus', 'Calling Status')}
                  </tr>
                </thead>
                <tbody>
                  {standardOrders.length > 0 ? (
                    standardOrders.map((order) => {
                      const orderId = order.id;
                      const isSelected = selectedStandardOrders.has(orderId);
                      const orderName = order.name || 'N/A';
                      const orderDate = formatRelativeDate(order.createdAt);
                      const tags = order.tags || [];
                      
                      // Flags
                      const flags = [];
                      if (order.test) flags.push('Test');
                      if (order.cancelledAt) flags.push('Cancelled');
                      if (order.closed) flags.push('Closed');
                      if (!order.confirmed) flags.push('Unconfirmed');
                      
                      // Customer
                      const customer = order.customer;
                      const customerName = customer ? (customer.displayName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'N/A') : 'N/A';
                      
                      // Channel
                      const channel = order.channelId || order.sourceName || 'N/A';
                      
                      // Total
                      const total = order.totalPrice && order.currencyCode 
                        ? `${order.currencyCode} ${parseFloat(order.totalPrice).toFixed(2)}`
                        : 'N/A';
                      
                      // Payment status - show Pending as COD
                      const rawPaymentStatus = order.displayFinancialStatus || 'N/A';
                      const paymentStatus = rawPaymentStatus === 'Pending' ? 'COD' : rawPaymentStatus;
                      
                      // Fulfillment status
                      const fulfillmentStatus = order.displayFulfillmentStatus || 'N/A';
                      
                      // Items
                      const items = order.lineItems || [];
                      const itemsDisplay = items.length > 0 
                        ? `${items.length} item${items.length > 1 ? 's' : ''}`
                        : '—';
                      
                      // Delivery status
                      const fulfillments = order.fulfillments || [];
                      const deliveryStatus = fulfillments.length > 0
                        ? fulfillments.map(f => f.status).join(', ')
                        : 'Not fulfilled';
                      
                      // Delivery method
                      const shippingLines = order.shippingLines || [];
                      const deliveryMethod = shippingLines.length > 0
                        ? shippingLines.map(sl => sl.title || sl.code).filter(Boolean).join(', ')
                        : '—';
                      
                      // Calling status
                      const hasCalls = orderCallStatus.get(orderId) || false;
                      const callingStatus = hasCalls ? 'Called' : "Didn't Called";
                      
                      // Debug logging for NK/27046
                      if (orderName === 'NK/27046' || orderName.includes('27046')) {
                        const allRelevantKeys = Array.from(orderCallStatus.keys()).filter(k => 
                          k.includes('7323861877027') || k.includes('27046') || k === orderId
                        );
                        console.log(`[AllOrders Render] 🔴 NK/27046 RENDER:`, {
                          orderName,
                          orderId,
                          orderIdType: typeof orderId,
                          orderIdLength: orderId?.length,
                          hasCalls,
                          callingStatus,
                          mapSize: orderCallStatus.size,
                          mapHasKey: orderCallStatus.has(orderId),
                          mapValue: orderCallStatus.get(orderId),
                          allRelevantKeys,
                          allRelevantEntries: allRelevantKeys.map(k => ({ key: k, value: orderCallStatus.get(k) }))
                        });
                      }
                      
                      return (
                        <tr
                          key={order.id}
                          style={{
                            background: isSelected ? '#F9FAFB' : '#ffffff',
                            transition: 'background-color 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            // Don't open modal if clicking checkbox or link
                            if (e.target.type === 'checkbox' || e.target.tagName === 'A') {
                              return;
                            }
                            handleShowOrderDetails(order);
                          }}
                          onDoubleClick={(e) => {
                            // Double click to select/deselect
                            if (e.target.type === 'checkbox' || e.target.tagName === 'A') {
                              return;
                            }
                            const newSet = new Set(selectedStandardOrders);
                            if (newSet.has(orderId)) {
                              newSet.delete(orderId);
                            } else {
                              newSet.add(orderId);
                            }
                            setSelectedStandardOrders(newSet);
                            setSelectAllStandard(false);
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = '#F9FAFB';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = '#ffffff';
                            }
                          }}
                        >
                          <td 
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: columnWidths.checkbox || 40, minWidth: 50 }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const newSet = new Set(selectedStandardOrders);
                                if (newSet.has(orderId)) {
                                  newSet.delete(orderId);
                                } else {
                                  newSet.add(orderId);
                                }
                                setSelectedStandardOrders(newSet);
                                setSelectAllStandard(false);
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ fontWeight: 600, width: columnWidths.order || 120, minWidth: 50 }}>
                            <a 
                              href={`https://${shop}/admin/orders/${order.id ? (typeof order.id === 'string' ? order.id.split('/').pop() : order.id) : ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#008060', textDecoration: 'none' }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {orderName}
                            </a>
                          </td>
                          <td style={{ width: columnWidths.customer || 150, minWidth: 50 }}>{customerName}</td>
                          <td style={{ width: columnWidths.flags || 100, minWidth: 50 }}>
                            {flags.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {flags.map((flag, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 6px',
                                      background: flag === 'Test' ? '#FEF3C7' : flag === 'Cancelled' ? '#FEE2E2' : '#E5E7EB',
                                      color: flag === 'Test' ? '#92400E' : flag === 'Cancelled' ? '#991B1B' : '#374151',
                                      borderRadius: '3px',
                                      fontSize: '11px',
                                      fontWeight: 500
                                    }}
                                  >
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF' }}>—</span>
                            )}
                          </td>
                          <td style={{ width: columnWidths.date || 140, minWidth: 50 }}>{orderDate}</td>
                          <td style={{ width: columnWidths.total || 100, minWidth: 50 }}>{total}</td>
                          <td style={{ width: columnWidths.paymentStatus || 130, minWidth: 50 }}>
                            <StatusBadge 
                              status={paymentStatus === 'Paid' ? 'paid' : paymentStatus === 'COD' ? 'cod' : paymentStatus.toLowerCase()} 
                              type="payment" 
                            />
                          </td>
                          <td style={{ width: columnWidths.fulfillmentStatus || 140, minWidth: 50 }}>
                            <StatusBadge 
                              status={fulfillmentStatus.toLowerCase()} 
                              type="fulfillment" 
                            />
                          </td>
                          <td style={{ width: columnWidths.items || 80, minWidth: 50 }}>{itemsDisplay}</td>
                          <td style={{ width: columnWidths.deliveryMethod || 150, minWidth: 50 }}>{deliveryMethod}</td>
                          <td style={{ width: columnWidths.tags || 150, minWidth: 50 }}>
                            {tags.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      background: '#F3F4F6',
                                      color: '#374151',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 500
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF' }}>—</span>
                            )}
                          </td>
                          <td style={{ width: columnWidths.callingStatus || 120, minWidth: 50 }}>
                            <StatusBadge 
                              status={hasCalls ? 'called' : "didn't called"} 
                              type="call" 
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination Bar - Always show when there are orders or pagination */}
          {(standardOrders.length > 0 || standardOrdersPagination?.hasNextPage || standardOrdersPagination?.hasPreviousPage) && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0,
              background: '#F9FAFB'
            }}>
              {/* Left side - Count info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                  Showing {standardOrders.length} {standardOrders.length === 1 ? 'order' : 'orders'}
                </span>
                {(standardOrdersPagination?.totalCount > 0 || fromDate || toDate || tagFilter || callingStatusFilter !== 'all' || paymentTypeFilter !== 'all' || fulfillmentStatusFilter !== 'all') && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {standardOrdersPagination?.totalCount > 0 
                      ? `Total filtered: ${standardOrdersPagination.totalCount} ${standardOrdersPagination.totalCount === 1 ? 'order' : 'orders'}`
                      : 'Filters applied'
                    }
                  </span>
                )}
              </div>

              {/* Right side - Pagination controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {/* Page Size Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>Per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newPageSize = parseInt(e.target.value);
                      setPageSize(newPageSize);
                      // Reset to first page when changing page size
                      loadStandardOrders(null, 'reset');
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: 'white',
                      cursor: 'pointer',
                      minWidth: '80px'
                    }}
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
                {(standardOrdersPagination?.hasNextPage || standardOrdersPagination?.hasPreviousPage) && (
                  <>
                  <button
                    onClick={() => {
                      // Get the cursor for the previous page
                      // If history has 1 item, we're on page 2, going back to page 1 (null cursor)
                      // If history has more, use the second-to-last cursor
                      const prevCursor = paginationHistory.length > 1
                        ? paginationHistory[paginationHistory.length - 2]
                        : null;
                      loadStandardOrders(prevCursor, 'prev');
                    }}
                    disabled={!standardOrdersPagination.hasPreviousPage || loadingStandard}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: standardOrdersPagination.hasPreviousPage ? 'white' : '#f3f4f6',
                      cursor: (standardOrdersPagination.hasPreviousPage && !loadingStandard) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: standardOrdersPagination.hasPreviousPage ? '#111827' : '#9CA3AF',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (standardOrdersPagination.hasPreviousPage && !loadingStandard) {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#9CA3AF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (standardOrdersPagination.hasPreviousPage && !loadingStandard) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '14px', color: '#6b7280', minWidth: '80px', textAlign: 'center' }}>
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => loadStandardOrders(standardOrdersPagination.endCursor, 'next')}
                    disabled={!standardOrdersPagination.hasNextPage || loadingStandard}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: standardOrdersPagination.hasNextPage ? 'white' : '#f3f4f6',
                      cursor: (standardOrdersPagination.hasNextPage && !loadingStandard) ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: standardOrdersPagination.hasNextPage ? '#111827' : '#9CA3AF',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (standardOrdersPagination.hasNextPage && !loadingStandard) {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#9CA3AF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (standardOrdersPagination.hasNextPage && !loadingStandard) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    {loadingStandard ? 'Loading...' : 'Next'}
                  </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="campaigns-modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="campaigns-modal-content order-details-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="campaigns-modal-header">
              <h3 className="campaigns-modal-title">Order Details</h3>
              <button 
                className="campaigns-modal-close"
                onClick={() => setShowOrderDetails(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {loadingOrderDetails ? (
              <div className="order-details-loading">
                <Loading size="medium" text="Loading order details..." />
              </div>
            ) : selectedOrder && (
              <div className="campaigns-modal-body">
                {/* Customer Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Customer Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Name</span>
                      <span className="campaigns-info-value">
                        {selectedOrder.customer?.displayName || 
                         `${selectedOrder.customer?.firstName || ''} ${selectedOrder.customer?.lastName || ''}`.trim() || 
                         selectedOrder.customer?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Phone</span>
                      <span className="campaigns-info-value">{selectedOrder.customer?.phone || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Email</span>
                      <span className="campaigns-info-value">{selectedOrder.customer?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="campaigns-info-divider"></div>

                {/* Order Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Order Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Order Number</span>
                      <span className="campaigns-info-value">#{selectedOrder.name || (selectedOrder.id && typeof selectedOrder.id === 'string' ? selectedOrder.id.split('/').pop() : selectedOrder.id) || selectedOrder.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Amount</span>
                      <span className="campaigns-info-value">
                        {selectedOrder.totalPrice && selectedOrder.currencyCode
                          ? `${selectedOrder.currencyCode} ${parseFloat(selectedOrder.totalPrice).toFixed(2)}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Date</span>
                      <span className="campaigns-info-value">{formatISTDateTime(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Payment Status</span>
                      <span className="campaigns-info-value">{selectedOrder.displayFinancialStatus || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Fulfillment Status</span>
                      <span className="campaigns-info-value">{selectedOrder.displayFulfillmentStatus || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {orderCalls.length > 0 && (
                  <>
                    <div className="campaigns-info-divider"></div>

                    {/* Call History Section */}
                    <div className="campaigns-info-section">
                      <h4 className="campaigns-info-section-title">Call History ({orderCalls.length} {orderCalls.length === 1 ? 'call' : 'calls'})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orderCalls.map((call, index) => (
                          <div key={call.id || index} style={{ 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px', 
                            padding: '16px',
                            background: '#f9fafb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                  Call #{index + 1}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <span>{formatISTDateTime(call.createdAt || call.startedAt)}</span>
                                  <span>•</span>
                                  <span>Duration: {call.callDuration ? call.callDuration + 's' : 'N/A'}</span>
                                </div>
                              </div>
                              <span 
                                className="campaigns-status-badge"
                                style={{ 
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  fontSize: '12px'
                                }}
                              >
                                {call.callStatus || 'Unknown'}
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: '12px' }}>
                              {call.callOutcomeCategory && (
                                <div className="campaigns-info-row">
                                  <span className="campaigns-info-label">Outcome</span>
                                  <span className="campaigns-info-value">{call.callOutcomeCategory}</span>
                                </div>
                              )}
                              {call.callInterestScore && (
                                <div className="campaigns-info-row">
                                  <span className="campaigns-info-label">Interest Score</span>
                                  <span className="campaigns-info-value campaigns-info-value-emphasis">{call.callInterestScore}</span>
                                </div>
                              )}
                              {call.newAddress && (
                                <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                                  <span className="campaigns-info-label">New Address</span>
                                  <span className="campaigns-info-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {call.newAddress}
                                  </span>
                                </div>
                              )}
                            </div>

                            {call.audioUrl && call.audioUrl.startsWith('https://') && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '8px' }}>Audio</span>
                                <audio controls style={{ width: '100%', height: '32px', marginBottom: '8px' }}>
                                  <source src={call.audioUrl} type="audio/mpeg" />
                                </audio>
                              </div>
                            )}
                            
                            {call.transcript && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '12px' }}>Transcript</span>
                                <div style={{ 
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  padding: '8px',
                                  background: '#f9fafb',
                                  borderRadius: '8px'
                                }}>
                                  {parseTranscript(call.transcript).map((msg, msgIndex) => (
                                    <div
                                      key={msgIndex}
                                      style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: '8px'
                                      }}
                                    >
                                      <div
                                        style={{
                                          maxWidth: '75%',
                                          padding: '10px 14px',
                                          borderRadius: '12px',
                                          fontSize: '13px',
                                          lineHeight: '1.5',
                                          wordBreak: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          background: msg.role === 'user' ? '#4B5CFF' : '#ffffff',
                                          color: msg.role === 'user' ? '#ffffff' : '#111827',
                                          border: msg.role === 'agent' ? '1px solid #e5e7eb' : 'none',
                                          boxShadow: msg.role === 'agent' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                      >
                                        {msg.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {call.callSummary && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '8px' }}>Summary</span>
                                <div style={{ 
                                  padding: '12px', 
                                  background: 'white', 
                                  borderRadius: '6px', 
                                  fontSize: '13px', 
                                  lineHeight: '1.6',
                                  color: '#374151',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {call.callSummary}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {orderCalls.length === 0 && (
                  <>
                    <div className="campaigns-info-divider"></div>
                    <div className="campaigns-info-section">
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <p style={{ margin: 0 }}>No calls made for this order yet.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="campaigns-modal-footer">
              <button 
                className="campaigns-btn-unified campaigns-btn-primary-unified"
                onClick={() => setShowOrderDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Clip Modal */}
      {showCreateClipModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>Create Clip</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Clip Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={clipName}
                onChange={(e) => setClipName(e.target.value)}
                placeholder="Enter clip name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Description (Optional)
              </label>
              <textarea
                value={clipDescription}
                onChange={(e) => setClipDescription(e.target.value)}
                placeholder="Enter clip description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
              Selected orders: {selectedOrders.size + selectedStandardOrders.size}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateClipModal(false);
                  setClipName('');
                  setClipDescription('');
                }}
                className="btn btn-secondary btn-sm"
                disabled={creatingClip}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClip}
                className="btn btn-primary btn-sm"
                disabled={creatingClip || !clipName.trim()}
              >
                {creatingClip ? 'Creating...' : 'Create Clip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTestShop && (
        <div className="blur-overlay">
          <div className="overlay-content">
            <h2>Connect Your Shopify Store</h2>
            <p>Connect your store to unlock full dashboard features and view real order data.</p>
            <button
              className="connect-btn"
              onClick={() => window.location.href = `/integrations${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`}
            >
              Connect to Shopify
            </button>
          </div>
        </div>
      )}

      {/* Tagging Modal */}
      {showTagModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }} onClick={() => setShowTagModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                Tag Orders - {selectedOrders.size + selectedStandardOrders.size} Selected
              </h3>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setSelectedTag('');
                  setNewTagInput('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>Select an existing tag or enter a new one:</p>
            
            {/* Existing Tags */}
            {customTags.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
                  Your Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {customTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setNewTagInput('');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: selectedTag === tag ? '2px solid #4B5CFF' : '1px solid #e5e7eb',
                        background: selectedTag === tag ? '#f0f4ff' : '#ffffff',
                        color: selectedTag === tag ? '#4B5CFF' : '#111827',
                        fontSize: '13px',
                        fontWeight: selectedTag === tag ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* New Tag Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
                {customTags.length > 0 ? 'Or Enter New Tag' : 'Enter Tag Name'}
              </label>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => {
                  setNewTagInput(e.target.value);
                  setSelectedTag('');
                }}
                placeholder="Enter tag name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (newTagInput.trim() || selectedTag)) {
                    handleTagOrders(newTagInput.trim() || selectedTag);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setSelectedTag('');
                  setNewTagInput('');
                }}
                disabled={tagging}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: tagging ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTagOrders(newTagInput.trim() || selectedTag)}
                disabled={tagging || (!newTagInput.trim() && !selectedTag)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: tagging || (!newTagInput.trim() && !selectedTag) ? '#d1d5db' : '#4B5CFF',
                  color: 'white',
                  cursor: tagging || (!newTagInput.trim() && !selectedTag) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {tagging ? 'Tagging...' : `Tag ${selectedOrders.size + selectedStandardOrders.size} Orders`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard2;
