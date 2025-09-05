@echo off
echo 🛒 E-Shop - Starting Full Stack E-Commerce Platform
echo ===================================================

echo.
echo ✅ Step 1: Starting MongoDB...
if not exist C:\data\db mkdir C:\data\db
start "MongoDB" mongod --dbpath=C:\data\db --bind_ip_all --port=27017
timeout /t 5

echo.
echo ✅ Step 2: Starting Backend Server...
cd backend
start "Backend Server" cmd /c "npm run dev & pause"
timeout /t 3

echo.
echo ✅ Step 3: Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /c "set PORT=4000 && npm start & pause"

echo.
echo 🎉 All servers are starting!
echo.
echo 📊 Access Points:
echo - Frontend: http://localhost:4000
echo - Backend API: http://localhost:5000
echo.
echo 👥 Demo Accounts:
echo - User: demo@example.com / Demo123!
echo - Admin: admin@example.com / Admin123!
echo.
echo 💳 Test Payment:
echo - Card: 4242 4242 4242 4242
echo - Expiry: Any future date (12/25)
echo - CVC: Any 3 digits (123)
echo.
echo Press any key to close this window...
pause
