@echo off
echo 🛒 E-Shop - Full Stack E-Commerce Platform Setup
echo ================================================

echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Backend installation failed!
    pause
    exit /b 1
)

echo.
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ❌ Frontend installation failed!
    pause
    exit /b 1
)

echo.
echo 📝 Creating environment files...
cd ..
copy backend\.env backend\.env.local 2>nul
copy frontend\.env.example frontend\.env 2>nul

echo.
echo ✅ Setup completed successfully!
echo.
echo 🚀 Next steps:
echo 1. Configure your environment variables:
echo    - backend\.env (MongoDB URI, JWT secret, Stripe keys)
echo    - frontend\.env (Stripe publishable key)
echo.
echo 2. Seed the database:
echo    cd backend
echo    node scripts\seedData.js
echo.
echo 3. Start the servers:
echo    Backend: cd backend && npm run dev
echo    Frontend: cd frontend && npm start
echo.
echo 📚 Check README.md for detailed instructions
echo.
pause
