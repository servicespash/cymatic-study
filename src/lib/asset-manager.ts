/**
 * Centralized Asset Management System for Curriculum Ingestion
 * Assigns unique identifiers to uploaded images/diagrams, creates virtual directory structures,
 * and embeds paths correctly into parsed notes for inline academic rendering.
 */

export interface ManagedAsset {
  id: string;
  originalName: string;
  virtualPath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  caption?: string;
  subject: string;
  topicId: string;
}

class AssetManagerStore {
  private assets: Map<string, ManagedAsset> = new Map();

  registerAsset(fileOrData: { name: string; type: string; size: number }, subject: string, topicId: string, caption?: string): ManagedAsset {
    const id = `asset_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const cleanName = fileOrData.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const virtualPath = `/assets/curriculum/${subject}/${topicId}/${id}_${cleanName}`;

    const asset: ManagedAsset = {
      id,
      originalName: fileOrData.name,
      virtualPath,
      mimeType: fileOrData.type || "image/png",
      sizeBytes: fileOrData.size || 0,
      createdAt: new Date().toISOString(),
      caption,
      subject,
      topicId,
    };

    this.assets.set(id, asset);
    return asset;
  }

  getAsset(id: string): ManagedAsset | undefined {
    return this.assets.get(id);
  }

  listAssets(subject?: string, topicId?: string): ManagedAsset[] {
    const list = Array.from(this.assets.values());
    return list.filter((a) => {
      if (subject && a.subject !== subject) return false;
      if (topicId && a.topicId !== topicId) return false;
      return true;
    });
  }

  extractAndRegisterDiagramMarkers(text: string, subject: string, topicId: string): { cleanedText: string; registeredAssets: ManagedAsset[] } {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    const registeredAssets: ManagedAsset[] = [];
    let cleanedText = text;

    while ((match = imgRegex.exec(text)) !== null) {
      const caption = match[1];
      const sourceRef = match[2];
      const asset = this.registerAsset(
        { name: sourceRef.split("/").pop() || "diagram.png", type: "image/png", size: 1024 },
        subject,
        topicId,
        caption
      );
      registeredAssets.push(asset);
      cleanedText = cleanedText.replace(match[0], `[INLINE_DIAGRAM:${asset.id}|${caption || asset.originalName}]`);
    }

    return { cleanedText, registeredAssets };
  }
}

export const assetManager = new AssetManagerStore();
