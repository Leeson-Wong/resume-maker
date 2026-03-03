import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Resume } from './components/Resume';
import { ResumeEditor } from './components/ResumeEditor';
import { Toolbar } from './components/Toolbar';
import type { ResumeData, ThemeType } from './types/resume';
import { DEFAULT_SECTION_ORDER } from './types/resume';
import resumeData from './data/resume.json';

const STORAGE_KEY = 'resume-data';

// 数据迁移：确保新模块存在于旧数据中
function migrateData(savedData: ResumeData): ResumeData {
  const migrated = { ...savedData };

  // 确保 sectionOrder 包含所有新模块
  if (migrated.sectionOrder) {
    DEFAULT_SECTION_ORDER.forEach(section => {
      if (!migrated.sectionOrder!.includes(section)) {
        migrated.sectionOrder!.push(section);
      }
    });
  }

  // 确保 sectionVisibility 包含所有新模块
  if (migrated.sectionVisibility) {
    DEFAULT_SECTION_ORDER.forEach(section => {
      if (!(section in migrated.sectionVisibility!)) {
        migrated.sectionVisibility![section] = true;
      }
    });
  }

  // 确保新字段存在
  if (!migrated.certificates) {
    migrated.certificates = [];
  }
  if (!migrated.interests) {
    migrated.interests = [];
  }

  return migrated;
}

function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeType>('modern');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [livePreview, setLivePreview] = useState(false);
  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        return migrateData(parsedData);
      } catch {
        return resumeData as ResumeData;
      }
    }
    return resumeData as ResumeData;
  });

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // 导出 JSON
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

  // 导入 JSON
  const handleImport = (importedData: ResumeData) => {
    setData(importedData);
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
      />
      <div className="pt-14 sm:pt-16 pb-20 sm:pb-8">
        {mode === 'edit' ? (
          livePreview ? (
            <div className="flex gap-4 max-w-[1600px] mx-auto px-2 sm:px-4">
              <div className="flex-1 min-w-0">
                <ResumeEditor data={data} onChange={setData} />
              </div>
              <div className="live-preview-panel flex-1 min-w-0 hidden lg:block">
                <div className="sticky top-20">
                  <Resume data={data} theme={theme} />
                </div>
              </div>
            </div>
          ) : (
            <ResumeEditor data={data} onChange={setData} />
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
