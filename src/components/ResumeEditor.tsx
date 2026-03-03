import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ResumeData, PersonalInfo, Experience, Education, Project, Skill, Language } from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '../types/resume';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

// 可排序项包装组件（用于条目级别）
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab p-2 text-gray-400 hover:text-gray-600 active:cursor-grabbing z-10"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

// 可排序模块包装组件（用于模块级别）
interface SortableSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  visible?: boolean;
  onToggleVisibility?: () => void;
  canToggle?: boolean;
}

function SortableSection({ id, title, children, visible = true, onToggleVisibility, canToggle = true }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 relative transition-opacity ${!visible ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 flex-1">{title}</h2>
        {canToggle && onToggleVisibility && (
          <button
            onClick={onToggleVisibility}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              visible
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {visible ? '显示' : '隐藏'}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sectionOrder = data.sectionOrder || DEFAULT_SECTION_ORDER;
  const sectionVisibility = data.sectionVisibility || DEFAULT_SECTION_VISIBILITY;

  // 更新模块顺序
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as string);
      const newIndex = sectionOrder.indexOf(over.id as string);
      onChange({
        ...data,
        sectionOrder: arrayMove(sectionOrder, oldIndex, newIndex),
      });
    }
  };

  // 切换模块可见性
  const toggleSectionVisibility = (sectionId: string) => {
    onChange({
      ...data,
      sectionVisibility: {
        ...sectionVisibility,
        [sectionId]: !sectionVisibility[sectionId],
      },
    });
  };

  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      personal: { ...data.personal, [field]: value },
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonal('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    updatePersonal('avatar', '');
  };

  // 工作经历
  const updateExperience = (index: number, field: keyof Experience, value: string | string[] | boolean) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    onChange({ ...data, experience: newExp });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [
        ...data.experience,
        { company: '', position: '', startDate: '', highlights: [] },
      ],
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...data,
      experience: data.experience.filter((_, i) => i !== index),
    });
  };

  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.experience.findIndex((_, i) => `exp-${i}` === active.id);
      const newIndex = data.experience.findIndex((_, i) => `exp-${i}` === over.id);
      onChange({
        ...data,
        experience: arrayMove(data.experience, oldIndex, newIndex),
      });
    }
  };

  // 教育背景
  const updateEducation = (index: number, field: keyof Education, value: string | string[]) => {
    const newEdu = [...data.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    onChange({ ...data, education: newEdu });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        { school: '', degree: '', field: '', startDate: '', endDate: '' },
      ],
    });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index),
    });
  };

  const handleEducationDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.education.findIndex((_, i) => `edu-${i}` === active.id);
      const newIndex = data.education.findIndex((_, i) => `edu-${i}` === over.id);
      onChange({
        ...data,
        education: arrayMove(data.education, oldIndex, newIndex),
      });
    }
  };

  // 项目经历
  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const newProj = [...data.projects];
    newProj[index] = { ...newProj[index], [field]: value };
    onChange({ ...data, projects: newProj });
  };

  const addProject = () => {
    onChange({
      ...data,
      projects: [
        ...data.projects,
        { name: '', description: '', technologies: [] },
      ],
    });
  };

  const removeProject = (index: number) => {
    onChange({
      ...data,
      projects: data.projects.filter((_, i) => i !== index),
    });
  };

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.projects.findIndex((_, i) => `proj-${i}` === active.id);
      const newIndex = data.projects.findIndex((_, i) => `proj-${i}` === over.id);
      onChange({
        ...data,
        projects: arrayMove(data.projects, oldIndex, newIndex),
      });
    }
  };

  // 技能
  const updateSkill = (index: number, field: keyof Skill, value: string | string[]) => {
    const newSkills = [...data.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    onChange({ ...data, skills: newSkills });
  };

  const addSkill = () => {
    onChange({
      ...data,
      skills: [...data.skills, { category: '', items: [] }],
    });
  };

  const removeSkill = (index: number) => {
    onChange({
      ...data,
      skills: data.skills.filter((_, i) => i !== index),
    });
  };

  const handleSkillDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.skills.findIndex((_, i) => `skill-${i}` === active.id);
      const newIndex = data.skills.findIndex((_, i) => `skill-${i}` === over.id);
      onChange({
        ...data,
        skills: arrayMove(data.skills, oldIndex, newIndex),
      });
    }
  };

  // 语言能力
  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const newLangs = [...(data.languages || [])];
    newLangs[index] = { ...newLangs[index], [field]: value };
    onChange({ ...data, languages: newLangs });
  };

  const addLanguage = () => {
    onChange({
      ...data,
      languages: [...(data.languages || []), { name: '', level: '' }],
    });
  };

  const removeLanguage = (index: number) => {
    onChange({
      ...data,
      languages: data.languages?.filter((_, i) => i !== index),
    });
  };

  const handleLanguageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = (data.languages || []).findIndex((_, i) => `lang-${i}` === active.id);
      const newIndex = (data.languages || []).findIndex((_, i) => `lang-${i}` === over.id);
      onChange({
        ...data,
        languages: arrayMove(data.languages || [], oldIndex, newIndex),
      });
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  // 模块标题映射
  const sectionTitles: Record<string, string> = {
    personal: '个人信息',
    experience: '工作经历',
    projects: '项目经历',
    education: '教育背景',
    skills: '专业技能',
    languages: '语言能力',
  };

  // 渲染个人信息模块
  const renderPersonalSection = () => (
    <SortableSection
      id="personal"
      title="个人信息"
      visible={sectionVisibility.personal}
      onToggleVisibility={() => toggleSectionVisibility('personal')}
      canToggle={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>个人头像（可选）</label>
          <div className="flex items-center gap-4">
            {data.personal.avatar ? (
              <div className="relative">
                <img src={data.personal.avatar} alt="头像预览" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                <button type="button" onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ) : (
              <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors">
                <span className="text-gray-400 text-2xl">+</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
            <span className="text-sm text-gray-500">点击上传头像，建议使用正方形图片</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>姓名 *</label>
          <input type="text" value={data.personal.name} onChange={(e) => updatePersonal('name', e.target.value)} className={inputClass} placeholder="张三" />
        </div>
        <div>
          <label className={labelClass}>职位 *</label>
          <input type="text" value={data.personal.title} onChange={(e) => updatePersonal('title', e.target.value)} className={inputClass} placeholder="全栈开发工程师" />
        </div>
        <div>
          <label className={labelClass}>邮箱 *</label>
          <input type="email" value={data.personal.email} onChange={(e) => updatePersonal('email', e.target.value)} className={inputClass} placeholder="example@email.com" />
        </div>
        <div>
          <label className={labelClass}>电话</label>
          <input type="tel" value={data.personal.phone || ''} onChange={(e) => updatePersonal('phone', e.target.value)} className={inputClass} placeholder="138-0000-0000" />
        </div>
        <div>
          <label className={labelClass}>所在地</label>
          <input type="text" value={data.personal.location || ''} onChange={(e) => updatePersonal('location', e.target.value)} className={inputClass} placeholder="北京，中国" />
        </div>
        <div>
          <label className={labelClass}>GitHub</label>
          <input type="text" value={data.personal.github || ''} onChange={(e) => updatePersonal('github', e.target.value)} className={inputClass} placeholder="github.com/username" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>个人简介</label>
          <textarea value={data.personal.summary || ''} onChange={(e) => updatePersonal('summary', e.target.value)} className={inputClass} rows={3} placeholder="简要介绍自己的经验和技能..." />
        </div>
      </div>
    </SortableSection>
  );

  // 渲染工作经历模块
  const renderExperienceSection = () => (
    <SortableSection
      id="experience"
      title="工作经历"
      visible={sectionVisibility.experience}
      onToggleVisibility={() => toggleSectionVisibility('experience')}
    >
      <div className="flex justify-end mb-2">
        <button onClick={addExperience} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 添加</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleExperienceDragEnd}>
        <SortableContext items={data.experience.map((_, i) => `exp-${i}`)} strategy={verticalListSortingStrategy}>
          {data.experience.map((exp, index) => (
            <SortableItem key={`exp-${index}`} id={`exp-${index}`}>
              <div className="mb-4 p-3 bg-gray-50 rounded-md relative">
                <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm">删除</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>公司 *</label>
                    <input type="text" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>职位 *</label>
                    <input type="text" value={exp.position} onChange={(e) => updateExperience(index, 'position', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>开始时间 *</label>
                    <input type="month" value={exp.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>结束时间</label>
                    <div className="flex gap-2 items-center">
                      <input type="month" value={exp.endDate || ''} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} className={inputClass} disabled={exp.current} />
                      <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                        <input type="checkbox" checked={exp.current || false} onChange={(e) => updateExperience(index, 'current', e.target.checked)} />
                        至今
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>工作亮点 (每行一条)</label>
                    <textarea value={exp.highlights.join('\n')} onChange={(e) => updateExperience(index, 'highlights', e.target.value.split('\n').filter(Boolean))} className={inputClass} rows={4} placeholder="负责XX项目开发...&#10;优化了XX性能...&#10;带领XX团队..." />
                  </div>
                </div>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </SortableSection>
  );

  // 渲染项目经历模块
  const renderProjectsSection = () => (
    <SortableSection
      id="projects"
      title="项目经历"
      visible={sectionVisibility.projects}
      onToggleVisibility={() => toggleSectionVisibility('projects')}
    >
      <div className="flex justify-end mb-2">
        <button onClick={addProject} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 添加</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
        <SortableContext items={data.projects.map((_, i) => `proj-${i}`)} strategy={verticalListSortingStrategy}>
          {data.projects.map((proj, index) => (
            <SortableItem key={`proj-${index}`} id={`proj-${index}`}>
              <div className="mb-4 p-3 bg-gray-50 rounded-md relative">
                <button onClick={() => removeProject(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm">删除</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>项目名称 *</label>
                    <input type="text" value={proj.name} onChange={(e) => updateProject(index, 'name', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>项目链接</label>
                    <input type="text" value={proj.link || ''} onChange={(e) => updateProject(index, 'link', e.target.value)} className={inputClass} placeholder="github.com/user/project" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>项目描述 *</label>
                    <input type="text" value={proj.description} onChange={(e) => updateProject(index, 'description', e.target.value)} className={inputClass} placeholder="简要描述项目功能和目标" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>技术栈 (逗号分隔)</label>
                    <input type="text" value={proj.technologies.join(', ')} onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className={inputClass} placeholder="React, TypeScript, Node.js" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>项目亮点 (每行一条)</label>
                    <textarea value={proj.highlights?.join('\n') || ''} onChange={(e) => updateProject(index, 'highlights', e.target.value.split('\n').filter(Boolean))} className={inputClass} rows={3} />
                  </div>
                </div>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </SortableSection>
  );

  // 渲染教育背景模块
  const renderEducationSection = () => (
    <SortableSection
      id="education"
      title="教育背景"
      visible={sectionVisibility.education}
      onToggleVisibility={() => toggleSectionVisibility('education')}
    >
      <div className="flex justify-end mb-2">
        <button onClick={addEducation} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 添加</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEducationDragEnd}>
        <SortableContext items={data.education.map((_, i) => `edu-${i}`)} strategy={verticalListSortingStrategy}>
          {data.education.map((edu, index) => (
            <SortableItem key={`edu-${index}`} id={`edu-${index}`}>
              <div className="mb-4 p-3 bg-gray-50 rounded-md relative">
                <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm">删除</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>学校 *</label>
                    <input type="text" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>学位 *</label>
                    <input type="text" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className={inputClass} placeholder="本科 / 硕士 / 博士" />
                  </div>
                  <div>
                    <label className={labelClass}>专业 *</label>
                    <input type="text" value={edu.field} onChange={(e) => updateEducation(index, 'field', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>GPA</label>
                    <input type="text" value={edu.gpa || ''} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} className={inputClass} placeholder="3.8/4.0" />
                  </div>
                  <div>
                    <label className={labelClass}>开始时间 *</label>
                    <input type="month" value={edu.startDate} onChange={(e) => updateEducation(index, 'startDate', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>结束时间</label>
                    <input type="month" value={edu.endDate || ''} onChange={(e) => updateEducation(index, 'endDate', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </SortableSection>
  );

  // 渲染专业技能模块
  const renderSkillsSection = () => (
    <SortableSection
      id="skills"
      title="专业技能"
      visible={sectionVisibility.skills}
      onToggleVisibility={() => toggleSectionVisibility('skills')}
    >
      <div className="flex justify-end mb-2">
        <button onClick={addSkill} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 添加</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSkillDragEnd}>
        <SortableContext items={data.skills.map((_, i) => `skill-${i}`)} strategy={verticalListSortingStrategy}>
          {data.skills.map((skill, index) => (
            <SortableItem key={`skill-${index}`} id={`skill-${index}`}>
              <div className="mb-3 p-3 bg-gray-50 rounded-md flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>分类</label>
                    <input type="text" value={skill.category} onChange={(e) => updateSkill(index, 'category', e.target.value)} className={inputClass} placeholder="前端技术 / 后端技术 / 工具" />
                  </div>
                  <div>
                    <label className={labelClass}>技能 (逗号分隔)</label>
                    <input type="text" value={skill.items.join(', ')} onChange={(e) => updateSkill(index, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className={inputClass} placeholder="React, Vue, TypeScript" />
                  </div>
                </div>
                <button onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700 text-sm mt-6">删除</button>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </SortableSection>
  );

  // 渲染语言能力模块
  const renderLanguagesSection = () => (
    <SortableSection
      id="languages"
      title="语言能力"
      visible={sectionVisibility.languages}
      onToggleVisibility={() => toggleSectionVisibility('languages')}
    >
      <div className="flex justify-end mb-2">
        <button onClick={addLanguage} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 添加</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLanguageDragEnd}>
        <SortableContext items={(data.languages || []).map((_, i) => `lang-${i}`)} strategy={verticalListSortingStrategy}>
          {(data.languages || []).map((lang, index) => (
            <SortableItem key={`lang-${index}`} id={`lang-${index}`}>
              <div className="mb-3 p-3 bg-gray-50 rounded-md flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>语言</label>
                    <input type="text" value={lang.name} onChange={(e) => updateLanguage(index, 'name', e.target.value)} className={inputClass} placeholder="英语" />
                  </div>
                  <div>
                    <label className={labelClass}>水平</label>
                    <input type="text" value={lang.level} onChange={(e) => updateLanguage(index, 'level', e.target.value)} className={inputClass} placeholder="流利 / 精通" />
                  </div>
                </div>
                <button onClick={() => removeLanguage(index)} className="text-red-500 hover:text-red-700 text-sm mt-6">删除</button>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </SortableSection>
  );

  // 模块渲染映射
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    personal: renderPersonalSection,
    experience: renderExperienceSection,
    projects: renderProjectsSection,
    education: renderEducationSection,
    skills: renderSkillsSection,
    languages: renderLanguagesSection,
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4 text-center text-sm text-gray-500">
        拖拽模块左侧图标调整顺序 · 点击"显示/隐藏"控制模块是否出现在简历中
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {sectionOrder.map((sectionId) => {
              const renderer = sectionRenderers[sectionId];
              return renderer ? <div key={sectionId}>{renderer()}</div> : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
