import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const StudentSettings = () => {
  return (
    <div className="p-6 space-y-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Learner Preferences</h2>
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500">Enable Socratic AI Persona</label>
        <Switch />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Preferred Region for Curriculum Content</label>
        <Input placeholder="e.g., Kampala" />
      </div>
      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
        Save Learner Preferences
      </Button>
    </div>
  );
};
