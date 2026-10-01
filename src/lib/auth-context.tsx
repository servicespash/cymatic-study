import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Ctx, type AuthCtx, type UserProfile } from "./auth-context-core";
import { normalizeRole, type UserRole } from "@/hooks/useUserRole";
import { notifications } from "@/lib/notifications";

const REFERRAL_STORAGE_KEY = "cymatic_signup_referral_code";
export { useAuth } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,setSession]=useState<Session|null>(null);
  const [user,setUser]=useState<User|null>(null);
  const [profile,setProfile]=useState<UserProfile|null>(null);
  const [loading,setLoading]=useState(true);
  const signOut=useCallback(async()=>{try{await supabase.auth.signOut();if(typeof window!=="undefined")localStorage.removeItem("cymatic_org_id");setSession(null);setUser(null);setProfile(null);}catch(err){console.error("Sign-out error:",err);}},[]);
  const userRef=useRef<User|null>(null); userRef.current=user;

  const fetchProfile=useCallback(async(userId:string,currentUser?:User|null)=>{
    try{
      const active=currentUser||userRef.current;
      const [{data,error},{data:roles, error:roleError}]=await Promise.all([
        supabase.from("profiles").select("*").eq("user_id",userId).maybeSingle(),
        supabase.from("user_roles").select("role,organization_id,created_at").eq("user_id",userId).order("created_at",{ascending:true})
      ]);
      if(error)console.warn("Profile query notice:",error.message);
      if(roleError)console.warn("Role query notice:",roleError.message);
      const metaOrg=active?.user_metadata?.org_id||active?.user_metadata?.organization_id||null;
      const metaSchool=active?.user_metadata?.school_name||active?.user_metadata?.school||null;
      const role=String(roles?.[0]?.role||"student");
      const org=roles?.[0]?.organization_id||data?.organization_id||null;
      if(data?.organization_id&&metaOrg&&data.organization_id!==metaOrg)console.warn("Auth metadata organization differs from database organization.");
      const p:UserProfile={
        user_id:userId,display_name:data?.display_name||active?.user_metadata?.full_name||active?.email?.split("@")[0]||"User",
        avatar_url:data?.avatar_url||null,role,org_id:org,organization_id:org,tutor_persona:data?.tutor_persona||"adam",
        school_name:data?.school_name||metaSchool,teacher_license_id:data?.teacher_license_id||null,
        full_name:data?.display_name||active?.user_metadata?.full_name||null,
        username:data?.username||active?.email?.split("@")[0]||null,phone:data?.phone||null
      };
      if(org&&typeof window!=="undefined")localStorage.setItem("cymatic_org_id",org);
      setProfile(p);
    }catch(err){console.warn("Profile fetch exception:",err);}finally{setLoading(false);}
  },[]);
  const refreshProfile=useCallback(async()=>{if(user)await fetchProfile(user.id,user);},[user,fetchProfile]);

  useEffect(()=>{
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setUser(s?.user??null);if(s?.user)void fetchProfile(s.user.id,s.user);else{setProfile(null);setLoading(false);}});
    supabase.auth.getSession().then(({data:{session:s}})=>{setSession(s);setUser(s?.user??null);if(s?.user)void fetchProfile(s.user.id,s.user);else setLoading(false);});
    return()=>subscription.unsubscribe();
  },[fetchProfile]);

  useEffect(()=>{if(!user||typeof window==="undefined")return;const code=window.localStorage.getItem(REFERRAL_STORAGE_KEY);if(!code?.trim())return;
    const apply=async()=>{try{await(supabase.rpc as any)("record_referral",{referrer_code:code.trim()});}catch(err){console.warn("Referral application failed:",err);}finally{window.localStorage.removeItem(REFERRAL_STORAGE_KEY);}};void apply();
  },[user]);

  const rawRole=profile?.role||"student"; const role:UserRole=normalizeRole(rawRole);
  const org_id=profile?.organization_id||null; const schoolName=profile?.school_name||null;
  const isStudent=role==="student"; const isTeacher=role==="teacher"; const isOrgAdmin=role==="org_admin";
  const isAdmin=role==="admin"||isOrgAdmin; const isInstitutional=!!org_id; const isGuestMode=!loading&&!user;
  const hasRole=useCallback((allowed:UserRole|string|(UserRole|string)[])=>{const list=Array.isArray(allowed)?allowed:[allowed];if(list.includes(role)||list.includes(rawRole))return true;return isAdmin&&(list.includes("teacher")||list.includes("student"));},[role,rawRole,isAdmin]);
  const value:AuthCtx=useMemo(()=>({user,session,loading,profile,role,rawRole,isInstitutional,isStudent,isTeacher,isAdmin,isOrgAdmin,isGuestMode,org_id,organizationId:org_id,schoolName,signOut,refreshProfile,hasRole,isAuthorized:hasRole}),[user,session,loading,profile,role,rawRole,isInstitutional,isStudent,isTeacher,isAdmin,isOrgAdmin,isGuestMode,org_id,schoolName,signOut,refreshProfile,hasRole]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const AppProvider=AuthProvider; export default AuthProvider;
