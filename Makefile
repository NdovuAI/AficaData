# Makefile for microservices management

.PHONY: build up down logs clean dev prod

# Development commands
dev:
	docker-compose -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

# Production commands
prod:
	docker-compose up --build -d

prod-down:
	docker-compose down

# Build all services
build:
	docker-compose build

# View logs
logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

logs-auth:
	docker-compose logs -f auth-service

logs-translation:
	docker-compose logs -f translation-service

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Database operations
db-migrate:
	docker-compose exec postgres-dev psql -U postgres -d translator_dev -f /docker-entrypoint-initdb.d/01-create-tables.sql

# Health checks
health:
	curl http://localhost/health
	curl http://localhost:3001/health
	curl http://localhost:3002/health
	curl http://localhost:3003/health

# Scale services
scale-frontend:
	docker-compose up --scale frontend=3 -d

scale-auth:
	docker-compose up --scale auth-service=2 -d

scale-translation:
	docker-compose up --scale translation-service=2 -d
