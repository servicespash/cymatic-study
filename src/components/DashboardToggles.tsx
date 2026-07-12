import React, { useState } from "react";

interface ToggleProps {
  label: string;
  actionType: "LIVE_STREAM_BROADCAST" | "CURRICULUM_MAP_UPDATE" | "EXAM_UPDATE";
  userEmail: string;
}

const Toggle = ({ label, actionType, userEmail }: ToggleProps) => {
  const [isOn, setIsOn] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsOn(checked);
    if (checked) {
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType,
            payload: {
              to: userEmail,
              url: "https://cymatichub.xyz/target-page",
            },
          }),
        });
      } catch (error) {
        console.error("Failed to sync toggle:", error);
      }
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
      <label style={{ marginRight: "10px" }}>{label}</label>
      <input type="checkbox" checked={isOn} onChange={(e) => handleToggle(e.target.checked)} />
    </div>
  );
};

export const DashboardToggles = ({ userEmail }: { userEmail: string }) => (
  <div>
    <h3>Notification Preferences</h3>
    <Toggle label="Live Streams" actionType="LIVE_STREAM_BROADCAST" userEmail={userEmail} />
    <Toggle label="Curriculum Maps" actionType="CURRICULUM_MAP_UPDATE" userEmail={userEmail} />
    <Toggle label="Exams" actionType="EXAM_UPDATE" userEmail={userEmail} />
  </div>
);
