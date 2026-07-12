import jsPDF from "jspdf";
import { Message } from "@/store/useTutorStore";

export function exportChatToPdf(messages: Message[], filename: string) {
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(16);
  doc.text("Chat Session Export", 10, y);
  y += 10;

  doc.setFontSize(10);
  messages.forEach((msg) => {
    const text = `${msg.sender === "user" ? "You" : "Tutor"}: ${msg.text}`;
    const splitText = doc.splitTextToSize(text, 180);

    if (y > 280) {
      doc.addPage();
      y = 10;
    }

    doc.text(splitText, 10, y);
    y += splitText.length * 5;
  });

  doc.save(filename);
}
