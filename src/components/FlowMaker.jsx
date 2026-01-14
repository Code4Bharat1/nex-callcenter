import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  general: GeneralNode,
  agent: AgentNode,
  user: UserNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Default address confirmation flow - vertical layout with more spacing
const defaultAddressFlow = {
  nodes: [
    {
      id: 'general-1',
      type: 'general',
      position: { x: 300, y: 50 },
      data: { label: 'General', content: 'Address confirmation flow for COD orders' },
    },
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 300, y: 220 },
      data: { label: 'Agent', content: 'Can you please tell me which city you are located in?' },
    },
    {
      id: 'user-1',
      type: 'user',
      position: { x: 300, y: 390 },
      data: { label: 'User Response', content: 'Only proceed after user has answered their city name' },
    },
    {
      id: 'agent-2',
      type: 'agent',
      position: { x: 300, y: 560 },
      data: { label: 'Agent', content: 'Can you please provide a landmark near your address?' },
    },
    {
      id: 'user-2',
      type: 'user',
      position: { x: 300, y: 730 },
      data: { label: 'User Response', content: 'When user answers anything proceed' },
    },
    {
      id: 'agent-3',
      type: 'agent',
      position: { x: 300, y: 900 },
      data: { label: 'Agent', content: 'Can you please provide your house number or building name?' },
    },
    {
      id: 'user-3',
      type: 'user',
      position: { x: 300, y: 1070 },
      data: { label: 'User Response', content: 'When user answers anything proceed' },
    },
  ],
  edges: [
    { id: 'e1', source: 'agent-1', target: 'user-1', type: 'custom', animated: true },
    { id: 'e2', source: 'user-1', target: 'agent-2', type: 'custom', animated: true },
    { id: 'e3', source: 'agent-2', target: 'user-2', type: 'custom', animated: true },
    { id: 'e4', source: 'user-2', target: 'agent-3', type: 'custom', animated: true },
    { id: 'e5', source: 'agent-3', target: 'user-3', type: 'custom', animated: true },
  ],
  nodeIdCounter: 8,
};

const initialNodes = [
  {
    id: 'general-1',
    type: 'general',
    position: { x: 250, y: 50 },
    data: { label: 'General', content: '' },
  },
];

const initialEdges = [];

