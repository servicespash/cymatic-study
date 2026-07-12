import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const data = [
  { subject: "Math", A: 120, fullMark: 150 },
  { subject: "Physics", A: 98, fullMark: 150 },
  { subject: "Chemistry", A: 86, fullMark: 150 },
  { subject: "Biology", A: 99, fullMark: 150 },
  { subject: "History", A: 85, fullMark: 150 },
  { subject: "Literature", A: 65, fullMark: 150 },
];

export function TopicRelationshipChart() {
  return (
    <div className="h-64 w-full bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <h3 className="text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-4">
        Learning Progression
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar name="Progression" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
