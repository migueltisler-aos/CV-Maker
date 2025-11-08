import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const SkillRadar = ({ skills }) => {
  // Transform skills data for recharts
  const data = skills.map(skill => ({
    skill: skill.name,
    level: skill.level,
    fullMark: 10,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#374151', fontSize: 11 }}
            stroke="#9ca3af"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            stroke="#d1d5db"
          />
          <Radar
            name="Skill Level"
            dataKey="level"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadar;
