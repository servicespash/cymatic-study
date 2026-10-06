/**
 * GreetingService: Dedicated service for generating context-aware, role-aware,
 * and professional introductory greetings for the AI tutor and user dashboard.
 */

import { getAddressedName } from "./name-utils";

export interface GreetingOptions {
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  schoolName?: string | null;
  lastActiveTimestamp?: number;
  subject?: string;
}

export class GreetingService {
  /**
   * Generates a personalized welcoming string from session user metadata.
   */
  public static generateFromSession(
    user: any,
    profileData?: { full_name?: string; role?: string; school_name?: string } | null,
    subject?: string,
  ): string {
    const meta = user?.user_metadata || {};
    const email = user?.email || null;
    const rawRole =
      profileData?.role ||
      meta.role ||
      (email?.toLowerCase() === "latifisabirye123@gmail.com" ? "admin" : "student");
      
    const role =
      rawRole.toLowerCase().includes("admin") || rawRole.toLowerCase().includes("org_admin")
        ? "admin"
        : rawRole.toLowerCase().includes("teacher") || rawRole.toLowerCase().includes("instructor")
          ? "teacher"
          : "student";

    const fullName = profileData?.full_name || meta.full_name || meta.name || null;
    const schoolName =
      profileData?.school_name || meta.school_name || meta.school || meta.organization_id || "Cymatic Study Ecosystem";

    return GreetingService.generateGreeting({
      fullName,
      email,
      role,
      schoolName,
      subject,
    });
  }

  /**
   * Generates a personalized welcoming string acknowledging the user's role and professional context.
   */
  public static generateGreeting(options: GreetingOptions): string {
    const { firstName, addressedName, roleLabel } = getAddressedName(
      options.fullName,
      options.email,
      options.role,
    );
    const school = options.schoolName || "Cymatic Study Ecosystem";
    const subjectContext = options.subject ? ` focusing on ${options.subject}` : "";

    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (roleLabel === "Administrator") {
      return `${timeGreeting}, ${addressedName}. As administrator for ${school}, your institutional command center is fully synchronized and ready to guide academic excellence${subjectContext}. What strategic initiative, faculty report, or department metric shall we focus on today?`;
    }

    if (roleLabel === "Teacher") {
      return `${timeGreeting}, ${addressedName}. Welcome back to your faculty assessment workspace. Your students across ${school} are actively progressing through NCDC curriculum modules${subjectContext}. Shall we review recent student submissions or prepare today's instructional materials?`;
    }

    return `${timeGreeting}, ${addressedName}! Welcome back to your learning hub. Your personalized path in NCDC Lower and Upper Secondary subjects${subjectContext} is ready. What topic in Mathematics, Physics, Chemistry, Biology, or History shall we explore and master together today?`;
  }
}
