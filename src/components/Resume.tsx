import type { ResumeData, ThemeType } from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../types/resume';
import { themes } from '../themes';

interface ResumeProps {
  data: ResumeData;
  theme: ThemeType;
}

export function Resume({ data, theme }: ResumeProps) {
  const t = themes[theme];
  const sectionOrder = data.sectionOrder || DEFAULT_SECTION_ORDER;
  const sectionVisibility = data.sectionVisibility || DEFAULT_SECTION_VISIBILITY;

  const formatDate = (date: string) => {
    const [year, month] = date.split('-');
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
    <header className={t.header}>
      <div className="flex items-center gap-4">
        {data.personal.avatar && (
          <img
            src={data.personal.avatar}
            alt={data.personal.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h1 className={t.nameText}>{data.personal.name}</h1>
          <p className={t.title}>{data.personal.title}</p>
        </div>
      </div>
      <div className={t.contactInfo}>
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
      <section className={t.section}>
        <h2 className={t.sectionTitle}>工作经历</h2>
        <div className={t.sectionContent}>
          {data.experience.map((exp, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={t.itemTitle}>{exp.company}</h3>
                  <p className={t.itemSubtitle}>{exp.position}</p>
                </div>
                <span className={t.dateRange}>
                  {formatDate(exp.startDate)} - {exp.current ? '至今' : exp.endDate && formatDate(exp.endDate)}
                </span>
              </div>
              <ul className={t.highlightList}>
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
      <section className={t.section}>
        <h2 className={t.sectionTitle}>项目经历</h2>
        <div className={t.sectionContent}>
          {data.projects.map((project, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={t.itemTitle}>{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.description}</p>
                </div>
                {project.link && (
                  <span className="text-sm text-blue-500">{project.link}</span>
                )}
              </div>
              <div className="flex flex-wrap mt-2">
                {project.technologies.map((tech, i) => (
                  <span key={i} className={t.skillTag}>{tech}</span>
                ))}
              </div>
              {project.highlights && project.highlights.length > 0 && (
                <ul className={t.highlightList}>
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
      <section className={t.section}>
        <h2 className={t.sectionTitle}>教育背景</h2>
        <div className={t.sectionContent}>
          {data.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h3 className={t.itemTitle}>{edu.school}</h3>
                  <p className={t.itemSubtitle}>{edu.degree} - {edu.field}</p>
                </div>
                <span className={t.dateRange}>
                  {formatDate(edu.startDate)} - {edu.endDate && formatDate(edu.endDate)}
                </span>
              </div>
              {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
              {edu.honors && edu.honors.length > 0 && (
                <p className="text-sm text-gray-500">荣誉: {edu.honors.join('、')}</p>
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
      <section className={t.section}>
        <h2 className={t.sectionTitle}>专业技能</h2>
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
      <section className={t.section}>
        <h2 className={t.sectionTitle}>语言能力</h2>
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

  // 模块渲染映射
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    personal: renderHeader,
    experience: renderExperience,
    projects: renderProjects,
    education: renderEducation,
    skills: renderSkills,
    languages: renderLanguages,
  };

  return (
    <div id="resume-content" className={t.container}>
      {sectionOrder.map((sectionId) => {
        // 检查模块是否可见
        if (!sectionVisibility[sectionId]) return null;
        const renderer = sectionRenderers[sectionId];
        return renderer ? renderer() : null;
      })}
    </div>
  );
}
