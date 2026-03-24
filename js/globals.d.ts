/**
 * KSLT — Global type declarations for JSDoc/TypeScript checking.
 * Extends Window with project-specific global variables.
 */

interface Window {
  // Supabase
  supabase: any;
  supabaseClient: any;

  // Auth state (set by auth-guard.js)
  ksltUser: any;
  ksltProfile: any;
  onAuthReady: (user: any, profile: any) => void;
  isProfileComplete: boolean;

  // Membership
  KSLT_MEMBERSHIP_PLAN: any;
  checkMembership: () => Promise<any>;
  getMembershipHistory: () => Promise<any[]>;

  // Admin namespace
  KSLT_ADMIN: any;

  // Telegram bot
  KSLT_TG_BOT: string;
}

// External libraries loaded via CDN
declare var QRCode: any;
declare var Chart: any;
declare var Cropper: any;
declare var supabaseClient: any;
declare var SUPABASE_URL: string;
declare var SUPABASE_ANON_KEY: string;
