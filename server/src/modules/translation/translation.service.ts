import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TranslationService
 * --------------------
 * Purpose: Owner ले जुन भाषामा menu item नाम/description लेखे पनि,
 * customer ले आफ्नो रोजेको भाषामा हेर्न पाओस् भनेर Google Cloud
 * Translation API प्रयोग गर्ने।
 *
 * किन caching चाहियो?
 * Google Translate API हरेक call मा पैसा लाग्छ (character-based billing)।
 * "Chicken Momo" जस्तो उही text बारम्बार translate गर्नुपर्दा प्रत्येक
 * customer request मा फेरि-फेरि API call गर्नु महँगो र ढिलो हुन्छ।
 * त्यसैले पहिलोपटक translate भएको text लाई DB मा cache गरिन्छ — त्यसपछि
 * उही text + language को लागि फेरि API call गर्नु पर्दैन।
 *
 * Setup आवश्यक: .env मा GOOGLE_TRANSLATE_API_KEY चाहिन्छ (Google Cloud
 * Console बाट Translation API enable गरेर API key निकाल्नुहोस्)।
 * Key नभएसम्म यसले original text (untranslated) नै फर्काउँछ — app
 * crash हुँदैन, gracefully fallback हुन्छ।
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('GOOGLE_TRANSLATE_API_KEY') ?? '';
  }

  async translate(text: string, targetLang: string): Promise<string> {
    if (!text || !targetLang || targetLang === 'en') return text;
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_TRANSLATE_API_KEY not configured — returning original text');
      return text;
    }

    const hash = createHash('sha256').update(text).digest('hex');

    const cached = await this.prisma.translationCache.findUnique({
      where: { sourceTextHash_targetLang: { sourceTextHash: hash, targetLang } },
    });
    if (cached) return cached.translatedText;

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang, format: 'text' }),
      });
      const data = await response.json();
      const translatedText = data?.data?.translations?.[0]?.translatedText ?? text;

      await this.prisma.translationCache.create({
        data: { sourceTextHash: hash, sourceText: text, targetLang, translatedText },
      });

      return translatedText;
    } catch (error) {
      this.logger.error(`Translation failed for lang=${targetLang}`, error as Error);
      return text; // API fail भए पनि original text देखाउने, customer लाई error नआओस्
    }
  }

  /** धेरै text एकैचोटि translate गर्ने (menu item list जस्तो bulk case को लागि) */
  async translateBulk(texts: string[], targetLang: string): Promise<string[]> {
    return Promise.all(texts.map((t) => this.translate(t, targetLang)));
  }
}
