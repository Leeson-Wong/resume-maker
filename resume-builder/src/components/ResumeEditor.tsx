import type { ResumeData, PersonalInfo, Experience, Education, Project, Skill } from '../types/resume';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      personal: { ...data.personal, [field]: value },
    });
  };

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

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-lg p-4 shadow-sm border border-gray-200";
  const sectionTitleClass = "text-lg font-bold text-gray-800 mb-4 pb-2 border-b";

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* 个人信息 */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>个人信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>姓名 *</label>
            <input
              type="text"
              value={data.personal.name}
              onChange={(e) => updatePersonal('name', e.target.value)}
              className={inputClass}
              placeholder="张三"
            />
          </div>
          <div>
            <label className={labelClass}>职位 *</label>
            <input
              type="text"
              value={data.personal.title}
              onChange={(e) => updatePersonal('title', e.target.value)}
              className={inputClass}
              placeholder="全栈开发工程师"
            />
          </div>
          <div>
            <label className={labelClass}>邮箱 *</label>
            <input
              type="email"
              value={data.personal.email}
              onChange={(e) => updatePersonal('email', e.target.value)}
              className={inputClass}
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>电话</label>
            <input
              type="tel"
              value={data.personal.phone || ''}
              onChange={(e) => updatePersonal('phone', e.target.value)}
              className={inputClass}
              placeholder="138-0000-0000"
            />
          </div>
          <div>
            <label className={labelClass}>所在地</label>
            <input
              type="text"
              value={data.personal.location || ''}
              onChange={(e) => updatePersonal('location', e.target.value)}
              className={inputClass}
              placeholder="北京，中国"
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              type="text"
              value={data.personal.github || ''}
              onChange={(e) => updatePersonal('github', e.target.value)}
              className={inputClass}
              placeholder="github.com/username"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>个人简介</label>
            <textarea
              value={data.personal.summary || ''}
              onChange={(e) => updatePersonal('summary', e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="简要介绍自己的经验和技能..."
            />
          </div>
        </div>
      </section>

      {/* 工作经历 */}
      <section className={sectionClass}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className={sectionTitleClass.replace(' mb-4 pb-2 border-b', '')}>工作经历</h2>
          <button
            onClick={addExperience}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + 添加
          </button>
        </div>
        {data.experience.map((exp, index) => (
          <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md relative">
            <button
              onClick={() => removeExperience(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>公司 *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>职位 *</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(index, 'position', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>开始时间 *</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>结束时间</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="month"
                    value={exp.endDate || ''}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    className={inputClass}
                    disabled={exp.current}
                  />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={exp.current || false}
                      onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                    />
                    至今
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>工作亮点 (每行一条)</label>
                <textarea
                  value={exp.highlights.join('\n')}
                  onChange={(e) => updateExperience(index, 'highlights', e.target.value.split('\n').filter(Boolean))}
                  className={inputClass}
                  rows={4}
                  placeholder="负责XX项目开发...&#10;优化了XX性能...&#10;带领XX团队..."
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 项目经历 */}
      <section className={sectionClass}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className={sectionTitleClass.replace(' mb-4 pb-2 border-b', '')}>项目经历</h2>
          <button
            onClick={addProject}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + 添加
          </button>
        </div>
        {data.projects.map((proj, index) => (
          <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md relative">
            <button
              onClick={() => removeProject(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>项目名称 *</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>项目链接</label>
                <input
                  type="text"
                  value={proj.link || ''}
                  onChange={(e) => updateProject(index, 'link', e.target.value)}
                  className={inputClass}
                  placeholder="github.com/user/project"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>项目描述 *</label>
                <input
                  type="text"
                  value={proj.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  className={inputClass}
                  placeholder="简要描述项目功能和目标"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>技术栈 (逗号分隔)</label>
                <input
                  type="text"
                  value={proj.technologies.join(', ')}
                  onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className={inputClass}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>项目亮点 (每行一条)</label>
                <textarea
                  value={proj.highlights?.join('\n') || ''}
                  onChange={(e) => updateProject(index, 'highlights', e.target.value.split('\n').filter(Boolean))}
                  className={inputClass}
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 教育背景 */}
      <section className={sectionClass}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className={sectionTitleClass.replace(' mb-4 pb-2 border-b', '')}>教育背景</h2>
          <button
            onClick={addEducation}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + 添加
          </button>
        </div>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md relative">
            <button
              onClick={() => removeEducation(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>学校 *</label>
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>学位 *</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className={inputClass}
                  placeholder="本科 / 硕士 / 博士"
                />
              </div>
              <div>
                <label className={labelClass}>专业 *</label>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => updateEducation(index, 'field', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>GPA</label>
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  className={inputClass}
                  placeholder="3.8/4.0"
                />
              </div>
              <div>
                <label className={labelClass}>开始时间 *</label>
                <input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>结束时间</label>
                <input
                  type="month"
                  value={edu.endDate || ''}
                  onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 专业技能 */}
      <section className={sectionClass}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className={sectionTitleClass.replace(' mb-4 pb-2 border-b', '')}>专业技能</h2>
          <button
            onClick={addSkill}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            + 添加
          </button>
        </div>
        {data.skills.map((skill, index) => (
          <div key={index} className="mb-3 p-3 bg-gray-50 rounded-md flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>分类</label>
                <input
                  type="text"
                  value={skill.category}
                  onChange={(e) => updateSkill(index, 'category', e.target.value)}
                  className={inputClass}
                  placeholder="前端技术 / 后端技术 / 工具"
                />
              </div>
              <div>
                <label className={labelClass}>技能 (逗号分隔)</label>
                <input
                  type="text"
                  value={skill.items.join(', ')}
                  onChange={(e) => updateSkill(index, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className={inputClass}
                  placeholder="React, Vue, TypeScript"
                />
              </div>
            </div>
            <button
              onClick={() => removeSkill(index)}
              className="text-red-500 hover:text-red-700 text-sm mt-6"
            >
              删除
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
