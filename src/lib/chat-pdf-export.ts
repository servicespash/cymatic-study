import jsPDF from "jspdf";
import { Message } from "@/store/useTutorStore";

export async function exportChatToPDF(messages: Message[]) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(16);
  doc.text("Chat History", 10, y);
  y += 10;

  doc.setFontSize(10);
  messages.forEach((msg) => {
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    const timestamp = msg.timestamp;
    const text = `${msg.sender === "student" ? "You" : "Tutor"}: ${msg.text}`;
    doc.text(`[${timestamp}] ${text}`, 10, y);
    y += 7;
  });

  doc.save("chat-history.pdf");
}
