# Supabase Webhook Setup

Follow these steps to set up the document processing webhook in your Supabase dashboard:

1. Go to your **Supabase Dashboard** → **Database** → **Webhooks**.
2. Click **Create webhook**.
3. **Name**: `document-processing`
4. **Table**: `public.documents`
5. **Events**: Select **INSERT** only.
6. **URL**: 
   - Local Docker development: `http://transcription:8000/webhooks/document-created`
   - Production: `https://your-transcription-service.railway.app/webhooks/document-created`
7. **HTTP Headers**:
   - Key: `x-webhook-secret`
   - Value: `{your-webhook-secret}` (Make sure this matches the `WEBHOOK_SECRET` in your `.env` file)
8. **Method**: `POST`
9. Click **Create webhook**.

### Testing

Upload a document via the frontend. Check the transcription service logs to verify it received the webhook and processed the document:

```bash
docker compose logs -f transcription
```
