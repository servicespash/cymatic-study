import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AdminSettings = () => {
  return (
    <div className="p-6 space-y-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
        Institutional Management
      </h2>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">School Name</label>
        <Input placeholder="Enter school name" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Org ID</label>
        <Input placeholder="Organization ID" />
      </div>
      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
        Save Institutional Changes
      </Button>
    </div>
  );
};