// Custom Edge with delete button
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 2, stroke: '#60a5fa' }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
        >
          {(selected || showDelete) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Trigger edge deletion
                const event = new CustomEvent('deleteEdge', { detail: { edgeId: id } });
                window.dispatchEvent(event);
              }}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1000,
              }}
              title="Delete edge"
            >
              ×
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function GeneralNode({ data, selected }) {
  const [content, setContent] = useState(data.content || '');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('[GeneralNode] Data content changed:', { nodeId: data.id, contentLength: data.content?.length || 0, content: data.content?.substring(0, 50) });
    setContent(data.content || '');
  }, [data.content, data.id]);

  useEffect(() => {
    if (textareaRef.current && containerRef.current) {
      // Temporarily set to measure actual content width without wrapping
      const originalWhiteSpace = textareaRef.current.style.whiteSpace;
      const originalWordWrap = textareaRef.current.style.wordWrap;
      
      // Apply temp styles to measure actual width
      textareaRef.current.style.whiteSpace = 'nowrap';
      textareaRef.current.style.wordWrap = 'normal';
      textareaRef.current.style.width = 'auto';
      
      // Measure the actual width needed
      const scrollWidth = textareaRef.current.scrollWidth;
      const minWidth = 280;
      const maxWidth = 1120; // 4x original (280 * 4)
      const newWidth = Math.min(Math.max(scrollWidth + 24, minWidth), maxWidth);
      
      // Restore wrapping styles and set calculated width
      textareaRef.current.style.width = `${newWidth}px`;
      textareaRef.current.style.whiteSpace = originalWhiteSpace || 'pre-wrap';
      textareaRef.current.style.wordWrap = originalWordWrap || 'break-word';
      
      // Update container width to match
      containerRef.current.style.width = `${newWidth + 36}px`; // padding + border
      
      // Auto-resize height
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 300;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    console.log('[GeneralNode] Content changed:', { nodeId: data.id, newContentLength: newContent.length, preview: newContent.substring(0, 50) });
    setContent(newContent);
    if (data.onContentChange) {
      console.log('[GeneralNode] Calling onContentChange callback');
      data.onContentChange(data.id, newContent);
    } else {
      console.warn('[GeneralNode] No onContentChange callback available!', { nodeId: data.id });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: '18px',
        background: '#2d3748',
        color: 'white',
        borderRadius: '10px',
        width: 'fit-content',
        minWidth: '280px',
        maxWidth: '1120px',
        boxShadow: selected 
          ? '0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px #8b5cf6' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        border: '2px solid #8b5cf6',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '12px', 
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#a0aec0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#8b5cf6',
        }} />
        General Instructions
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="General instructions or context..."
        style={{
          width: '280px',
          minWidth: '280px',
          maxWidth: '1120px',
          minHeight: '80px',
          maxHeight: '300px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #4a5568',
          background: '#1a202c',
          color: '#e2e8f0',
          fontSize: '13px',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          overflowY: 'auto',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        onFocus={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function AgentNode({ data, selected }) {
  const [content, setContent] = useState(data.content || '');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('[AgentNode] Data content changed:', { nodeId: data.id, contentLength: data.content?.length || 0, content: data.content?.substring(0, 50) });
    setContent(data.content || '');
  }, [data.content, data.id]);

  useEffect(() => {
    if (textareaRef.current && containerRef.current) {
      // Temporarily set to measure actual content width without wrapping
      const originalWhiteSpace = textareaRef.current.style.whiteSpace;
      const originalWordWrap = textareaRef.current.style.wordWrap;
      
      // Apply temp styles to measure actual width
      textareaRef.current.style.whiteSpace = 'nowrap';
      textareaRef.current.style.wordWrap = 'normal';
      textareaRef.current.style.width = 'auto';
      
      // Measure the actual width needed
      const scrollWidth = textareaRef.current.scrollWidth;
      const minWidth = 280;
      const maxWidth = 1120; // 4x original (280 * 4)
      const newWidth = Math.min(Math.max(scrollWidth + 24, minWidth), maxWidth);
      
      // Restore wrapping styles and set calculated width
      textareaRef.current.style.width = `${newWidth}px`;
      textareaRef.current.style.whiteSpace = originalWhiteSpace || 'pre-wrap';
      textareaRef.current.style.wordWrap = originalWordWrap || 'break-word';
      
      // Update container width to match
      containerRef.current.style.width = `${newWidth + 36}px`; // padding + border
      
      // Auto-resize height
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 300;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    console.log('[AgentNode] Content changed:', { nodeId: data.id, newContentLength: newContent.length, preview: newContent.substring(0, 50) });
    setContent(newContent);
    if (data.onContentChange) {
      console.log('[AgentNode] Calling onContentChange callback');
      data.onContentChange(data.id, newContent);
    } else {
      console.warn('[AgentNode] No onContentChange callback available!', { nodeId: data.id });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: '18px',
        background: '#2d3748',
        color: 'white',
        borderRadius: '10px',
        width: 'fit-content',
        minWidth: '280px',
        maxWidth: '1120px',
        boxShadow: selected 
          ? '0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px #3b82f6' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        border: '2px solid #3b82f6',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '12px', 
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#a0aec0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        Agent
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="What the agent says..."
        style={{
          width: '280px',
          minWidth: '280px',
          maxWidth: '1120px',
          minHeight: '80px',
          maxHeight: '300px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #4a5568',
          background: '#1a202c',
          color: '#e2e8f0',
          fontSize: '13px',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          overflowY: 'auto',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        onFocus={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function UserNode({ data, selected }) {
  const [content, setContent] = useState(data.content || '');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('[UserNode] Data content changed:', { nodeId: data.id, contentLength: data.content?.length || 0, content: data.content?.substring(0, 50) });
    setContent(data.content || '');
  }, [data.content, data.id]);

  useEffect(() => {
    if (textareaRef.current && containerRef.current) {
      // Temporarily set to measure actual content width without wrapping
      const originalWhiteSpace = textareaRef.current.style.whiteSpace;
      const originalWordWrap = textareaRef.current.style.wordWrap;
      
      // Apply temp styles to measure actual width
      textareaRef.current.style.whiteSpace = 'nowrap';
      textareaRef.current.style.wordWrap = 'normal';
      textareaRef.current.style.width = 'auto';
      
      // Measure the actual width needed
      const scrollWidth = textareaRef.current.scrollWidth;
      const minWidth = 280;
      const maxWidth = 1120; // 4x original (280 * 4)
      const newWidth = Math.min(Math.max(scrollWidth + 24, minWidth), maxWidth);
      
      // Restore wrapping styles and set calculated width
      textareaRef.current.style.width = `${newWidth}px`;
      textareaRef.current.style.whiteSpace = originalWhiteSpace || 'pre-wrap';
      textareaRef.current.style.wordWrap = originalWordWrap || 'break-word';
      
      // Update container width to match
      containerRef.current.style.width = `${newWidth + 36}px`; // padding + border
      
      // Auto-resize height
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 300;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    console.log('[UserNode] Content changed:', { nodeId: data.id, newContentLength: newContent.length, preview: newContent.substring(0, 50) });
    setContent(newContent);
    if (data.onContentChange) {
      console.log('[UserNode] Calling onContentChange callback');
      data.onContentChange(data.id, newContent);
    } else {
      console.warn('[UserNode] No onContentChange callback available!', { nodeId: data.id });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: '18px',
        background: '#2d3748',
        color: 'white',
        borderRadius: '10px',
        width: 'fit-content',
        minWidth: '280px',
        maxWidth: '1120px',
        boxShadow: selected 
          ? '0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px #f59e0b' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        border: '2px solid #f59e0b',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#f59e0b', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#f59e0b', width: '10px', height: '10px', border: '2px solid #2d3748' }} />
      
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '12px', 
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#a0aec0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        User Response
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Expected user response or condition..."
        style={{
          width: '280px',
          minWidth: '280px',
          maxWidth: '1120px',
          minHeight: '80px',
          maxHeight: '300px',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #4a5568',
          background: '#1a202c',
          color: '#e2e8f0',
          fontSize: '13px',
          resize: 'none',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          overflowY: 'auto',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        onFocus={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function FlowMaker({ initialFlowData, onSave, onClose }) {
  // Determine if we should use default flow (when initialFlowData is explicitly null/undefined or empty)
  const shouldUseDefault = !initialFlowData || 
    (initialFlowData && (!initialFlowData.nodes || initialFlowData.nodes.length === 0));
  
  const initialNodesData = shouldUseDefault 
    ? defaultAddressFlow.nodes 
    : (initialFlowData?.nodes || initialNodes);
  
  const initialEdgesData = shouldUseDefault 
    ? defaultAddressFlow.edges 
    : (initialFlowData?.edges || initialEdges);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);
  const [nodeIdCounter, setNodeIdCounter] = useState(
    shouldUseDefault 
      ? defaultAddressFlow.nodeIdCounter 
      : (initialFlowData?.nodeIdCounter || initialNodesData.length + 1)
  );

  const handleNodeContentChange = useCallback((nodeId, content) => {
    console.log('[FlowMaker] Node content changed:', { nodeId, contentLength: content?.length, contentPreview: content?.substring(0, 50) });
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updated = { ...node, data: { ...node.data, content } };
          console.log('[FlowMaker] Updated node:', { id: updated.id, contentLength: updated.data.content?.length });
          return updated;
        }
        return node;
      })
    );
    setHasChanges(true);
  }, [setNodes]);

  // Handle edge deletion via custom event
  useEffect(() => {
    const handleDeleteEdge = (event) => {
      const { edgeId } = event.detail;
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setHasChanges(true);
    };

    window.addEventListener('deleteEdge', handleDeleteEdge);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge);
    };
  }, [setEdges]);

  // Ensure nodes have handlers when loaded and edges are properly initialized
  useEffect(() => {
    console.log('[FlowMaker] Initializing nodes with handlers, initial nodes:', initialNodesData.map(n => ({
      id: n.id,
      type: n.type,
      contentLength: n.data?.content?.length || 0,
      content: n.data?.content || ''
    })));
    // Update nodes with handlers, preserving all existing data including content
    setNodes((nds) => {
      const updated = nds.map((node) => {
        const preserved = {
        ...node,
        data: {
          ...node.data,
            content: node.data.content || '', // Ensure content is preserved
          onContentChange: handleNodeContentChange,
        },
        };
        console.log('[FlowMaker] Preserving node content:', { id: preserved.id, contentLength: preserved.data.content?.length, content: preserved.data.content?.substring(0, 50) });
        return preserved;
      });
      console.log('[FlowMaker] Nodes after initialization:', updated.length, 'nodes with content preserved');
      return updated;
    });
    
    // Ensure edges are properly set with all required properties
    if (initialEdgesData && initialEdgesData.length > 0) {
      const formattedEdges = initialEdgesData.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'custom',
        animated: edge.animated !== false,
        style: { strokeWidth: 2, stroke: '#60a5fa' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60a5fa',
        },
      }));
      setEdges(formattedEdges);
    }
  }, [handleNodeContentChange, setNodes, setEdges]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't delete if user is editing text in a textarea
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        return; // Let the textarea handle the key
      }
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);
        
        if (selectedEdges.length > 0) {
          event.preventDefault();
          setEdges((eds) => eds.filter((e) => !selectedEdges.find((se) => se.id === e.id)));
          setHasChanges(true);
        } else if (selectedNodes.length > 0) {
          event.preventDefault();
          const nodeIds = selectedNodes.map((n) => n.id);
          setNodes((nds) => nds.filter((n) => !nodeIds.includes(n.id)));
          setEdges((eds) =>
            eds.filter((e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target))
          );
          setHasChanges(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, edges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        if (
          (sourceNode.type === 'agent' && targetNode.type === 'user') ||
          (sourceNode.type === 'user' && targetNode.type === 'agent')
        ) {
          const newEdge = {
            ...params,
            id: `edge-${Date.now()}`,
            type: 'custom',
            animated: true,
            style: { strokeWidth: 2, stroke: '#60a5fa' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#60a5fa',
            },
          };
          setEdges((eds) => addEdge(newEdge, eds));
          setHasChanges(true);
        }
      }
    },
    [nodes, setEdges]
  );

  const onEdgesDelete = useCallback((deletedEdges) => {
    setEdges((eds) => eds.filter((e) => !deletedEdges.find((de) => de.id === e.id)));
    setHasChanges(true);
  }, [setEdges]);

  const addNode = useCallback(
    (type) => {
      const newNode = {
        id: `${type}-${nodeIdCounter}`,
        type: type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: type === 'general' ? 'General' : type === 'agent' ? 'Agent' : 'User Response',
          content: '',
          onContentChange: handleNodeContentChange,
        },
      };
      console.log('[FlowMaker] Adding new node:', { id: newNode.id, type: newNode.type, hasContent: !!newNode.data.content });
      setNodes((nds) => {
        const updated = [...nds, newNode];
        console.log('[FlowMaker] Nodes after adding:', updated.length, 'nodes');
        return updated;
      });
      setNodeIdCounter((prev) => prev + 1);
      setHasChanges(true);
    },
    [nodeIdCounter, setNodes, handleNodeContentChange]
  );

  const deleteNode = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length > 0) {
      const nodeIds = selectedNodes.map((n) => n.id);
      setNodes((nds) => nds.filter((n) => !nodeIds.includes(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target))
      );
      setHasChanges(true);
    }
  }, [nodes, setNodes, setEdges]);

  const convertFlowToText = useCallback(() => {
    // Extract general instructions first
    const generalNodes = nodes.filter((n) => n.type === 'general');
    const generalText = generalNodes
      .map((n) => n.data.content)
      .filter((c) => c && c.trim())
      .join('\n\n');

    // Build node and edge maps
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const incomingEdges = new Map();
    const outgoingEdges = new Map();

    edges.forEach((edge) => {
      if (!incomingEdges.has(edge.target)) {
        incomingEdges.set(edge.target, []);
      }
      incomingEdges.get(edge.target).push(edge.source);

      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source).push(edge.target);
    });

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(
      (n) => n.type !== 'general' && (!incomingEdges.has(n.id) || incomingEdges.get(n.id).length === 0)
    );

    const result = [];
    const visited = new Set();

    // LLM-optimized traversal: natural conversation flow
    const traverse = (nodeId, depth = 0, isBranch = false) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node || node.type === 'general') return;

      const content = node.data.content?.trim();
      if (!content) {
        // Skip empty nodes but continue traversal
        const connected = outgoingEdges.get(nodeId) || [];
        connected.forEach((targetId) => {
          if (!visited.has(targetId)) {
            traverse(targetId, depth, isBranch);
          }
        });
        return;
      }

      // Format for LLM understanding
      if (node.type === 'agent') {
        // Agent speaks - this is what the AI should say
        result.push(`**AGENT SAYS:** ${content}`);
      } else if (node.type === 'user') {
        // User response condition - this is what to expect/check for
        result.push(`**WHEN USER:** ${content}`);
      }

      const connected = outgoingEdges.get(nodeId) || [];
      
      // Handle branching for LLM decision-making
      if (connected.length > 1) {
        if (node.type === 'user') {
          // User node with multiple agent responses = decision point
          result.push(`\n**THEN PROCEED BASED ON USER RESPONSE:**\n`);
          connected.forEach((targetId, index) => {
            const targetNode = nodeMap.get(targetId);
            if (targetNode && !visited.has(targetId)) {
              if (index > 0) {
                result.push(`\n--- OR IF DIFFERENT RESPONSE ---\n`);
              }
              traverse(targetId, depth + 1, true);
            }
          });
        } else if (node.type === 'agent') {
          // Agent with multiple user responses = multiple possible user reactions
          result.push(`\n**USER MAY RESPOND IN THESE WAYS:**\n`);
          connected.forEach((targetId, index) => {
            const targetNode = nodeMap.get(targetId);
            if (targetNode && targetNode.type === 'user' && !visited.has(targetId)) {
              if (index > 0) {
                result.push(`\n--- OR ---\n`);
              }
              traverse(targetId, depth + 1, true);
            }
          });
        }
      } else if (connected.length === 1) {
        // Single path - continue naturally
        const targetId = connected[0];
        if (!visited.has(targetId)) {
          traverse(targetId, depth, isBranch);
        }
      }
    };

    // Start traversal from all root nodes
    rootNodes.forEach((node) => {
      if (result.length > 0) {
        result.push('\n--- NEXT CONVERSATION PATH ---\n');
      }
      traverse(node.id);
    });

    // Combine general instructions with flow
    const flowText = result.join('\n\n');
    
    // Format for LLM: Clear structure with instructions
    let finalText = '';
    if (generalText) {
      finalText += `## CONVERSATION CONTEXT\n${generalText}\n\n`;
    }
    finalText += `## CONVERSATION FLOW\n\n${flowText}`;
    
    return finalText;
  }, [nodes, edges]);

  const handleSave = useCallback(() => {
    // Log all nodes before saving to debug
    console.log('[FlowMaker] All nodes before save:', nodes.map(n => ({
      id: n.id,
      type: n.type,
      contentLength: n.data.content?.length || 0,
      content: n.data.content || '',
      hasContent: !!n.data.content
    })));
    
    // Ensure we save the current content from all nodes
    const flowData = {
      nodes: nodes.map((n) => {
        const nodeData = {
        id: n.id,
        type: n.type,
        position: n.position,
          data: { 
            content: n.data.content || '', // Ensure content is always included, even if empty
            label: n.data.label || (n.type === 'general' ? 'General' : n.type === 'agent' ? 'Agent' : 'User Response'),
          },
        };
        console.log('[FlowMaker] Saving node:', { id: nodeData.id, contentLength: nodeData.data.content?.length, content: nodeData.data.content?.substring(0, 50) });
        return nodeData;
      }),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type || 'custom',
        animated: e.animated !== false,
      })),
      nodeIdCounter,
    };

    const textContent = convertFlowToText();
    console.log('[FlowMaker] Saving flow data:', {
      nodeCount: flowData.nodes.length,
      nodesWithContent: flowData.nodes.filter(n => n.data.content && n.data.content.trim()).length,
      textContentLength: textContent.length,
      flowDataPreview: JSON.stringify(flowData).substring(0, 500),
      textContentPreview: textContent.substring(0, 200)
    });
    onSave(flowData, textContent);
    setHasChanges(false);
  }, [nodes, edges, nodeIdCounter, convertFlowToText, onSave]);

  const handleDiscard = useCallback(() => {
    if (hasChanges && window.confirm('Discard all changes? This cannot be undone.')) {
      onClose();
    } else if (!hasChanges) {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Update node data with onContentChange handler
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onContentChange: handleNodeContentChange,
      },
    }));
  }, [nodes, handleNodeContentChange]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#1f2937',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          background: '#111827',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '600' }}>
          Flow Maker
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {hasChanges && (
            <span style={{ color: '#f59e0b', fontSize: '14px', marginRight: '8px' }}>
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              padding: '8px 16px',
              background: hasChanges ? '#4B5CFF' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            Save Changes
          </button>
          <button
            onClick={handleDiscard}
            style={{
              padding: '8px 16px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {hasChanges ? 'Discard Changes' : 'Close'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: '12px 24px',
          background: '#111827',
          borderBottom: '1px solid #374151',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => addNode('general')}
          style={{
            padding: '6px 12px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + General
        </button>
        <button
          onClick={() => addNode('agent')}
          style={{
            padding: '6px 12px',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + Agent
        </button>
        <button
          onClick={() => addNode('user')}
          style={{
            padding: '6px 12px',
            background: '#d97706',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + User
        </button>
        <button
          onClick={deleteNode}
          style={{
            padding: '6px 12px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Delete Selected
        </button>
        <div style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '13px' }}>
          💡 Click edge to see delete button • Press Delete key to remove selected
        </div>
      </div>

      {/* Flow Canvas */}
      <div style={{ flex: 1, background: '#1f2937' }}>
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          style={{ background: '#1f2937' }}
          connectionLineStyle={{ stroke: '#60a5fa', strokeWidth: 2 }}
          defaultEdgeOptions={{
            type: 'custom',
            animated: true,
            style: { strokeWidth: 2, stroke: '#60a5fa' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#60a5fa',
            },
          }}
        >
          <Background color="#374151" gap={16} />
          <Controls style={{ background: '#111827', border: '1px solid #374151' }} />
          <MiniMap
            style={{ background: '#111827', border: '1px solid #374151' }}
            nodeColor={(node) => {
              if (node.type === 'general') return '#6366f1';
              if (node.type === 'agent') return '#3b82f6';
              if (node.type === 'user') return '#d97706';
              return '#6b7280';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
