import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { ProjectFile, UserProfile } from '../../types';
import {
  IconFile,
  IconX,
  IconLock,
  IconCheck,
  IconSparkles,
  IconGitBranch,
  IconUser
} from '../common/Icons';

interface CollaborativeEditorProps {
  file: ProjectFile | null;
  openFiles?: ProjectFile[];
  activeFileId?: string | null;
  currentUser: UserProfile | null;
  ws: WebSocket | null;
  onSave: (content: string) => Promise<void>;
  onRequestAccess: (file: ProjectFile) => void;
  onSelectFile?: (file: ProjectFile) => void;
  onCloseFileTab?: (fileId: string) => void;
  onCursorChange?: (pos: { line: number; col: number }) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  file,
  openFiles = [],
  activeFileId,
  currentUser,
  ws,
  onSave,
  onRequestAccess,
  onSelectFile,
  onCloseFileTab,
  onCursorChange
}) => {
  const [content, setContent] = useState<string>('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<any>(null);
  const isRemoteChangeRef = useRef(false);

  // Load content when file changes
  useEffect(() => {
    if (!file) return;
    setContent(file.content || '');
    setIsDirty(false);

    // Join WebSocket file room
    if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
      ws.send(
        JSON.stringify({
          type: 'JOIN_FILE',
          fileId: file.id,
          userId: currentUser.id,
          userName: currentUser.full_name,
          userRole: currentUser.role
        })
      );
    }
  }, [file?.id, ws, currentUser?.id]);

  // Handle incoming WebSocket OT messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.fileId !== file?.id) return;

        switch (msg.type) {
          case 'INIT_SNAPSHOT':
            if (msg.content !== undefined) {
              setContent(msg.content);
              setIsDirty(false);
            }
            if (msg.collaborators) {
              setCollaborators(msg.collaborators.filter((c: any) => c.userId !== currentUser?.id));
            }
            break;

          case 'PRESENCE_UPDATE':
            if (msg.collaborators) {
              setCollaborators(msg.collaborators.filter((c: any) => c.userId !== currentUser?.id));
            }
            break;

          case 'OT_BROADCAST':
            if (msg.operation && editorRef.current) {
              isRemoteChangeRef.current = true;
              const model = editorRef.current.getModel();
              if (model) {
                if (msg.operation.type === 'replace') {
                  model.setValue(msg.operation.content);
                } else if (msg.operation.type === 'insert') {
                  const pos = model.getPositionAt(msg.operation.position);
                  model.applyEdits([
                    {
                      range: new (window as any).monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                      text: msg.operation.text
                    }
                  ]);
                } else if (msg.operation.type === 'delete') {
                  const startPos = model.getPositionAt(msg.operation.position);
                  const endPos = model.getPositionAt(msg.operation.position + msg.operation.length);
                  model.applyEdits([
                    {
                      range: new (window as any).monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                      text: ''
                    }
                  ]);
                }
              }
              setContent(editorRef.current.getValue());
              setTimeout(() => {
                isRemoteChangeRef.current = false;
              }, 50);
            }
            break;

          case 'SAVE_SUCCESS':
            setSaving(false);
            setIsDirty(false);
            break;

          case 'SAVE_ERROR':
            setSaving(false);
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
      if (ws.readyState === WebSocket.OPEN && file) {
        ws.send(JSON.stringify({ type: 'LEAVE_FILE', fileId: file.id }));
      }
    };
  }, [ws, file?.id, currentUser?.id]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Intercept edit attempts if restricted
    editor.onKeyDown((e) => {
      if (file && file.canEdit === false && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        onRequestAccess(file);
      }
    });

    // Handle cursor movements
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({ line: e.position.lineNumber, col: e.position.column });
      }
      if (ws && ws.readyState === WebSocket.OPEN && file) {
        ws.send(
          JSON.stringify({
            type: 'CURSOR_MOVE',
            fileId: file.id,
            cursor: { line: e.position.lineNumber, column: e.position.column }
          })
        );
      }
    });

    // Keyboard shortcut Ctrl+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleManualSave();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setContent(val);
    setIsDirty(true);

    if (isRemoteChangeRef.current) return;

    // Broadcast OT operation to peers
    if (ws && ws.readyState === WebSocket.OPEN && file && file.canEdit) {
      ws.send(
        JSON.stringify({
          type: 'OT_OPERATION',
          fileId: file.id,
          operation: {
            type: 'replace',
            content: val
          }
        })
      );
    }
  };

  const handleManualSave = async () => {
    if (!file) return;
    if (file.canEdit === false) {
      onRequestAccess(file);
      return;
    }

    setSaving(true);
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'SAVE_FILE',
            projectId: file.project_id,
            fileId: file.id,
            content
          })
        );
      }
      await onSave(content);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (!file) {
    return (
      <div className="empty-state editor-empty-state">
        <IconFile size={36} color="var(--text-muted)" />
        <div className="empty-state-title">No file open</div>
        <p className="empty-state-desc">Select an artifact from the explorer or use Ctrl+K to jump to a file.</p>
      </div>
    );
  }

  const isReadOnly = file.canEdit === false;

  return (
    <div className="collaborative-editor-wrapper">
      {/* 1. File Tabs Bar */}
      {openFiles.length > 0 && (
        <div className="editor-tabs-bar" role="tablist">
          {openFiles.map((of) => {
            const isActive = of.id === file.id;
            return (
              <div
                key={of.id}
                className={`editor-tab-item ${isActive ? 'active' : ''}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectFile && onSelectFile(of)}
              >
                <IconFile size={13} color={isActive ? 'var(--color-primary)' : 'var(--text-muted)'} />
                <span className="tab-name">{of.name}</span>
                {isActive && isDirty && <span className="tab-dirty-dot" title="Unsaved changes" />}
                {onCloseFileTab && (
                  <button
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFileTab(of.id);
                    }}
                    title="Close tab"
                  >
                    <IconX size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Breadcrumbs & File Status Row */}
      <div className="editor-status-row">
        <div className="status-row-left">
          <span className="file-path-breadcrumb">{file.path}</span>
          <span className="status-badge-saved">
            {isDirty ? (
              <span className="badge-dirty">? Unsaved</span>
            ) : (
              <span className="badge-saved">
                <IconCheck size={11} /> Saved
              </span>
            )}
          </span>
          <span className="file-owner-pill">
            <IconUser size={11} /> {file.owner_name || 'Unassigned'}
          </span>
          <span className="file-branch-pill">
            <IconGitBranch size={11} /> main
          </span>
          <span className="file-lang-pill">{file.language || 'TypeScript'}</span>

          {isReadOnly && (
            <button
              className="badge-locked-action"
              onClick={() => onRequestAccess(file)}
              title="Click to request edit access"
            >
              <IconLock size={11} /> Read-Only (Request Access)
            </button>
          )}
        </div>

        <div className="status-row-right">
          {collaborators.length > 0 && (
            <div className="collaborators-pill-group">
              {collaborators.map((c) => (
                <div
                  key={c.userId}
                  className="editor-collaborator-dot"
                  style={{ backgroundColor: c.color || 'var(--color-primary)' }}
                  title={`${c.userName} (${c.userRole})`}
                >
                  {c.userName.charAt(0)}
                </div>
              ))}
            </div>
          )}

          <button
            className={`btn btn-sm ${isReadOnly ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleManualSave}
            disabled={saving}
            title={isReadOnly ? 'Artifact locked' : 'Save and trigger AST, ML, and test pipeline (Ctrl+S)'}
          >
            {saving ? (
              <>
                <div className="spinner-sm" /> Analyzing...
              </>
            ) : isReadOnly ? (
              <>
                <IconLock size={12} /> Locked
              </>
            ) : (
              <>
                <IconSparkles size={12} /> Save & Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Monaco Editor Canvas */}
      <div className="editor-monaco-canvas">
        <Editor
          height="100%"
          language={file.language || 'typescript'}
          theme="vs-dark"
          value={content}
          options={{
            readOnly: isReadOnly,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on'
          }}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
};
