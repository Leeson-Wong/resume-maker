import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Resume } from './components/Resume';
import { ResumeEditor } from './components/ResumeEditor';
import { Toolbar } from './components/Toolbar';
import { AuthPage } from './components/AuthPage';
import type { ResumeData, ThemeType } from './types/resume';

function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeType>('modern');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [livePreview, setLivePreview] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<ResumeData | null>(null);
  const [saving, setSaving] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/check')
      .then((res) => res.json())
      .then((d) => { if (d.authenticated) setAuthenticated(true); })
      .catch(() => {});
  }, []);

  // Load resume data when authenticated
  const loadResume = useCallback(async () => {
    try {
      const res = await fetch('/api/resume');
      if (res.ok) {
        setData(await res.json());
      } else {
        setAuthenticated(false);
      }
    } catch {
      // Server not reachable, use empty default
      setData({
        personal: { name: '', title: '', email: '', summary: '' },
        experience: [], education: [], projects: [], skills: [],
      });
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadResume();
  }, [authenticated, loadResume]);

  // Save to server
  const saveToServer = async (newData: ResumeData) => {
    setData(newData);
    setSaving(true);
    try {
      const res = await fetch('/api/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Save failed: ${err.error}`);
      }
    } catch {
      alert('Save failed: Network error');
    } finally {
      setSaving(false);
    }
  };

  // Auth gate
  if (!authenticated) {
    return <AuthPage onAuth={() => setAuthenticated(true)} />;
  }

  // Loading
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  // Export JSON (local file download, not server save)
  const handleExport = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-${data.personal.name || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON (load into editor, then save to server)
  const handleImport = (importedData: ResumeData) => {
    saveToServer(importedData);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toolbar
        theme={theme}
        onThemeChange={setTheme}
        mode={mode}
        onModeChange={setMode}
        onExport={handleExport}
        onImport={handleImport}
        livePreview={livePreview}
        onLivePreviewChange={setLivePreview}
        saving={saving}
        onSave={() => saveToServer(data)}
      />
      <div className="pt-14 sm:pt-16 pb-20 sm:pb-8">
        {mode === 'edit' ? (
          livePreview ? (
            <div className="flex gap-4 max-w-[1600px] mx-auto px-2 sm:px-4">
              <div className="flex-1 min-w-0">
                <ResumeEditor data={data} onChange={(d) => saveToServer(d)} />
              </div>
              <div className="live-preview-panel flex-1 min-w-0 hidden lg:block">
                <div className="sticky top-20">
                  <Resume data={data} theme={theme} />
                </div>
              </div>
            </div>
          ) : (
            <ResumeEditor data={data} onChange={(d) => saveToServer(d)} />
          )
        ) : (
          <div className="px-2 sm:px-4">
            <Resume data={data} theme={theme} />
          </div>
        )}
      </div>
      {mode === 'edit' && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto no-print">
          <button
            onClick={() => setMode('preview')}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center sm:justify-start gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('toolbar.previewResume')}
          </button>
        </div>
      )}
      {mode === 'preview' && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto no-print">
          <button
            onClick={() => setMode('edit')}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-all flex items-center justify-center sm:justify-start gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('toolbar.continueEdit')}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
