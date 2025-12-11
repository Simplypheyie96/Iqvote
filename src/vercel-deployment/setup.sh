#!/bin/bash

# IQ Vote - Setup Script for Deployment
# This script creates the necessary directory structure

echo "🚀 IQ Vote - Deployment Setup"
echo "================================"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."

mkdir -p src/components/ui
mkdir -p src/components/figma
mkdir -p src/imports
mkdir -p src/styles
mkdir -p src/types
mkdir -p src/utils/supabase
mkdir -p src/assets
mkdir -p public
mkdir -p supabase/functions/make-server-e2c9f810

echo "✅ Directory structure created!"
echo ""

# Create src/utils/supabase/info.tsx with environment variable support
echo "📝 Creating environment-based Supabase config..."

cat > src/utils/supabase/info.tsx << 'EOF'
// This file reads Supabase configuration from environment variables
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file

export const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || ''
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
EOF

echo "✅ Supabase config created!"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created! Please add your Supabase credentials."
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your files from Figma Make (see COPY_FILES_GUIDE.md)"
echo "2. Update .env with your Supabase credentials"
echo "3. Run 'npm install'"
echo "4. Run 'npm run dev' to test locally"
echo "5. See DEPLOYMENT_GUIDE.md for deploying to Vercel"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Project overview"
echo "  - COPY_FILES_GUIDE.md - File copying instructions"
echo "  - DEPLOYMENT_GUIDE.md - Deployment instructions"
echo ""
