import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import './ScriptEditor.css';

const ScriptEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const wrapperRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [showPlaceholder, setShowPlaceholder] = useState(
    !value || value.trim() === ''
  );

  // Calculate height from container
  useEffect(() => {
    const calculateHeight = () => {
      if (wrapperRef.current) {
        const height = wrapperRef.current.offsetHeight;
        if (height > 0) {
          setEditorHeight(height);
        }
      }
    };

    calculateHeight();
    const resizeObserver = new ResizeObserver(calculateHeight);
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor with white theme and VS Code features
    monaco.editor.defineTheme('white-theme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#111827',
        'editor.lineHighlightBackground': '#f9fafb',
        'editor.selectionBackground': '#dbeafe',
        'editor.inactiveSelectionBackground': '#f3f4f6',
        'editorCursor.foreground': '#111827',
        'editorWhitespace.foreground': '#e5e7eb',
        'editorIndentGuide.background': '#e5e7eb',
        'editorIndentGuide.activeBackground': '#d1d5db',
        'editorLineNumber.foreground': '#9ca3af',
        'editorLineNumber.activeForeground': '#111827',
        'editorGutter.background': '#ffffff',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e5e7eb',
        'editorSuggestWidget.background': '#ffffff',
        'editorSuggestWidget.border': '#e5e7eb',
        'editorSuggestWidget.selectedBackground': '#f3f4f6',
        'input.background': '#ffffff',
        'input.border': '#e5e7eb',
        'inputOption.activeBorder': '#3b82f6',
      },
    });

    monaco.editor.setTheme('white-theme');

    // Disable all code validation and suggestions (for script editor)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
      validate: false,
    });

    // Configure editor options
    editor.updateOptions({
      minimap: {
        enabled: true,
        side: 'right',
        showSlider: 'always',
      },
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      formatOnPaste: false,
      formatOnType: false,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      fontFamily: "'SF Mono', 'Monaco', 'Menlo', 'Courier New', monospace",
      fontLigatures: false,
      readOnly: false,
      domReadOnly: false,
      // Disable all code suggestions and validation
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      acceptSuggestionOnCommitCharacter: false,
      acceptSuggestionOnEnter: 'off',
      tabCompletion: 'off',
      wordBasedSuggestions: 'off',
      renderValidationDecorations: 'off',
      hover: { enabled: false },
      parameterHints: { enabled: false },
      'semanticHighlighting.enabled': false,
      // Enable find widget (Ctrl+F)
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'always',
      },
    });

    // Ensure editor is focusable and editable
    setTimeout(() => {
      editor.focus();
    }, 100);
  };

  // Sync external value changes
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentValue = editorRef.current.getValue() || '';
      const newValue = value != null ? String(value) : '';

      if (currentValue !== newValue) {
        isUpdatingRef.current = true;
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(newValue);
        
        // Restore cursor position if possible
        if (position) {
          editorRef.current.setPosition(position);
          editorRef.current.revealLineInCenter(position.lineNumber);
        }

        // Update placeholder visibility
        setShowPlaceholder(!newValue || newValue.trim() === '');

        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }
  }, [value]);

  // Handle editor changes
  const handleChange = (newValue) => {
    if (!isUpdatingRef.current && editorRef.current) {
      isUpdatingRef.current = true;
      
      // Update placeholder visibility
      setShowPlaceholder(!newValue || newValue.trim() === '');

      onChange(newValue || '');

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  // Handle editor focus to hide placeholder
  const handleEditorFocus = () => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue() || '';
      setShowPlaceholder(!currentValue || currentValue.trim() === '');
    }
  };

  return (
    <div ref={wrapperRef} className="script-editor-wrapper">
      <Editor
        height={editorHeight}
        language="javascript"
        value={value != null ? String(value) : ''}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        onFocus={handleEditorFocus}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          formatOnPaste: false,
          formatOnType: false,
          tabSize: 2,
          insertSpaces: true,
          theme: 'white-theme',
          readOnly: false,
          domReadOnly: false,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnCommitCharacter: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          wordBasedSuggestions: 'off',
          renderValidationDecorations: 'off',
          hover: { enabled: false },
          parameterHints: { enabled: false },
        }}
        theme="white-theme"
      />
      {showPlaceholder && placeholder && (
        <div className="monaco-placeholder-overlay">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
