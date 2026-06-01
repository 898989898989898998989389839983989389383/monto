# Monto

Monto is a Vite/React education app with an Express API and Postgres database.

## Setup

1. Create or choose a Postgres database.
2. Add your connection details to `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
CLOUDINARY_URL=cloudinary://[API-KEY]:[API-SECRET]@[CLOUD-NAME]
CLOUDINARY_PDF_URL=cloudinary://[PDF-API-KEY]:[PDF-API-SECRET]@[PDF-CLOUD-NAME]
CLOUDINARY_THUMBNAIL_URL=cloudinary://[THUMBNAIL-API-KEY]:[THUMBNAIL-API-SECRET]@[THUMBNAIL-CLOUD-NAME]
CLOUDINARY_FOLDER=monto
GOOGLE_SMTP_USER=[YOUR-GMAIL-ADDRESS]
GOOGLE_SMTP_APP_PASSWORD=[YOUR-GMAIL-APP-PASSWORD]
SMTP_FROM_EMAIL=[YOUR-GMAIL-ADDRESS]
```

3. Start the app:

```bash
npm run dev
```

On first boot, the server creates the tables it needs and seeds starter data automatically.

## Notes

- `lib/mysql.ts` is still the shared database adapter file name, but it uses Postgres so the existing API layer keeps working.
- Postgres SSL is enabled by default. Set `POSTGRES_SSL=false` only for a local Postgres instance.
- Slider and question images are stored in the primary Cloudinary account. Course and video thumbnails use `CLOUDINARY_THUMBNAIL_URL`/`CLOUDINARY_ACCOUNT_2_URL`, falling back to `CLOUDINARY_PDF_URL`; uploaded PDF notes use `CLOUDINARY_PDF_URL`.
- Signup email verification and forgot-password OTP emails use Google SMTP. Create a Google app password and set `GOOGLE_SMTP_USER` plus `GOOGLE_SMTP_APP_PASSWORD`.
