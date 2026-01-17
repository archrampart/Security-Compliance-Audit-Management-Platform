#!/bin/bash
# Full Startup Script - All checks and startup

set -e

# Application Version
APP_VERSION="1.0.0"
APP_NAME="ArchRampart Audit Tool"

# ASCII Art Banner
echo ""
echo "    _             _     ____                                   _   "
echo "   / \\   _ __ ___| |__ |  _ \\ __ _ _ __ ___  _ __   __ _ _ __| |_ "
echo "  / _ \\ | '__/ __| '_ \\| |_) / _\` | '_ \` _ \\| '_ \\ / _\` | '__| __|"
echo " / ___ \\| | | (__| | | |  _ < (_| | | | | | | |_) | (_| | |  | |_ "
echo "/_/   \\_\\_|  \\___|_| |_|_| \\_\\__,_|_| |_| |_| .__/ \\__,_|_|   \\__|"
echo "                                            |_|                    "
echo ""
echo "🛡️  $APP_NAME v$APP_VERSION"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect OS early
OS_TYPE=$(uname -s)

# Set PostgreSQL path for macOS (Homebrew)
if [[ "$OS_TYPE" == "Darwin" ]]; then
    export PATH="/opt/homebrew/opt/postgresql@15/bin:/opt/homebrew/opt/postgresql/bin:$PATH"
fi

# 1. Clean old processes
echo "1️⃣  Cleaning old processes..."
lsof -ti:9090 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}   ✅ Cleaned${NC}"

# 2. PostgreSQL check
echo ""
echo "2️⃣  Checking PostgreSQL..."

if ! command -v pg_isready &> /dev/null; then
    echo -e "${YELLOW}   pg_isready not found, checking PostgreSQL installation...${NC}"
    if [[ "$OS_TYPE" == "Darwin" ]]; then
        if ! brew list postgresql@15 &>/dev/null && ! brew list postgresql &>/dev/null; then
            echo -e "${YELLOW}   Installing PostgreSQL via Homebrew...${NC}"
            brew install postgresql@15
        fi
        export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
    fi
fi

if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}   PostgreSQL is not running, starting...${NC}"
    if [[ "$OS_TYPE" == "Darwin" ]]; then
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || {
            echo -e "${RED}   ❌ PostgreSQL could not be started!${NC}"
            echo "   Please start manually: brew services start postgresql@15"
            exit 1
        }
    else
        sudo systemctl start postgresql 2>/dev/null || {
            echo -e "${RED}   ❌ PostgreSQL could not be started!${NC}"
            echo "   Please start manually: sudo systemctl start postgresql"
            exit 1
        }
    fi
    sleep 2
fi
echo -e "${GREEN}   ✅ PostgreSQL is running${NC}"

# 3. Database check
echo ""
echo "3️⃣  Checking database..."
if ! PGPASSWORD=archrampart_pass psql -h localhost -U archrampart -d archrampart_audit -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${YELLOW}   Creating database...${NC}"
    if [[ "$OS_TYPE" == "Darwin" ]]; then
        # macOS: current user typically has superuser access
        psql postgres << SQL
CREATE DATABASE archrampart_audit;
CREATE USER archrampart WITH PASSWORD 'archrampart_pass';
GRANT ALL PRIVILEGES ON DATABASE archrampart_audit TO archrampart;
ALTER DATABASE archrampart_audit OWNER TO archrampart;
\q
SQL
    else
        # Linux: use postgres user
        sudo -u postgres psql << SQL
CREATE DATABASE archrampart_audit;
CREATE USER archrampart WITH PASSWORD 'archrampart_pass';
GRANT ALL PRIVILEGES ON DATABASE archrampart_audit TO archrampart;
ALTER DATABASE archrampart_audit OWNER TO archrampart;
\q
SQL
    fi
fi
echo -e "${GREEN}   ✅ Database ready${NC}"

# 4. Node.js check
echo ""
echo "4️⃣  Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}   Installing Node.js...${NC}"
    if [[ "$OS_TYPE" == "Darwin" ]]; then
        brew install node
    elif command -v snap &> /dev/null; then
        sudo snap install node --classic
    elif command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo -e "${RED}   ❌ Node.js could not be installed!${NC}"
        echo "   Please install Node.js manually: https://nodejs.org"
        exit 1
    fi
fi
echo -e "${GREEN}   ✅ Node.js: $(node --version)${NC}"

# 5. Backend dependencies
echo ""
echo "5️⃣  Checking backend dependencies..."
cd backend

# Determine Python executable (use Python 3.12 on macOS for Pillow compatibility)
if [[ "$OS_TYPE" == "Darwin" ]]; then
    if [ -f "/opt/homebrew/opt/python@3.12/bin/python3.12" ]; then
        PYTHON_BIN="/opt/homebrew/opt/python@3.12/bin/python3.12"
    elif [ -f "/opt/homebrew/opt/python@3.13/bin/python3.13" ]; then
        PYTHON_BIN="/opt/homebrew/opt/python@3.13/bin/python3.13"
    else
        PYTHON_BIN="python3"
    fi
else
    PYTHON_BIN="python3"
