export interface CurriculumAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  subject?: string;
  classLevel?: number;
}

class AssetManager {
  private assets: Map<string, CurriculumAsset> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("lattys_curriculum_assets");
      if (stored) {
        const parsed: CurriculumAsset[] = JSON.parse(stored);
        parsed.forEach((a) => this.assets.set(a.id, a));
      }
    } catch (e) {
      console.error("Failed to load assets from storage", e);
    }
  }

  private saveToStorage() {
    try {
      const list = Array.from(this.assets.values());
      localStorage.setItem("lattys_curriculum_assets", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save assets to storage", e);
    }
  }

  public registerAsset(file: File, subject?: string, classLevel?: number): Promise<CurriculumAsset> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const asset: CurriculumAsset = {
          id,
          name: file.name,
          url: reader.result as string,
          mimeType: file.type,
          size: file.size,
          createdAt: new Date().toISOString(),
          subject,
          classLevel,
        };
        this.assets.set(id, asset);
        this.saveToStorage();
        resolve(asset);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  public getAsset(id: string): CurriculumAsset | undefined {
    return this.assets.get(id);
  }

  public getAllAssets(): CurriculumAsset[] {
    return Array.from(this.assets.values());
  }

  public deleteAsset(id: string): boolean {
    const deleted = this.assets.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public embedAssetMarkdown(text: string): string {
    // Replaces references like [image:filename.png] or ![caption](asset_id) with inline renderable markdown/HTML
    let updated = text;
    this.assets.forEach((asset, id) => {
      const regex = new RegExp(`\\[(image|img):${asset.name}\\]|\\]\\((${id})\\)`, "gi");
      updated = updated.replace(regex, `\n\n![${asset.name}](${asset.url})\n\n`);
    });
    return updated;
  }
}

export const assetManager = new AssetManager();
