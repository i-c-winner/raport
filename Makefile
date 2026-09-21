PYTHON ?= python3
API_DIR = apps/api
WEB_DIR = apps/web

.PHONY: install-api install-web run-api run-web test compile

install-api:
	cd $(API_DIR) && $(PYTHON) -m pip install -r requirements.txt

install-web:
	cd $(WEB_DIR) && npm install

run-api:
	cd $(API_DIR) && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

run-web:
	cd $(WEB_DIR) && npm run dev

test:
	cd $(API_DIR) && $(PYTHON) -m pytest tests -q

compile:
	cd /home/dimitriy/projects/pm/raport && $(PYTHON) -m compileall apps/api/app
