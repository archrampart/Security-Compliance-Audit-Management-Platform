# Şablon Çevirisi Rehberi

Bu rehber, KVKK hariç tüm şablonları İngilizceye çevirmek için kullanılabilir.

## Özet

- **Toplam Şablon Sayısı**: 14 (KVKK hariç 13)
- **Tahmini Token**: ~76,000
- **Tahmini Maliyet (GPT-3.5 Turbo)**: ~$0.07 USD
- **Tahmini Maliyet (GPT-4o)**: ~$0.47 USD

## Adımlar

1. Veritabanı migration'ı çalıştırın:
   ```bash
   python backend/scripts/migrate_template_i18n.py
   ```

2. Şablon çeviri scriptini çalıştırın (OpenAI API key gerektirir):
   ```bash
   export OPENAI_API_KEY="your-api-key"
   python backend/scripts/translate_templates.py
   ```

3. Veya manuel olarak `create_default_templates_full.py` dosyasına İngilizce alanları ekleyin.

## Not

KVKK şablonu Türkçe olarak kalacak ve çevrilmeyecek.
