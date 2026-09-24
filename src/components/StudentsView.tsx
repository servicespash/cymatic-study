import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, GraduationCap } from "lucide-react";

export function StudentsView({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      if (!schoolId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, school_name, user_id")
        .eq("school_name", schoolId); // Assuming school_name acts as the ID or link

      if (data) {
        setStudents(data);
      }
      setLoading(false);
    }
    loadStudents();
  }, [schoolId]);

  if (loading) return <div>Loading students...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Students in Your School
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.map((s) => (
          <div key={s.user_id} className="flex items-center gap-3 p-3 border-b">
            <User className="w-8 h-8 bg-zinc-800 p-1.5 rounded-full" />
            <div>
              <p className="font-bold">{s.display_name}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