fi

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}   Creating virtual environment with $PYTHON_BIN...${NC}"
    $PYTHON_BIN -m venv venv
fi

# Use venv's pip directly to avoid externally-managed-environment error
./venv/bin/pip install -q -r requirements.txt
cd ..
echo -e "${GREEN}   ✅ Backend ready${NC}"

# 6. Frontend dependencies
echo ""
echo "6️⃣  Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo -e "${GREEN}   ✅ Frontend ready${NC}"

# 7. Start backend
echo ""
echo "7️⃣  Starting backend..."
cd backend
# Use venv's uvicorn directly
nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9090 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
cd ..
sleep 5

# Backend check
if ps -p $BACKEND_PID > /dev/null; then
    # API test
    sleep 2
    if curl -s http://localhost:9090/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend is running (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Backend started but not ready yet${NC}"
        echo "   Check logs: tail -f backend.log"
    fi
else
    echo -e "${RED}   ❌ Backend could not be started!${NC}"
    echo "   Logs:"
    tail -20 backend.log
    exit 1
fi

# 8. Start frontend
echo ""
echo "8️⃣  Starting frontend..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..
sleep 8

# Frontend check
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}   ✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}   ❌ Frontend could not be started!${NC}"
    echo "   Logs:"
    tail -20 frontend.log
    exit 1
fi

# 9. First-run setup (Auto-create admin and templates)
echo ""
echo "9️⃣  Checking first-run setup..."
cd backend

# Check and create admin user if not exists
ADMIN_EXISTS=$(./venv/bin/python -c "
import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.models.user import User, UserRole
db = SessionLocal()
admin = db.query(User).filter(User.role == UserRole.PLATFORM_ADMIN).first()
print('yes' if admin else 'no')
db.close()
" 2>/dev/null)

if [ "$ADMIN_EXISTS" = "no" ]; then
    echo -e "${YELLOW}   Creating default admin user...${NC}"
    ./venv/bin/python -c "
import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash
Base.metadata.create_all(bind=engine)
db = SessionLocal()
admin = User(
    email='admin@archrampart.com',
    hashed_password=get_password_hash('admin123'),
    full_name='Platform Admin',
    role=UserRole.PLATFORM_ADMIN,
    is_active=True,
    organization_id=None
)
db.add(admin)
db.commit()
db.close()
print('   ✅ Admin created: admin@archrampart.com / admin123')
" 2>/dev/null
else
    echo -e "${GREEN}   ✅ Admin user exists${NC}"
fi

# Check and create templates if not exists
TEMPLATE_COUNT=$(./venv/bin/python -c "
import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.models.template import Template
db = SessionLocal()
print(db.query(Template).count())
db.close()
" 2>/dev/null)

if [ "$TEMPLATE_COUNT" = "0" ]; then
    echo -e "${YELLOW}   Creating default templates...${NC}"
    ./venv/bin/python scripts/create_default_templates_full.py > /dev/null 2>&1
    echo -e "${GREEN}   ✅ Default templates created${NC}"
else
    echo -e "${GREEN}   ✅ Templates exist ($TEMPLATE_COUNT templates)${NC}"
fi

cd ..

# Cleanup function for Ctrl+C
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping application...${NC}"
    
    # Kill backend
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
            echo -e "${GREEN}   ✅ Backend stopped (PID: $BACKEND_PID)${NC}"
        fi
        rm -f .backend.pid
    fi
    
    # Kill frontend
    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null || true
            echo -e "${GREEN}   ✅ Frontend stopped (PID: $FRONTEND_PID)${NC}"
        fi
        rm -f .frontend.pid
    fi
    
    # Also kill any remaining processes on ports
    lsof -ti:9090 | xargs kill -9 2>/dev/null || true
    lsof -ti:4200 | xargs kill -9 2>/dev/null || true
    
    # Kill tail processes
    if [ ! -z "$TAIL_PID" ]; then
        kill $TAIL_PID 2>/dev/null || true
    fi
    
    echo ""
    echo -e "${GREEN}✅ Application stopped successfully!${NC}"
    exit 0
}

# Set trap for Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

# 9. Result
if [[ "$OS_TYPE" == "Darwin" ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
else
    IP=$(hostname -I | awk '{print $1}')
fi
echo ""
echo "=========================================="
echo -e "${GREEN}✅ APPLICATION STARTED SUCCESSFULLY!${NC}"
echo "=========================================="
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    📊 SERVICE STATUS                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}🖥️  Backend${NC}   │ http://$IP:9090  │ PID: $BACKEND_PID"
echo -e "║  ${GREEN}🌐 Frontend${NC}  │ http://$IP:4200  │ PID: $FRONTEND_PID"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  📚 API Docs  │ http://$IP:9090/docs                        "
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Server IP: $IP"
echo ""
echo -e "${YELLOW}📋 Press Ctrl+C to stop the application${NC}"
echo ""
echo "=========================================="
echo "               📜 LIVE LOGS               "
echo "=========================================="
echo ""

# Show live logs from both services
tail -f backend.log frontend.log &
TAIL_PID=$!

# Wait for the tail process (will be killed by Ctrl+C)
wait $TAIL_PID
