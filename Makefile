# Makefile для типових операцій із стеком Coffee Orders.
# Працює у Linux/macOS; у Windows запускайте під WSL або Git Bash.

SHELL := /bin/bash

COMPOSE      := docker compose
COMPOSE_DEV  := docker compose -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: help up up-dev down logs ps build pull restart clean \
        backend-shell db-shell migrate seed test lint format

help: ## Показати цю довідку
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# --- основний стек --------------------------------------------------
up: ## Підняти весь стек у production-режимі (db + api + web)
	$(COMPOSE) up -d --build

up-dev: ## Підняти стек у dev-режимі (hot-reload backend, frontend через Vite ззовні)
	$(COMPOSE_DEV) up

down: ## Зупинити стек і прибрати контейнери
	$(COMPOSE) down

down-volumes: ## Зупинити стек і прибрати volumes (УВАГА: дані БД буде втрачено)
	$(COMPOSE) down -v

logs: ## Подивитися логи усіх сервісів
	$(COMPOSE) logs -f --tail=200

ps: ## Список запущених контейнерів
	$(COMPOSE) ps

build: ## Зібрати образи без запуску
	$(COMPOSE) build --pull

pull: ## Підтягнути готові образи з GHCR
	$(COMPOSE) pull

restart: ## Перезапустити стек
	$(COMPOSE) restart

clean: down-volumes ## Повне очищення (контейнери, мережі, volumes)
	docker image prune -f

# --- shell-доступ ----------------------------------------------------
backend-shell: ## Зайти в контейнер backend (sh)
	$(COMPOSE) exec api sh

db-shell: ## Відкрити psql у контейнері БД
	$(COMPOSE) exec db psql -U coffee -d coffee_orders

# --- база даних -----------------------------------------------------
migrate: ## Застосувати міграції Prisma
	$(COMPOSE) exec api npx prisma migrate deploy

seed: ## Заповнити БД тестовими даними (seed.ts)
	$(COMPOSE) exec api npx tsx prisma/seed.ts

# --- локальні скрипти (без Docker) ---------------------------------
test: ## Запустити тести backend і frontend локально
	cd backend  && npm test
	cd frontend && npm test

lint: ## ESLint для обох пакетів
	cd backend  && npm run lint
	cd frontend && npm run lint

format: ## Prettier для обох пакетів
	cd backend  && npm run format
	cd frontend && npm run format
