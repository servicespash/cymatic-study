import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const TeacherSettings = () => {
  return (
    <div className="p-6 space-y-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Educator Preferences</h2>
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500">Auto-Grade Assignments</label>
        <Switch />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Default Assignment Due Date Offset (Days)</label>
        <Input type="number" placeholder="7" />
      </div>
      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
        Save Educator Preferences
      </Button>
    </div>
  );
};
