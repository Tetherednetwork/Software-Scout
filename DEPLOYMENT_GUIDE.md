# Deploying SoftMonk Backend AI

Your application uses Firebase Cloud Functions to power the AI features (OpenAI integration).
Since these run on the backend, they must be deployed separately from your frontend.

## 1. Prerequisites
You need the Firebase CLI installed on your computer.
```bash
npm install -g firebase-tools
```

## 2. Login to Firebase
```bash
firebase login
```

## 3. Configure Your OpenAI API Key
For security, we store the API key in Firebase's environment configuration, not in the code.
Run this command effectively in your terminal (replace `YOUR_KEY_HERE` with your actual OpenAI API key):

```bash
firebase functions:config:set openai.key="sk-..." 
```
*Note: Make sure you are in the project directory when running this.*

## 4. Deploy the Functions
Run this command from the root folder (`d:\Software-Scout-main\Software-Scout-main`):

```bash
firebase deploy --only functions
```

## 5. Verify
Once deployed, the `openai_chat` function will remain active.
Your web app can now call it securely.

### FAQ
**Q: I get a permission error.**
A: Make sure you are logged in with the Google Account that owns the `softmonk-221e1` project.

**Q: Do I need to do this every time?**
A: Only when you change the code in `functions/src/index.ts`. The API key only needs to be set once.
