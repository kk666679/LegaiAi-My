import { User, Shield, Bell, Settings2 } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Role", value: "Lawyer", hint: "Current access level", tone: "default" },
  { label: "Permissions", value: "12", hint: "Granted actions", tone: "success" },
  { label: "Alerts", value: "4", hint: "Unread", tone: "warning" },
  { label: "Tenants", value: "1", hint: "Current workspace", tone: "default" },
];

export default function ProfilePage() {
  return (
    <ModulePage
      title="Profile"
      description="Review your account details, access scope, and workspace preferences."
      stats={stats}
      sections={[
        {
          title: "Account",
          description: "User profile and contact information",
          content: (
            <div className="space-y-3">
              {[["Name", "Aisha Rahman"], ["Email", "aisha@lawmate.example"], ["Role", "Senior Lawyer"]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Preferences",
          description: "Account-level settings and notifications",
          content: (
            <div className="space-y-3">
              {[["Security", "MFA enabled"], ["Notifications", "Daily digest"], ["Workspace settings", "Configured"]].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    {label === "Security" ? <Shield className="size-4 text-primary" /> : label === "Notifications" ? <Bell className="size-4 text-primary" /> : <Settings2 className="size-4 text-primary" />}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{state}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
