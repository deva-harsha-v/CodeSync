import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../../types';
import {
  IconSearch,
  IconCode,
  IconFlask,
  IconSparkles,
  IconRefreshCw,
  IconGitCommit,
  IconUser,
  IconFile,
  IconPanelRight,
  IconTerminal,
  IconClipboardList,
  IconX
} from './Icons';

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Files' | 'Navigation' | 'View';
  icon: React.ReactNode;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (file: ProjectFile) => void;
  onSaveAndAnalyze: () => void;
  onRunTests: () => void;
  onReindexGraph: () => void;
  onAskAI: () => void;
  onGitCommit: () => void;
  onToggleRightDock: () => void;
  onToggleConsole: () => void;
  onOpenPersonaModal: () => void;
  onSwitchSidebarTab: (tab: any) => void;
  onOpenOverview?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onSaveAndAnalyze,
  onRunTests,
  onReindexGraph,
  onAskAI,
  onGitCommit,
  onToggleRightDock,
  onToggleConsole,
  onOpenPersonaModal,
  onSwitchSidebarTab,
  onOpenOverview
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const standardCommands: CommandItem[] = [
    {
      id: 'save_analyze',
      title: 'Save & Analyze Current File',
      category: 'Actions',
      shortcut: 'Ctrl+S',
      icon: <IconCode size={15} color="var(--color-primary)" />,
      run: () => onSaveAndAnalyze()
    },
    {
      id: 'run_tests',
      title: 'Run Relevant Dependency-Guided Tests',
      category: 'Actions',
      shortcut: 'Ctrl+Enter',
      icon: <IconFlask size={15} color="var(--color-success)" />,
      run: () => onRunTests()
    },
    {
      id: 'ask_ai',
      title: 'Ask Contextual AI Copilot for Diagnosis',
      category: 'Actions',
      icon: <IconSparkles size={15} color="var(--color-ai)" />,
      run: () => onAskAI()
    },
    {
      id: 'reindex_ast',
      title: 'Re-Index TypeScript Compiler AST Graph',
      category: 'Actions',
      icon: <IconRefreshCw size={15} />,
      run: () => onReindexGraph()
    },
    {
      id: 'git_commit',
      title: 'Create Verified Git Commit',
      category: 'Actions',
      icon: <IconGitCommit size={15} color="var(--color-warning)" />,
      run: () => onGitCommit()
    },
    {
      id: 'toggle_intelligence',
      title: 'Toggle Right Intelligence Dock',
      category: 'View',
      shortcut: 'Ctrl+Shift+I',
      icon: <IconPanelRight size={15} />,
      run: () => onToggleRightDock()
    },
    {
      id: 'toggle_console',
      title: 'Toggle Bottom Console & Test Runner Dock',
      category: 'View',
      shortcut: 'Ctrl+`',
      icon: <IconTerminal size={15} />,
      run: () => onToggleConsole()
    },
    {
      id: 'switch_persona',
      title: 'Switch Active Persona / Role (Admin, Dev A, Dev B, Reviewer)',
      category: 'Navigation',
      icon: <IconUser size={15} />,
      run: () => onOpenPersonaModal()
    },
    {
      id: 'view_traceability',
      title: 'View Requirements Traceability Matrix',
      category: 'Navigation',
      icon: <IconClipboardList size={15} />,
      run: () => onSwitchSidebarTab('traceability')
    },
    {
      id: 'view_audit',
      title: 'View Tamper-Resistant Audit Trail',
      category: 'Navigation',
      icon: <IconClipboardList size={15} />,
      run: () => onSwitchSidebarTab('audit')
    }
  ];

  const fileCommands: CommandItem[] = files.map((f) => ({
    id: `file_${f.id}`,
    title: `Open ${f.path}`,
    category: 'Files',
    icon: <IconFile size={15} />,
    run: () => onSelectFile(f)
  }));

  const allItems = [...standardCommands, ...fileCommands];
  const filtered = query.trim()
    ? allItems.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <IconSearch size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command or search files... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-icon" onClick={onClose}>
            <IconX size={15} />
          </button>
        </div>

        <div className="palette-results">
          {filtered.length === 0 ? (
            <div className="palette-empty">No matching commands found.</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`palette-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="palette-item-icon">{item.icon}</div>
                <div className="palette-item-text">
                  <span className="palette-item-title">{item.title}</span>
                  <span className="palette-item-category">{item.category}</span>
                </div>
                {item.shortcut && <kbd className="palette-shortcut">{item.shortcut}</kbd>}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>Use <b>?</b> <b>?</b> to navigate</span>
          <span><b>Enter</b> to select</span>
          <span><b>Esc</b> to close</span>
        </div>
      </div>
    </div>
  );
};
