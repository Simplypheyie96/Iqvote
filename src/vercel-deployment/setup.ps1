# IQ Vote - Setup Script for Deployment (Windows PowerShell)
# This script creates the necessary directory structure

Write-Host "🚀 IQ Vote - Deployment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path "src/components/ui" | Out-Null
New-Item -ItemType Directory -Force -Path "src/components/figma" | Out-Null
New-Item -ItemType Directory -Force -Path "src/imports" | Out-Null
New-Item -ItemType Directory -Force -Path "src/styles" | Out-Null
New-Item -ItemType Directory -Force -Path "src/types" | Out-Null
New-Item -ItemType Directory -Force -Path "src/utils/supabase" | Out-Null
New-Item -ItemType Directory -Force -Path "src/assets" | Out-Null
New-Item -ItemType Directory -Force -Path "public" | Out-Null
New-Item -ItemType Directory -Force -Path "supabase/functions/make-server-e2c9f810" | Out-Null

Write-Host "✅ Directory structure created!" -ForegroundColor Green
Write-Host ""

# Create src/utils/supabase/info.tsx with environment variable support
Write-Host "📝 Creating environment-based Supabase config..." -ForegroundColor Yellow

$supabaseInfo = @"
// This file reads Supabase configuration from environment variables
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file

export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || ''
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
"@

Set-Content -Path "src/utils/supabase/info.tsx" -Value $supabaseInfo

Write-Host "✅ Supabase config created!" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created! Please add your Supabase credentials." -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists, skipping..." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy your files from Figma Make (see COPY_FILES_GUIDE.md)" -ForegroundColor White
Write-Host "2. Update .env with your Supabase credentials" -ForegroundColor White
Write-Host "3. Run 'npm install'" -ForegroundColor White
Write-Host "4. Run 'npm run dev' to test locally" -ForegroundColor White
Write-Host "5. See DEPLOYMENT_GUIDE.md for deploying to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - README.md - Project overview" -ForegroundColor White
Write-Host "  - COPY_FILES_GUIDE.md - File copying instructions" -ForegroundColor White
Write-Host "  - DEPLOYMENT_GUIDE.md - Deployment instructions" -ForegroundColor White
Write-Host ""
