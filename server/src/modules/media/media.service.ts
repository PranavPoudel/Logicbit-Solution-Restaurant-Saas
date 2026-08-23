import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../prisma/prisma.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * detectRealImageType()
 * -----------------------
 * SECURITY: Client ले पठाउने `file.mimetype` एउटा HTTP header मात्र हो,
 * यसलाई client ले जे पायो त्यही (spoof गरेर) पठाउन सक्छ — जस्तै malicious
 * .exe फाइललाई "image/jpeg" भनेर header मात्र बदलेर पठाउन सकिन्छ। यसैले
 * actual file bytes को सुरुका "magic number" (file signature) जाँचेर मात्र
 * true image हो भनेर confirm गरिन्छ।
 */
function detectRealImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  const hex = buffer.subarray(0, 4).toString('hex');
  if (hex.startsWith('ffd8')) return 'image/jpeg';
  if (hex === '89504e47') return 'image/png';
  if (buffer.subarray(0, 3).toString('hex') === '474946') return 'image/gif';
  if (buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

/**
 * MediaService
 * -------------
 * अहिले local disk मा file save गर्छ (development/छोटो-scale को लागि)।
 * Production मा जाँदा S3/Cloudinary मा swap गर्नुपर्छ — यो service को
 * public interface (upload/delete) उस्तै राखेर, भित्रको implementation
 * मात्र बदल्दा हुन्छ, अरू module (Restaurant, MenuItem) मा केही
 * बदल्नुपर्दैन।
 *
 * SECURITY: Original filename कहिल्यै disk path मा प्रयोग गरिँदैन — सधैं
 * नयाँ UUID नाम दिइन्छ। यसले "path traversal" (जस्तै filename मा
 * "../../etc/passwd" जस्तो malicious string) आक्रमण रोक्छ।
 */
@Injectable()
export class MediaService {
  private readonly uploadDir: string;
  private readonly maxSizeBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    this.maxSizeBytes = Number(this.config.get<string>('MAX_UPLOAD_SIZE_MB') ?? 5) * 1024 * 1024;
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async upload(tenantId: string, restaurantId: string | undefined, file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`);
    }

    const realType = detectRealImageType(file.buffer);
    if (!realType || !ALLOWED_MIME_TYPES.includes(realType)) {
      throw new BadRequestException('File content does not match a valid image format (mimetype header cannot be trusted alone)');
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(`File too large. Max allowed size is ${this.maxSizeBytes / (1024 * 1024)}MB`);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `${uuidv4()}${ext}`;
    const destPath = path.join(this.uploadDir, safeFilename);

    fs.writeFileSync(destPath, file.buffer);

    const media = await this.prisma.media.create({
      data: {
        tenantId,
        restaurantId,
        url: `/uploads/${safeFilename}`,
        key: safeFilename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });

    return { success: true, data: media };
  }

  async remove(tenantId: string, id: string) {
    const media = await this.prisma.media.findFirst({ where: { id, tenantId } });
    if (!media) return { success: false, message: 'File not found' };

    const filePath = path.join(this.uploadDir, media.key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.prisma.media.delete({ where: { id } });
    return { success: true, message: 'File deleted' };
  }
}
