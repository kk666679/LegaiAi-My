# ============================================
# LAWMATE MAKEFILE
# Malaysian Legal AI Platform with LOM Integration
# Version: 2026.1
# ============================================

# ============================================
# Colors and Formatting
# ============================================
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
PURPLE := \033[0;35m
CYAN   := \033[0;36m
WHITE  := \033[0;37m
BOLD   := \033[1m
RESET  := \033[0m

# ============================================
# Variables
# ============================================
PYTHON          := python3
PIP             := pip3
POETRY          := poetry
AUTOCLAW_DIR    := .autoclaw
LOM_CRAWLER     := $(AUTOCLAW_DIR)/openclaw/tools/external_tools/lom_crawler.py
CONST_TRACKER   := $(AUTOCLAW_DIR)/openclaw/tools/legal_tools/constitutional_tracker.py
ORCHESTRATOR    := $(AUTOCLAW_DIR)/orchestrator/orchestration_engine.py
MEMORY_MANAGER  := $(AUTOCLAW_DIR)/spine/memory_manager.py
GOLD_VALIDATOR  := $(AUTOCLAW_DIR)/scripts/validate_gold.py

YEARS           := 2023 2024 2025 2026
DEFAULT_YEAR    := 2026

LOG_DIR         := $(AUTOCLAW_DIR)/logs
LOG_FILE        := $(LOG_DIR)/lawmate_$(shell date +%Y%m%d_%H%M%S).log

.DEFAULT_GOAL := help

# ============================================
# Help
# ============================================
.PHONY: help
help:
	@echo "$(BOLD)$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo "$(BOLD)$(PURPLE)  🏛️  LAWMATE - Malaysian Legal AI Platform$(RESET)"
	@echo "$(BOLD)$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN)📦 INSTALLATION & SETUP:$(RESET)"
	@echo "  $(YELLOW)make init$(RESET)        - Initialize the entire system"
	@echo "  $(YELLOW)make setup$(RESET)       - Setup Python environment"
	@echo "  $(YELLOW)make install$(RESET)     - Install all dependencies"
	@echo "  $(YELLOW)make update$(RESET)      - Update dependencies"
	@echo ""
	@echo "$(BOLD)$(BLUE)🕷️  LOM CRAWLER (Malaysian Federal Legislation):$(RESET)"
	@echo "  $(YELLOW)make lom-crawl$(RESET)   - Full LOM crawl (all years)"
	@echo "  $(YELLOW)make lom-crawl-year Y=2026$(RESET) - Crawl specific year"
	@echo "  $(YELLOW)make lom-crawl-pua Y=2026$(RESET) - Crawl P.U. (A) only"
	@echo "  $(YELLOW)make lom-crawl-pub Y=2026$(RESET) - Crawl P.U. (B) only"
	@echo "  $(YELLOW)make lom-crawl-acts$(RESET) - Crawl principal acts only"
	@echo "  $(YELLOW)make lom-status$(RESET)  - Show LOM crawl status"
	@echo ""
	@echo "$(BOLD)$(PURPLE)📜 CONSTITUTIONAL AMENDMENT TRACKING:$(RESET)"
	@echo "  $(YELLOW)make const-track$(RESET) - Track constitutional amendments"
	@echo "  $(YELLOW)make const-report$(RESET) - Generate constitutional report"
	@echo "  $(YELLOW)make const-article A=5$(RESET) - Report for specific article"
	@echo ""
	@echo "$(BOLD)$(GREEN)💾 GOLD DATASET:$(RESET)"
	@echo "  $(YELLOW)make gold-generate$(RESET) - Generate gold questions from LOM"
	@echo "  $(YELLOW)make gold-validate$(RESET) - Validate gold dataset"
	@echo "  $(YELLOW)make gold-export$(RESET)  - Export gold dataset"
	@echo "  $(YELLOW)make gold-stats$(RESET)  - Show gold dataset statistics"
	@echo ""
	@echo "$(BOLD)$(CYAN)🧠 MEMORY SYSTEM:$(RESET)"
	@echo "  $(YELLOW)make memory-init$(RESET) - Initialize memory system"
	@echo "  $(YELLOW)make memory-clean$(RESET) - Clean memory cache"
	@echo "  $(YELLOW)make memory-backup$(RESET) - Backup memory"
	@echo "  $(YELLOW)make memory-restore$(RESET) - Restore memory from backup"
	@echo ""
	@echo "$(BOLD)$(BLUE)🤖 AGENTS:$(RESET)"
	@echo "  $(YELLOW)make agents-init$(RESET) - Initialize agents"
	@echo "  $(YELLOW)make agents-list$(RESET) - List all agents"
	@echo "  $(YELLOW)make agents-start$(RESET) - Start agent system"
	@echo "  $(YELLOW)make agents-stop$(RESET)  - Stop agent system"
	@echo ""
	@echo "$(BOLD)$(PURPLE)📊 VECTOR & KNOWLEDGE GRAPH:$(RESET)"
	@echo "  $(YELLOW)make vector-build$(RESET) - Build vector indices"
	@echo "  $(YELLOW)make kg-build$(RESET)     - Build knowledge graph"
	@echo "  $(YELLOW)make kg-query Q='query'$(RESET) - Query knowledge graph"
	@echo "  $(YELLOW)make vector-search Q='query'$(RESET) - Semantic search"
	@echo ""
	@echo "$(BOLD)$(YELLOW)📈 METRICS & REPORTING:$(RESET)"
	@echo "  $(YELLOW)make metrics$(RESET)      - Show all metrics"
	@echo "  $(YELLOW)make metrics-lom$(RESET)  - Show LOM metrics"
	@echo "  $(YELLOW)make metrics-gold$(RESET) - Show gold metrics"
	@echo "  $(YELLOW)make metrics-agents$(RESET) - Show agent metrics"
	@echo ""
	@echo "$(BOLD)$(RED)🧹 CLEANUP:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)        - Clean generated files"
	@echo "  $(YELLOW)make clean-all$(RESET)    - Full clean (danger!)"
	@echo "  $(YELLOW)make clean-logs$(RESET)   - Clean log files"
	@echo ""
	@echo "$(BOLD)$(GREEN)🚀 RUN:$(RESET)"
	@echo "  $(YELLOW)make run$(RESET)          - Start LawMate orchestrator"
	@echo "  $(YELLOW)make run-workflow W=gold_validation$(RESET) - Run specific workflow"
	@echo "  $(YELLOW)make shell$(RESET)        - Open interactive shell"
	@echo ""
	@echo "$(BOLD)$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@echo "$(BOLD)$(WHITE)  📅 Supported Years: $(YEARS)$(RESET)"
	@echo "$(BOLD)$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"

# ============================================
# Installation & Setup
# ============================================

.PHONY: init setup install update

init:
	@echo "$(BOLD)$(GREEN)🚀 Initializing LawMate System...$(RESET)"
	@mkdir -p $(AUTOCLAW_DIR)
	@mkdir -p $(LOG_DIR)
	@mkdir -p $(AUTOCLAW_DIR)/kdream/memory/ltm/gold_standard/v3.0
	@mkdir -p $(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler
	@mkdir -p $(AUTOCLAW_DIR)/metrics/gold_reports/2026
	@mkdir -p $(AUTOCLAW_DIR)/vector/embeddings/2026
	@chmod +x $(AUTOCLAW_DIR)/scripts/*.py 2>/dev/null || true
	@echo "$(GREEN)✅ System initialized!$(RESET)"

setup:
	@echo "$(BOLD)$(GREEN)📦 Setting up Python environment...$(RESET)"
	@$(PYTHON) -m venv venv
	@. venv/bin/activate && $(PIP) install --upgrade pip
	@echo "$(GREEN)✅ Environment setup complete!$(RESET)"
	@echo "$(YELLOW)Run 'source venv/bin/activate' to activate$(RESET)"

install:
	@echo "$(BOLD)$(GREEN)📦 Installing dependencies...$(RESET)"
	@$(PIP) install -r requirements.txt
	@$(PIP) install requests beautifulsoup4 lxml sqlite3
	@echo "$(GREEN)✅ Dependencies installed!$(RESET)"

update:
	@echo "$(BOLD)$(GREEN)🔄 Updating dependencies...$(RESET)"
	@$(PIP) install --upgrade -r requirements.txt
	@echo "$(GREEN)✅ Dependencies updated!$(RESET)"

# ============================================
# LOM Crawler Commands
# ============================================

.PHONY: lom-crawl lom-crawl-year lom-crawl-pua lom-crawl-pub lom-crawl-acts lom-status

lom-crawl:
	@echo "$(BOLD)$(BLUE)🕷️  Running full LOM crawl for all years...$(RESET)"
	@$(PYTHON) $(LOM_CRAWLER) --full
	@echo "$(GREEN)✅ LOM crawl completed!$(RESET)"

lom-crawl-year:
	@echo "$(BOLD)$(BLUE)🕷️  Running LOM crawl for year $(Y)...$(RESET)"
	@$(PYTHON) $(LOM_CRAWLER) --year $(Y)
	@echo "$(GREEN)✅ LOM crawl for $(Y) completed!$(RESET)"

lom-crawl-pua:
	@echo "$(BOLD)$(BLUE)🕷️  Crawling P.U. (A) amendments for $(Y)...$(RESET)"
	@$(PYTHON) $(LOM_CRAWLER) --pua-only --year $(Y)
	@echo "$(GREEN)✅ P.U. (A) crawl completed!$(RESET)"

lom-crawl-pub:
	@echo "$(BOLD)$(BLUE)🕷️  Crawling P.U. (B) regulations for $(Y)...$(RESET)"
	@$(PYTHON) $(LOM_CRAWLER) --pub-only --year $(Y)
	@echo "$(GREEN)✅ P.U. (B) crawl completed!$(RESET)"

lom-crawl-acts:
	@echo "$(BOLD)$(BLUE)🕷️  Crawling principal acts...$(RESET)"
	@$(PYTHON) $(LOM_CRAWLER) --acts-only
	@echo "$(GREEN)✅ Principal acts crawl completed!$(RESET)"

lom-status:
	@echo "$(BOLD)$(BLUE)📊 LOM Crawl Status...$(RESET)"
	@$(PYTHON) -c "
import json
from pathlib import Path
db_path = Path('$(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler/lom_index.db')
import sqlite3
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute('SELECT * FROM crawl_history ORDER BY id DESC LIMIT 5')
rows = cursor.fetchall()
for row in rows:
    print(f'  📅 {row[2]} - {row[9]} (Acts: {row[5]}, PUA: {row[6]}, PUB: {row[7]})')
cursor.execute('SELECT COUNT(*) FROM principal_acts')
total_acts = cursor.fetchone()[0]
cursor.execute('SELECT COUNT(*) FROM pua_amendments')
total_pua = cursor.fetchone()[0]
cursor.execute('SELECT COUNT(*) FROM pub_regulations')
total_pub = cursor.fetchone()[0]
print(f'  📚 Total: Acts={total_acts}, P.U.(A)={total_pua}, P.U.(B)={total_pub}')
conn.close()
"

# ============================================
# Constitutional Amendment Tracking
# ============================================

.PHONY: const-track const-report const-article

const-track:
	@echo "$(BOLD)$(PURPLE)📜 Tracking constitutional amendments...$(RESET)"
	@$(PYTHON) $(CONST_TRACKER)
	@echo "$(GREEN)✅ Constitutional amendments tracked!$(RESET)"

const-report:
	@echo "$(BOLD)$(PURPLE)📜 Generating constitutional report...$(RESET)"
	@$(PYTHON) $(CONST_TRACKER) --report
	@echo "$(GREEN)✅ Report generated at $(AUTOCLAW_DIR)/metrics/gold_reports/2026/constitutional_report.html$(RESET)"

const-article:
	@echo "$(BOLD)$(PURPLE)📜 Showing Article $(A) amendments...$(RESET)"
	@$(PYTHON) -c "
import json
from pathlib import Path
db_path = Path('$(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler/lom_index.db')
import sqlite3
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute('SELECT * FROM constitutional_amendments WHERE article = ? ORDER BY year DESC', ('$(A)',))
rows = cursor.fetchall()
if rows:
    print(f'  📜 Article $(A) Amendments:')
    for row in rows:
        print(f'    • {row[3]}/{row[4]}: {row[7]}')
else:
    print('  ❌ No amendments found for Article $(A)')
conn.close()
"

# ============================================
# Gold Dataset Commands
# ============================================

.PHONY: gold-generate gold-validate gold-export gold-stats

gold-generate:
	@echo "$(BOLD)$(GREEN)💾 Generating gold questions from LOM...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/scripts/generate_gold_from_lom.py --output $(AUTOCLAW_DIR)/kdream/memory/ltm/gold_standard/v3.0/gold_lom_2026.json
	@echo "$(GREEN)✅ Gold questions generated!$(RESET)"

gold-validate:
	@echo "$(BOLD)$(GREEN)💾 Validating gold dataset...$(RESET)"
	@$(PYTHON) $(GOLD_VALIDATOR)
	@echo "$(GREEN)✅ Gold dataset validated!$(RESET)"

gold-export:
	@echo "$(BOLD)$(GREEN)💾 Exporting gold dataset...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/scripts/export_gold.py --format json --output $(AUTOCLAW_DIR)/metrics/gold_reports/2026/gold_export.json
	@echo "$(GREEN)✅ Gold dataset exported!$(RESET)"

gold-stats:
	@echo "$(BOLD)$(GREEN)💾 Gold dataset statistics...$(RESET)"
	@$(PYTHON) -c "
import json
from pathlib import Path
gold_path = Path('$(AUTOCLAW_DIR)/kdream/memory/ltm/gold_standard/v3.0/gold_full.json')
if gold_path.exists():
    with open(gold_path) as f:
        data = json.load(f)
    questions = data.get('questions', [])
    print(f'  📚 Total questions: {len(questions)}')
    categories = {}
    for q in questions:
        cat = q.get('context', {}).get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1
    print('  📊 By category:')
    for cat, count in sorted(categories.items()):
        print(f'    • {cat}: {count}')
else:
    print('  ❌ Gold dataset not found')
"

# ============================================
# Memory System Commands
# ============================================

.PHONY: memory-init memory-clean memory-backup memory-restore

memory-init:
	@echo "$(BOLD)$(CYAN)🧠 Initializing memory system...$(RESET)"
	@$(PYTHON) $(MEMORY_MANAGER) --init
	@echo "$(GREEN)✅ Memory system initialized!$(RESET)"

memory-clean:
	@echo "$(BOLD)$(CYAN)🧹 Cleaning memory cache...$(RESET)"
	@rm -rf $(AUTOCLAW_DIR)/kdream/memory/stm/cache/*
	@rm -rf $(AUTOCLAW_DIR)/kdream/memory/stm/sessions/active/*
	@echo "$(GREEN)✅ Memory cache cleaned!$(RESET)"

memory-backup:
	@echo "$(BOLD)$(CYAN)💾 Backing up memory...$(RESET)"
	@mkdir -p $(AUTOCLAW_DIR)/backups/memory_$(shell date +%Y%m%d)
	@cp -r $(AUTOCLAW_DIR)/kdream/memory/ltm $(AUTOCLAW_DIR)/backups/memory_$(shell date +%Y%m%d)/
	@cp -r $(AUTOCLAW_DIR)/vector $(AUTOCLAW_DIR)/backups/memory_$(shell date +%Y%m%d)/
	@echo "$(GREEN)✅ Memory backed up!$(RESET)"

memory-restore:
	@echo "$(BOLD)$(CYAN)🔄 Restoring memory...$(RESET)"
	@echo "$(YELLOW)⚠️  This will overwrite current memory!$(RESET)"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@echo "Select backup:"
	@ls -1 $(AUTOCLAW_DIR)/backups/ | grep memory_
	@echo -n "Enter backup name: " && read backup
	@cp -r $(AUTOCLAW_DIR)/backups/$$backup/ltm $(AUTOCLAW_DIR)/kdream/memory/
	@cp -r $(AUTOCLAW_DIR)/backups/$$backup/vector $(AUTOCLAW_DIR)/
	@echo "$(GREEN)✅ Memory restored!$(RESET)"

# ============================================
# Agent Commands
# ============================================

.PHONY: agents-init agents-list agents-start agents-stop

agents-init:
	@echo "$(BOLD)$(BLUE)🤖 Initializing agents...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/spine/agent_manager.py --init
	@$(PYTHON) $(AUTOCLAW_DIR)/openclaw/agent_factory.py --build
	@echo "$(GREEN)✅ Agents initialized!$(RESET)"

agents-list:
	@echo "$(BOLD)$(BLUE)🤖 Agents list...$(RESET)"
	@$(PYTHON) -c "
import yaml
from pathlib import Path
agent_dir = Path('$(AUTOCLAW_DIR)/openclaw/agents')
print('  🏛️ System Agents:')
for f in (agent_dir / 'system_agents').glob('*.yaml'):
    with open(f) as fp:
        data = yaml.safe_load(fp)
        print(f'    • {data.get(\"agent_id\")} - {data.get(\"description\")}')
print('  🎯 Specialist Agents:')
for f in (agent_dir / 'specialist_agents').glob('*.yaml'):
    with open(f) as fp:
        data = yaml.safe_load(fp)
        print(f'    • {data.get(\"agent_id\")} - {data.get(\"description\")}')
print('  ⚡ Skill Agents:')
for f in (agent_dir / 'skill_agents').glob('*.yaml'):
    with open(f) as fp:
        data = yaml.safe_load(fp)
        print(f'    • {data.get(\"agent_id\")} - {data.get(\"description\")}')
"

agents-start:
	@echo "$(BOLD)$(BLUE)🤖 Starting agent system...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/orchestrator/orchestration_engine.py --start
	@echo "$(GREEN)✅ Agent system started!$(RESET)"

agents-stop:
	@echo "$(BOLD)$(BLUE)🤖 Stopping agent system...$(RESET)"
	@pkill -f "orchestration_engine.py" 2>/dev/null || true
	@echo "$(GREEN)✅ Agent system stopped!$(RESET)"

# ============================================
# Vector & Knowledge Graph
# ============================================

.PHONY: vector-build kg-build kg-query vector-search

vector-build:
	@echo "$(BOLD)$(PURPLE)📊 Building vector indices...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/vector/vector_manager.py --build
	@echo "$(GREEN)✅ Vector indices built!$(RESET)"

kg-build:
	@echo "$(BOLD)$(PURPLE)📊 Building knowledge graph...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/kg/kg_manager.py --build
	@echo "$(GREEN)✅ Knowledge graph built!$(RESET)"

kg-query:
	@echo "$(BOLD)$(PURPLE)📊 Querying knowledge graph: $(Q)...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/kg/kg_manager.py --query "$(Q)"
	@echo "$(GREEN)✅ Query executed!$(RESET)"

vector-search:
	@echo "$(BOLD)$(PURPLE)📊 Vector search: $(Q)...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/vector/vector_manager.py --search "$(Q)"
	@echo "$(GREEN)✅ Search completed!$(RESET)"

# ============================================
# Metrics & Reporting
# ============================================

.PHONY: metrics metrics-lom metrics-gold metrics-agents

metrics:
	@echo "$(BOLD)$(YELLOW)📈 System metrics...$(RESET)"
	@$(PYTHON) $(AUTOCLAW_DIR)/metrics/metrics_aggregator.py --all

metrics-lom:
	@echo "$(BOLD)$(YELLOW)📈 LOM metrics...$(RESET)"
	@$(PYTHON) -c "
import json
from pathlib import Path
lom_dir = Path('$(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler')
for f in ['act_index.json', 'pua_index.json', 'pub_index.json']:
    if (lom_dir / f).exists():
        with open(lom_dir / f) as fp:
            data = json.load(fp)
        print(f'  📊 {f}: {data.get(\"total_acts\") or data.get(\"total_pua\") or data.get(\"total_pub\")} items')
"

metrics-gold:
	@echo "$(BOLD)$(YELLOW)📈 Gold dataset metrics...$(RESET)"
	@$(MAKE) gold-stats

metrics-agents:
	@echo "$(BOLD)$(YELLOW)📈 Agent metrics...$(RESET)"
	@if [ -f $(AUTOCLAW_DIR)/metrics/agent_metrics/agent_accuracy.json ]; then \
		cat $(AUTOCLAW_DIR)/metrics/agent_metrics/agent_accuracy.json | python -m json.tool; \
	else \
		echo "  ❌ Agent metrics not found"; \
	fi

# ============================================
# Run Commands
# ============================================

.PHONY: run run-workflow shell

run:
	@echo "$(BOLD)$(GREEN)🚀 Starting LawMate orchestrator...$(RESET)"
	@$(PYTHON) $(ORCHESTRATOR) --start
	@echo "$(GREEN)✅ Orchestrator running!$(RESET)"

run-workflow:
	@echo "$(BOLD)$(GREEN)🚀 Running workflow: $(W)...$(RESET)"
	@$(PYTHON) $(ORCHESTRATOR) --workflow "$(W)"
	@echo "$(GREEN)✅ Workflow $(W) completed!$(RESET)"

shell:
	@echo "$(BOLD)$(GREEN)🔧 Opening interactive shell...$(RESET)"
	@$(PYTHON) -i -c "print('LawMate Interactive Shell'); import sys; sys.path.append('.autoclaw')"

# ============================================
# Cleanup Commands
# ============================================

.PHONY: clean clean-all clean-logs

clean:
	@echo "$(BOLD)$(RED)🧹 Cleaning generated files...$(RESET)"
	@find $(AUTOCLAW_DIR) -name "*.pyc" -delete
	@find $(AUTOCLAW_DIR) -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find $(AUTOCLAW_DIR) -name "*.tmp" -delete
	@rm -rf $(AUTOCLAW_DIR)/vector/embeddings/*.parquet
	@rm -rf $(AUTOCLAW_DIR)/autobuild/artifacts/*
	@echo "$(GREEN)✅ Cleaned!$(RESET)"

clean-all:
	@echo "$(BOLD)$(RED)⚠️  DANGER: This will delete ALL generated data!$(RESET)"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@rm -rf $(AUTOCLAW_DIR)/kdream/memory/ltm/gold_standard/v3.0/*
	@rm -rf $(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler/*
	@rm -rf $(AUTOCLAW_DIR)/vector/indices/*
	@rm -rf $(AUTOCLAW_DIR)/kg/kg.db
	@rm -rf $(AUTOCLAW_DIR)/metrics/*.json
	@rm -rf $(AUTOCLAW_DIR)/orchestrator/board.json
	@rm -rf $(AUTOCLAW_DIR)/orchestrator/sprints/*
	@echo "$(GREEN)✅ Full clean completed!$(RESET)"

clean-logs:
	@echo "$(BOLD)$(RED)🧹 Cleaning log files...$(RESET)"
	@rm -rf $(AUTOCLAW_DIR)/logs/*.log
	@rm -rf $(AUTOCLAW_DIR)/orchestrator/audit/*/*.log
	@rm -rf $(AUTOCLAW_DIR)/workflows/traces/*/*.json
	@echo "$(GREEN)✅ Logs cleaned!$(RESET)"

# ============================================
# Combined Commands
# ============================================

.PHONY: full-update full-build lom-full-2026

full-update:
	@echo "$(BOLD)$(GREEN)🔄 Full system update...$(RESET)"
	$(MAKE) update
	$(MAKE) lom-crawl
	$(MAKE) const-track
	$(MAKE) gold-generate
	$(MAKE) gold-validate
	$(MAKE) vector-build
	$(MAKE) kg-build
	@echo "$(GREEN)✅ Full update completed!$(RESET)"

full-build:
	@echo "$(BOLD)$(GREEN)🏗️  Full system build...$(RESET)"
	$(MAKE) init
	$(MAKE) install
	$(MAKE) memory-init
	$(MAKE) agents-init
	$(MAKE) lom-crawl
	$(MAKE) gold-validate
	@echo "$(GREEN)✅ Full build completed!$(RESET)"

lom-full-2026:
	@echo "$(BOLD)$(BLUE)🕷️  Full LOM 2026 crawl...$(RESET)"
	$(MAKE) lom-crawl-year Y=2026
	$(MAKE) lom-crawl-pua Y=2026
	$(MAKE) lom-crawl-pub Y=2026
	$(MAKE) const-track
	$(MAKE) gold-generate
	@echo "$(GREEN)✅ LOM 2026 crawl completed!$(RESET)"

# ============================================
# Development Commands
# ============================================

.PHONY: dev test lint format

dev:
	@echo "$(BOLD)$(GREEN)🧑‍💻 Starting development mode...$(RESET)"
	@export PYTHONPATH=$(AUTOCLAW_DIR):$$PYTHONPATH
	@$(PYTHON) -m ipython

test:
	@echo "$(BOLD)$(GREEN)🧪 Running tests...$(RESET)"
	@pytest $(AUTOCLAW_DIR)/tests/ -v

lint:
	@echo "$(BOLD)$(GREEN)🔍 Running linters...$(RESET)"
	@flake8 $(AUTOCLAW_DIR)/**/*.py 2>/dev/null || echo "  ⚠️ flake8 not installed"
	@black --check $(AUTOCLAW_DIR)/**/*.py 2>/dev/null || echo "  ⚠️ black not installed"

format:
	@echo "$(BOLD)$(GREEN)🎨 Formatting code...$(RESET)"
	@black $(AUTOCLAW_DIR)/**/*.py 2>/dev/null || echo "  ⚠️ black not installed"
	@echo "$(GREEN)✅ Formatted!$(RESET)"

# ============================================
# Docker Commands
# ============================================

.PHONY: docker-build docker-up docker-down docker-logs

docker-build:
	@echo "$(BOLD)$(BLUE)🐳 Building Docker image...$(RESET)"
	@docker build -t lawmate:latest .
	@echo "$(GREEN)✅ Docker image built!$(RESET)"

docker-up:
	@echo "$(BOLD)$(BLUE)🐳 Starting containers...$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Containers started!$(RESET)"

docker-down:
	@echo "$(BOLD)$(BLUE)🐳 Stopping containers...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ Containers stopped!$(RESET)"

docker-logs:
	@echo "$(BOLD)$(BLUE)🐳 Showing logs...$(RESET)"
	@docker-compose logs -f

# ============================================
# Database Commands
# ============================================

.PHONY: db-export db-import

db-export:
	@echo "$(BOLD)$(PURPLE)💾 Exporting database...$(RESET)"
	@mkdir -p $(AUTOCLAW_DIR)/backups
	@sqlite3 $(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler/lom_index.db ".dump" > $(AUTOCLAW_DIR)/backups/lom_db_$(shell date +%Y%m%d).sql
	@echo "$(GREEN)✅ Database exported!$(RESET)"

db-import:
	@echo "$(BOLD)$(PURPLE)💾 Importing database...$(RESET)"
	@echo "Select backup:"
	@ls -1 $(AUTOCLAW_DIR)/backups/ | grep lom_db_
	@echo -n "Enter backup name: " && read backup
	@sqlite3 $(AUTOCLAW_DIR)/kdream/memory/ltm/lom_crawler/lom_index.db < $(AUTOCLAW_DIR)/backups/$$backup
	@echo "$(GREEN)✅ Database imported!$(RESET)"

# ============================================
# Default values for variables
# ============================================
Y = $(DEFAULT_YEAR)
A = 5
W = gold_validation
Q = "What is judicial review?"

# ============================================
# END OF MAKEFILE
# ============================================
