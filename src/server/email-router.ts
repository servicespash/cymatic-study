import { createResendAdapter } from "@resend/chat-sdk-adapter";

// Configuration
const fromAddress = "support@cymatichub.xyz";
const fromName = "Cymatic Hub Support";

// Initialize Adapter
const resendAdapter = createResendAdapter({
  fromAddress,
  fromName,
});

// HTML Template Generator
function renderCardEmail(ui: any): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 400px; margin: 20px auto; box-sizing: border-box;">
      <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">${ui.title}</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">${ui.description}</p>
      ${
        ui.action
          ? `
        <a href="${ui.action.url}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          ${ui.action.label}
        </a>
      `
          : ""
      }
    </div>
  `;
}

// Mocking central Chat instance hook
const Chat = {
  openDM: async (to: string, message: any) => {
    // Post message to a thread, assuming thread ID format from to address
    // In a real application, you'd resolve the thread ID properly.
    return resendAdapter.postMessage(`resend:${to}`, {
      markdown: message.subject + "\n\n" + renderCardEmail(message.ui),
    });
  },
};

export async function handleEmailRequest(req: any, res: any) {
  const { actionType, payload } = req.body;
  const { to } = payload;

  try {
    const message: any = { subject: "", ui: {} };

    switch (actionType) {
      case "LIVE_STREAM_BROADCAST":
        message.subject = "Live Class Alert";
        message.ui = {
          type: "card",
          title: "Join Live Class",
          description: "A new live session has started.",
          action: { type: "link-button", label: "Join Now", url: payload.url },
        };
        break;
      case "CURRICULUM_MAP_UPDATE":
        message.subject = "Curriculum Update";
        message.ui = {
          type: "card",
          title: "Curriculum Map Updated",
          description: "New syllabus maps are available.",
          action: { type: "link-button", label: "View Map", url: payload.url },
        };
        break;
      case "EXAM_UPDATE":
        message.subject = "Exam Criteria Published";
        message.ui = {
          type: "card",
          title: "Performance Exam Criteria",
          description: "Assessment criteria have been updated.",
          action: { type: "link-button", label: "Review Criteria", url: payload.url },
        };
        break;
      case "INSTITUTIONAL_SIGNUP":
        message.subject = "Welcome to Cymatic Hub";
        message.ui = {
          type: "card",
          title: "Onboarding Complete",
          description: "Your institution is successfully registered.",
          action: { type: "link-button", label: "Access Portal", url: payload.url },
        };
        break;
      case "PBL_MARKING_VERIFICATION":
        message.subject = "Marking Verification Required";
        message.ui = {
          type: "card",
          title: "PBL Project Submission",
          description: "Verify project-based learning targets.",
          action: { type: "link-button", label: "Mark Project", url: payload.url },
        };
        break;
      default:
        return res.status(400).json({ error: "Invalid actionType" });
    }

    await Chat.openDM(to, message);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
