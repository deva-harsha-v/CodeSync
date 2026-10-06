import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { ProjectFile, UserProfile } from '../../types';

interface CollaborativeEditorProps {
  file: ProjectFile | null;
  currentUser: UserProfile | null;
  ws: WebSocket | null;
  onSave: (content: string) => Promise<void>;
  onRequestAccess: (file: ProjectFile) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  file,
  currentUser,
  ws,
  onSave,
  onRequestAccess
}) => {
  const [content, setContent] = useState<string>('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const isRemoteChangeRef = useRef(false);

  // Load content when file changes
  useEffect(() => {
    if (!file) return;
    setContent(file.content || '');

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
            // Apply peer's operation without re-broadcasting
            if (msg.operation && editorRef.current) {
              isRemoteChangeRef.current = true;
              const model = editorRef.current.getModel();
              if (model) {
                if (msg.operation.type === 'replace') {
                  model.setValue(msg.operation.content);
                } else if (msg.operation.type === 'insert') {
                  const pos = model.getPositionAt(msg.operation.position);
                  model.applyEdits([{ range: new (window as any).monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: msg.operation.text }]);
                } else if (msg.operation.type === 'delete') {
                  const startPos = model.getPositionAt(msg.operation.position);
                  const endPos = model.getPositionAt(msg.operation.position + msg.operation.length);
                  model.applyEdits([{ range: new (window as any).monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column), text: '' }]);
                }
              }
              setContent(editorRef.current.getValue());
              setTimeout(() => { isRemoteChangeRef.current = false; }, 50);
            }
            break;

          case 'SAVE_SUCCESS':
            setSaving(false);
            break;

          case 'SAVE_ERROR':
            setSaving(false);
            alert(`Save error: ${msg.error}`);
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
      } else {
        await onSave(content);
        setSaving(false);
      }
    } catch (err: any) {
      setSaving(false);
      alert(`Save failed: ${err.message}`);
    }
  };

  if (!file) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Select a file from the explorer to begin collaborating
      </div>
    );
  }

  const isReadOnly = file.canEdit === false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="editor-topbar">
        <div className="active-file-title">
          <span>{file.path}</span>
          <span className="owner-badge" style={{ marginLeft: '8px' }}>
            Owner: {file.owner_name || 'Unassigned'}
          </span>
          {isReadOnly && (
            <span
              style={{
                background: 'var(--color-high-bg)',
                color: 'var(--color-high)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              onClick={() => onRequestAccess(file)}
            >
              🔒 Read-Only (Request Access)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="editor-collaborators">
            {collaborators.map((c) => (
              <div
                key={c.userId}
                className="collaborator-pill"
                style={{ backgroundColor: c.color }}
                title={`${c.userName} (${c.userRole})`}
              >
                ● {c.userName.split(' ')[0]}
              </div>
            ))}
          </div>

          <button
            className={`btn btn-sm ${isReadOnly ? '' : 'btn-primary'}`}
            onClick={handleManualSave}
            disabled={saving}
          >
            {saving ? 'Analyzing...' : isReadOnly ? '🔒 Locked' : '💾 Save & Analyze'}
          </button>
        </div>
      </div>

      <div className="editor-container">
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
            renderWhitespace: 'selection'
          }}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
};
