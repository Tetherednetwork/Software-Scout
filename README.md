# SoftMonk AI

This is a web application that helps users find safe software, games, and drivers.

## Running the Project Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Create an environment file:**
    Create a file named `.env` in the root of the project and add the following environment variables. You can get these keys from their respective services.

    ```
    VITE_API_KEY=your_gemini_api_key
    VITE_OPENAI_API_KEY=your_openai_api_key
    VITE_AZURE_API_KEY=your_azure_ai_foundry_api_key
    VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` or a similar port.

## Deploying to Vercel

1.  **Push your code to a GitHub repository.**
2.  **Import your project into Vercel.**
    *   Sign up for a Vercel account and connect it to your GitHub.
    *   Click "Add New... > Project" and import your GitHub repository.
3.  **Configure the project.**
    *   Vercel will automatically detect that this is a Vite project and set the Build Command to `npm run build` and the Output Directory to `dist`. These settings are correct.
4.  **Add Environment Variables.**
    *   In your Vercel project's settings, go to "Environment Variables".
    *   Add all the variables from your `.env` file (e.g., `VITE_API_KEY`, `VITE_AZURE_API_KEY`, `VITE_SUPABASE_URL`).
5.  **Deploy.**
    *   Click the "Deploy" button. Vercel will build and deploy your site. Any future pushes to your main branch will automatically trigger a new deployment.