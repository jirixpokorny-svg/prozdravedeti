import fs from 'fs';
import path from 'path';

export function getUploadDir(): string {
  // In production (built), Astro serves static files from dist/client/
  // In dev, it serves from public/
  const isProd = fs.existsSync(path.join(process.cwd(), 'dist/client'));
  const dir = isProd
    ? path.join(process.cwd(), 'dist/client/uploads')
    : path.join(process.cwd(), 'public/uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function saveUpload(file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const uploadDir = getUploadDir();
  fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

export function deleteUpload(url: string | null): void {
  if (!url) return;
  const isProd = fs.existsSync(path.join(process.cwd(), 'dist/client'));
  const base = isProd ? 'dist/client' : 'public';
  const filePath = path.join(process.cwd(), base, url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
