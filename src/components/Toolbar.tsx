import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeType, ResumeData } from '../types/resume';
import { themes } from '../themes';
import { InviteCodeManager } from './InviteCodeManager';

interface ToolbarProps {
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
  onExport: () => void;
  onImport: (data: ResumeData) => void;
  livePreview: boolean;
  onLivePreviewChange: (enabled: boolean) => void;
  saving?: boolean;
  onSave?: () => void;
}

export function Toolbar({
  theme,
  onThemeChange,
  mode,
  onModeChange,
  onExport,
  onImport,
  livePreview,
  onLivePreviewChange,
  saving,
  onSave
}: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  const printResume = () => {
    window.print();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          onImport(importedData);
          alert(t('messages.importSuccess'));
        } catch {
          alert(t('messages.importError'));
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18n-language', newLang);
  };

  return (
    <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="toolbar-container max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">{t('app.title')}</h1>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* 模式切换 */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1">
            <button
              onClick={() => onModeChange('edit')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm transition-all ${
                mode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('toolbar.edit')}
            </button>
            <button
              onClick={() => onModeChange('preview')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm transition-all ${
                mode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('toolbar.preview')}
            </button>
          </div>

          {/* 语言切换 */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 sm:py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-all"
          >
            {i18n.language === 'zh' ? 'EN' : '中文'}
          </button>

          {/* 实时预览开关 - 仅编辑模式且大屏幕显示 */}
          {mode === 'edit' && (
            <label className="hidden sm:flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">{t('toolbar.livePreview')}</span>
              <button
                onClick={() => onLivePreviewChange(!livePreview)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  livePreview ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    livePreview ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          )}

          {/* 导入/导出按钮 - 仅编辑模式显示 */}
          {mode === 'edit' && (
            <div className="flex items-center gap-1 sm:gap-2">
              {onSave && (
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="p-2 sm:px-3 sm:py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-40 transition-all flex items-center gap-1"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-all flex items-center gap-1"
                title={t('toolbar.import')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden sm:inline">{t('toolbar.import')}</span>
              </button>
              <button
                onClick={onExport}
                className="p-2 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 transition-all flex items-center gap-1"
                title={t('toolbar.export')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">{t('toolbar.export')}</span>
              </button>
              <button
                onClick={() => setShowInvitePanel(!showInvitePanel)}
                className={`p-2 sm:px-3 sm:py-1.5 rounded text-sm transition-all flex items-center gap-1 ${
                  showInvitePanel ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Invite Codes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="hidden sm:inline">Codes</span>
              </button>
            </div>
          )}

          {/* 主题选择 - 仅预览模式显示 */}
          {mode === 'preview' && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">{t('toolbar.theme')}:</span>
              <div className="flex gap-1">
                {Object.values(themes).map((themeConfig) => (
                  <button
                    key={themeConfig.id}
                    onClick={() => onThemeChange(themeConfig.id)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-sm transition-all ${
                      theme === themeConfig.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(themeConfig.label)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 打印/导出按钮 - 仅预览模式显示 */}
          {mode === 'preview' && (
            <button
              onClick={printResume}
              className="p-2 sm:px-4 sm:py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-all flex items-center gap-1 sm:gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">{t('toolbar.printPdf')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Invite Code Panel */}
      {showInvitePanel && mode === 'edit' && (
        <div className="border-t border-gray-200 bg-gray-50 max-w-7xl mx-auto">
          <InviteCodeManager />
        </div>
      )}
    </div>
  );
}
