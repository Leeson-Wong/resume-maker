import { useTranslation } from 'react-i18next';
import type { ResumeData, ThemeType, CustomSection } from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../types/resume';
import { themes } from '../themes';

interface ResumeProps {
  data: ResumeData;
  theme: ThemeType;
}

export function Resume({ data, theme }: ResumeProps) {
  const { t } = useTranslation();
  const themeConfig = themes[theme];
  const sectionOrder = data.sectionOrder || DEFAULT_SECTION_ORDER;
  const sectionVisibility = data.sectionVisibility || DEFAULT_SECTION_VISIBILITY;

  const formatDate = (date: string) => {
    const [year, month] = date.split('-');
    const locale = document.documentElement.lang || 'zh';
    if (locale.startsWith('en')) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return `${year}年${month}月`;
  };

  const renderIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <span>📧</span>,
      phone: <span>📱</span>,
      location: <span>📍</span>,
      github: <span>💻</span>,
      linkedin: <span>💼</span>,
      website: <span>🌐</span>,
    };
    return icons[type] || null;
  };

  // 渲染头部信息
  const renderHeader = () => (
    <header className={themeConfig.header}>
      <div className="flex items-center gap-4">
        {data.personal.avatar && (
          <img
            src={data.personal.avatar}
            alt={data.personal.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h1 className={themeConfig.nameText}>{data.personal.name}</h1>
          <p className={themeConfig.title}>{data.personal.title}</p>
        </div>
      </div>
      <div className={themeConfig.contactInfo}>
        {data.personal.email && (
          <span className="flex items-center gap-1">
            {renderIcon('email')} {data.personal.email}
          </span>
        )}
        {data.personal.phone && (
          <span className="flex items-center gap-1">
            {renderIcon('phone')} {data.personal.phone}
          </span>
        )}
        {data.personal.location && (
          <span className="flex items-center gap-1">
            {renderIcon('location')} {data.personal.location}
          </span>
        )}
        {data.personal.github && (
          <span className="flex items-center gap-1">
            {renderIcon('github')} {data.personal.github}
          </span>
        )}
        {data.personal.linkedin && (
          <span className="flex items-center gap-1">
            {renderIcon('linkedin')} {data.personal.linkedin}
          </span>
        )}
      </div>
      {data.personal.summary && (
        <p className="mt-4 text-gray-600 text-sm leading-relaxed">
          {data.personal.summary}
        </p>
      )}
    </header>
  );

  // 渲染工作经历
  const renderExperience = () => {
    if (data.experience.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.experience')}</h2>
        <div className={themeConfig.sectionContent}>
          {data.experience.map((exp, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={themeConfig.itemTitle}>{exp.company}</h3>
                  <p className={themeConfig.itemSubtitle}>{exp.position}</p>
                </div>
                <span className={themeConfig.dateRange}>
                  {formatDate(exp.startDate)} - {exp.current ? t('resume.present') : exp.endDate && formatDate(exp.endDate)}
                </span>
              </div>
              <ul className={themeConfig.highlightList}>
                {exp.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染项目经历
  const renderProjects = () => {
    if (data.projects.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.projects')}</h2>
        <div className={themeConfig.sectionContent}>
          {data.projects.map((project, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={themeConfig.itemTitle}>{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                </div>
                {project.link && (
                  <span className="text-sm text-blue-500">{project.link}</span>
                )}
              </div>
              <div className="flex flex-wrap mt-2">
                {project.technologies.map((tech, i) => (
                  <span key={i} className={themeConfig.skillTag}>{tech}</span>
                ))}
              </div>
              {project.highlights && project.highlights.length > 0 && (
                <ul className={themeConfig.highlightList}>
                  {project.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染教育背景
  const renderEducation = () => {
    if (data.education.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.education')}</h2>
        <div className={themeConfig.sectionContent}>
          {data.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={themeConfig.itemTitle}>{edu.school}</h3>
                  <p className={themeConfig.itemSubtitle}>{edu.degree} - {edu.field}</p>
                </div>
                <span className={themeConfig.dateRange}>
                  {formatDate(edu.startDate)} - {edu.endDate && formatDate(edu.endDate)}
                </span>
              </div>
              {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
              {edu.honors && edu.honors.length > 0 && (
                <p className="text-sm text-gray-500">{t('resume.honors')}: {edu.honors.join('、')}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染技能
  const renderSkills = () => {
    if (data.skills.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.skills')}</h2>
        <div className="space-y-2">
          {data.skills.map((skill, index) => (
            <div key={index}>
              <span className="text-gray-700 font-medium text-sm">{skill.category}: </span>
              <span className="text-gray-600 text-sm">{skill.items.join('、')}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染语言能力
  const renderLanguages = () => {
    if (!data.languages || data.languages.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.languages')}</h2>
        <div className="flex flex-wrap gap-4">
          {data.languages.map((lang, index) => (
            <span key={index} className="text-sm text-gray-600">
              {lang.name}: {lang.level}
            </span>
          ))}
        </div>
      </section>
    );
  };

  // 渲染证书/荣誉
  const renderCertificates = () => {
    if (!data.certificates || data.certificates.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.certificates')}</h2>
        <div className={themeConfig.sectionContent}>
          {data.certificates.map((cert, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={themeConfig.itemTitle}>{cert.name}</h3>
                  {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                </div>
                {cert.date && <span className={themeConfig.dateRange}>{cert.date}</span>}
              </div>
              {cert.link && (
                <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 inline-block">
                  {t('editor.certificateViewLink')}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染兴趣爱好
  const renderInterests = () => {
    if (!data.interests || data.interests.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{t('sections.interests')}</h2>
        <div className="flex flex-wrap gap-4">
          {data.interests.map((interest, index) => (
            <div key={index}>
              <span className="text-sm font-medium text-gray-700">{interest.name}</span>
              {interest.items && interest.items.length > 0 && (
                <span className="text-sm text-gray-600">: {interest.items.join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 渲染自定义模块
  const renderCustomSection = (section: CustomSection) => {
    if (!section.entries || section.entries.length === 0) return null;
    return (
      <section className={themeConfig.section}>
        <h2 className={themeConfig.sectionTitle}>{section.title}</h2>
        <div className={themeConfig.sectionContent}>
          {section.entries.map((entry, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={themeConfig.itemTitle}>{entry.title}</h3>
                  {entry.subtitle && <p className={themeConfig.itemSubtitle}>{entry.subtitle}</p>}
                </div>
                {(entry.startDate || entry.endDate) && (
                  <span className={themeConfig.dateRange}>
                    {entry.startDate && formatDate(entry.startDate)} - {entry.endDate && formatDate(entry.endDate)}
                  </span>
                )}
              </div>
              {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
              {entry.highlights && entry.highlights.length > 0 && (
                <ul className={themeConfig.highlightList}>
                  {entry.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 模块渲染映射
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    personal: renderHeader,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    skills: renderSkills,
    languages: renderLanguages,
    certificates: renderCertificates,
    interests: renderInterests,
  };

  return (
    <div id="resume-content" className={themeConfig.container}>
      {sectionOrder.map((sectionId) => {
        // 检查模块是否可见
        if (!sectionVisibility[sectionId]) return null;
        // 先检查是否是预定义模块
        const renderer = sectionRenderers[sectionId];
        if (renderer) {
          return <div key={sectionId}>{renderer()}</div>;
        }
        // 检查是否是自定义模块
        const customSection = (data.customSections || []).find(s => s.id === sectionId);
        if (customSection) {
          return <div key={sectionId}>{renderCustomSection(customSection)}</div>;
        }
        return null;
      })}
    </div>
  );
}
