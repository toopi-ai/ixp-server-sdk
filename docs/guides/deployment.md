# Deployment Guide

This comprehensive guide covers deployment strategies, best practices, and configurations for IXP Server applications across different environments and platforms.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Container Orchestration](#container-orchestration)
- [Database Deployment](#database-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Deployment Overview

### Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   IXP Server    │────│    Database     │
│   (nginx/ALB)   │    │   Application   │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │      Cache      │
                       │     (Redis)     │
                       └─────────────────┘
```

### Deployment Environments

1. **Development**: Local development environment
2. **Staging**: Pre-production testing environment
3. **Production**: Live production environment
4. **Testing**: Automated testing environment

### Deployment Strategies

1. **Blue-Green Deployment**: Zero-downtime deployments
2. **Rolling Deployment**: Gradual instance replacement
3. **Canary Deployment**: Gradual traffic shifting
4. **A/B Testing**: Feature flag-based deployments

## Environment Configuration

### Environment Variables

```bash
# .env.production
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@db-host:5432/ixp_production
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_SSL=true

# Cache Configuration
REDIS_URL=redis://cache-host:6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=https://your-frontend-domain.com

# External Services
WEATHER_API_KEY=your-weather-api-key
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@domain.com
EMAIL_SMTP_PASS=your-email-password

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Performance
CACHE_TTL=3600
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

### Configuration Management

```typescript
// config/production.ts
export const productionConfig = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
      credentials: true
    }
  },
  database: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.DATABASE_SSL === 'true',
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '20')
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  },
  cache: {
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '24h'
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY!
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000')
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: [
      {
        type: 'console',
        colorize: false
      },
      {
        type: 'file',
        filename: 'logs/app.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      }
    ]
  },
  monitoring: {
    metrics: process.env.METRICS_ENABLED === 'true',
    healthCheck: process.env.HEALTH_CHECK_ENABLED === 'true',
    apm: {
      serviceName: 'ixp-server',
      environment: 'production'
    }
  }
};
```

### Environment Validation

```typescript
// config/validation.ts
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_POOL_MIN: Joi.number().min(1).default(2),
  DATABASE_POOL_MAX: Joi.number().min(1).default(20),
  
  REDIS_URL: Joi.string().uri().required(),
  REDIS_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  
  CORS_ORIGIN: Joi.string().required(),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown();

export function validateEnvironment(): void {
  const { error } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ixpserver

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown ixpserver:nodejs logs

# Switch to non-root user
USER ixpserver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start the application
CMD ["node", "dist/server.js"]
```

### Multi-stage Build Optimization

```dockerfile
# Dockerfile.optimized
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build
RUN npm prune --production

# Runtime stage
FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init
WORKDIR /app

# Create user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ixpserver -u 1001

# Copy application
COPY --from=builder --chown=ixpserver:nodejs /app/dist ./dist
COPY --from=builder --chown=ixpserver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ixpserver:nodejs /app/package.json ./package.json

# Create directories
RUN mkdir -p logs tmp && chown -R ixpserver:nodejs logs tmp

USER ixpserver
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://ixpuser:password@db:5432/ixpdb
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - ixp-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ixpdb
      - POSTGRES_USER=ixpuser
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ixpuser -d ixpdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ixp-network

  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass password
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - ixp-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - ixp-network

volumes:
  postgres_data:
  redis_data:

networks:
  ixp-network:
    driver: bridge
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: your-registry/ixp-server:${VERSION:-latest}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - app_logs:/app/logs
    networks:
      - ixp-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - ixp-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

volumes:
  app_logs:
  nginx_logs:

networks:
  ixp-network:
    external: true
```

## Cloud Platforms

### AWS Deployment

#### ECS Deployment

```json
{
  "family": "ixp-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "ixp-server",
      "image": "your-account.dkr.ecr.region.amazonaws.com/ixp-server:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ixp/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ixp/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ixp-server",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### CloudFormation Template

```yaml
# cloudformation/ixp-server.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IXP Server Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]
  
  ImageTag:
    Type: String
    Default: latest

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ixp-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-ixp-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${Environment}-ixp-cluster'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 4

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub '${Environment}-ixp-service'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          AssignPublicIp: DISABLED
      LoadBalancers:
        - ContainerName: ixp-server
          ContainerPort: 3000
          TargetGroupArn: !Ref ALBTargetGroup
      DeploymentConfiguration:
        MaximumPercent: 200
        MinimumHealthyPercent: 50
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true

  # RDS Database
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-ixp-db'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15.4'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      DBName: ixpdb
      MasterUsername: ixpuser
      MasterUserPassword: !Ref DatabasePassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProduction, true, false]
      DeletionProtection: !If [IsProduction, true, false]

  DatabasePassword:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: Database password for IXP Server
      GenerateSecretString:
        SecretStringTemplate: '{"username": "ixpuser"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-ixp-alb-dns'

  DatabaseEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-ixp-db-endpoint'
```

### Google Cloud Platform

#### Cloud Run Deployment

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/ixp-server:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/ixp-server:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'ixp-server'
      - '--image'
      - 'gcr.io/$PROJECT_ID/ixp-server:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      - '--set-secrets'
      - 'DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest'
      - '--memory'
      - '1Gi'
      - '--cpu'
      - '1'
      - '--concurrency'
      - '100'
      - '--max-instances'
      - '10'
      - '--min-instances'
      - '1'

images:
  - 'gcr.io/$PROJECT_ID/ixp-server:$COMMIT_SHA'
```

#### Terraform Configuration

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run Service
resource "google_cloud_run_service" "ixp_server" {
  name     = "ixp-server"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/ixp-server:latest"
        
        ports {
          container_port = 3000
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }
      }
      
      container_concurrency = 100
      timeout_seconds      = 300
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "1"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud SQL Database
resource "google_sql_database_instance" "ixp_db" {
  name             = "ixp-db-${var.environment}"
  database_version = "POSTGRES_15"
  region          = var.region
  
  settings {
    tier = "db-f1-micro"
    
    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
    
    database_flags {
      name  = "log_statement"
      value = "all"
    }
  }
  
  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "ixp_database" {
  name     = "ixpdb"
  instance = google_sql_database_instance.ixp_db.name
}

resource "google_sql_user" "ixp_user" {
  name     = "ixpuser"
  instance = google_sql_database_instance.ixp_db.name
  password = random_password.db_password.result
}

# Redis Instance
resource "google_redis_instance" "ixp_cache" {
  name           = "ixp-cache-${var.environment}"
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  region         = var.region
  
  authorized_network = google_compute_network.vpc.id
  
  redis_version     = "REDIS_7_0"
  display_name      = "IXP Server Cache"
  
  auth_enabled = true
}

# Secrets
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.ixp_user.name}:${google_sql_user.ixp_user.password}@${google_sql_database_instance.ixp_db.private_ip_address}:5432/${google_sql_database.ixp_database.name}"
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
```

### Azure Deployment

#### Container Instances

```yaml
# azure-deploy.yml
apiVersion: 2019-12-01
location: East US
name: ixp-server-container-group
properties:
  containers:
  - name: ixp-server
    properties:
      image: your-registry.azurecr.io/ixp-server:latest
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 1.5
      ports:
      - port: 3000
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: '3000'
      - name: DATABASE_URL
        secureValue: postgresql://user:pass@server.postgres.database.azure.com:5432/ixpdb
      - name: REDIS_URL
        secureValue: rediss://cache.redis.cache.windows.net:6380
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 3000
    dnsNameLabel: ixp-server-prod
  imageRegistryCredentials:
  - server: your-registry.azurecr.io
    username: your-registry
    password: your-password
tags:
  Environment: production
  Application: ixp-server
type: Microsoft.ContainerInstance/containerGroups
```

## Container Orchestration

### Kubernetes Deployment

#### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ixp-server
  namespace: production
  labels:
    app: ixp-server
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ixp-server
  template:
    metadata:
      labels:
        app: ixp-server
        version: v1
    spec:
      containers:
      - name: ixp-server
        image: your-registry/ixp-server:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ixp-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ixp-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ixp-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
      imagePullSecrets:
      - name: registry-secret
---
apiVersion: v1
kind: Service
metadata:
  name: ixp-server-service
  namespace: production
spec:
  selector:
    app: ixp-server
  ports:
  - name: http
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ixp-server-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: ixp-server-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ixp-server-service
            port:
              number: 80
```

#### ConfigMap and Secrets

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ixp-config
  namespace: production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  RATE_LIMIT_WINDOW: "900000"
  RATE_LIMIT_MAX: "1000"
---
apiVersion: v1
kind: Secret
metadata:
  name: ixp-secrets
  namespace: production
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  jwt-secret: <base64-encoded-jwt-secret>
  encryption-key: <base64-encoded-encryption-key>
```

#### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ixp-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ixp-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

### Helm Chart

```yaml
# helm/ixp-server/Chart.yaml
apiVersion: v2
name: ixp-server
description: A Helm chart for IXP Server
type: application
version: 0.1.0
appVersion: "1.0.0"

# helm/ixp-server/values.yaml
replicaCount: 3

image:
  repository: your-registry/ixp-server
  pullPolicy: IfNotPresent
  tag: "latest"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext:
  fsGroup: 1001

securityContext:
  allowPrivilegeEscalation: false
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
    - ALL

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: api.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ixp-server-tls
      hosts:
        - api.yourdomain.com

resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

env:
  NODE_ENV: production
  LOG_LEVEL: info
  CACHE_TTL: "3600"

secrets:
  databaseUrl: ""
  redisUrl: ""
  jwtSecret: ""
  encryptionKey: ""

healthCheck:
  enabled: true
  path: /health
  initialDelaySeconds: 30
  periodSeconds: 10

readinessCheck:
  enabled: true
  path: /ready
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Database Deployment

### PostgreSQL Configuration

```sql
-- init.sql
-- Create database and user
CREATE DATABASE ixpdb;
CREATE USER ixpuser WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ixpdb TO ixpuser;

-- Connect to the database
\c ixpdb;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Grant permissions on extensions
GRANT ALL ON SCHEMA public TO ixpuser;
```

### Database Migration

```typescript
// migrations/001_initial_schema.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['active']);
  });
  
  // Sessions table
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('context').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['created_at']);
  });
  
  // Intent logs table
  await knex.schema.createTable('intent_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('session_id').references('id').inTable('sessions').onDelete('CASCADE');
    table.string('intent_type').notNullable();
    table.text('query').notNullable();
    table.json('response').nullable();
    table.integer('response_time_ms').nullable();
    table.boolean('success').defaultTo(true);
    table.text('error_message').nullable();
    table.timestamps(true, true);
    
    table.index(['session_id']);
    table.index(['intent_type']);
    table.index(['success']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('intent_logs');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup.sh

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ixpdb}
DB_USER=${DB_USER:-ixpuser}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ixpdb_backup_$TIMESTAMP.sql"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-password --verbose --clean --if-exists --create \
  --format=custom --compress=9 \
  --file="$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "Backup created: $BACKUP_FILE"

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
  echo "Backup uploaded to S3"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "ixpdb_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Old backups cleaned up"

echo "Backup completed successfully"
```

### Redis Configuration

```conf
# redis.conf
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass your-secure-password

# General
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Replication
# replica-serve-stale-data yes
# replica-read-only yes

# Security
# rename-command FLUSHDB ""
# rename-command FLUSHALL ""
# rename-command DEBUG ""

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# TCP keepalive
tcp-keepalive 300

# Disable dangerous commands in production
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command EVAL ""
rename-command DEBUG ""
rename-command CONFIG ""
```

## Monitoring and Logging

### Application Monitoring

```typescript
// monitoring/metrics.ts
import { createPrometheusMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const intentProcessingDuration = new Histogram({
  name: 'intent_processing_duration_seconds',
  help: 'Duration of intent processing in seconds',
  labelNames: ['intent_type', 'success'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseConnectionPool = new Gauge({
  name: 'database_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'] // 'used', 'free', 'pending'
});

// Middleware for HTTP metrics
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      
      httpRequestDuration
        .labels(req.method, route, res.statusCode.toString())
        .observe(duration);
      
      httpRequestTotal
        .labels(req.method, route, res.statusCode.toString())
        .inc();
    });
    
    next();
  };
}

// Intent processing metrics
export function recordIntentMetrics(
  intentType: string,
  duration: number,
  success: boolean
) {
  intentProcessingDuration
    .labels(intentType, success.toString())
    .observe(duration / 1000);
}

// Connection tracking
export function trackConnection(delta: number) {
  activeConnections.inc(delta);
}

// Database pool monitoring
export function updateDatabasePoolMetrics(used: number, free: number, pending: number) {
  databaseConnectionPool.labels('used').set(used);
  databaseConnectionPool.labels('free').set(free);
  databaseConnectionPool.labels('pending').set(pending);
}

// Health check endpoint
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, any>;
}> {
  const checks: Record<string, any> = {};
  
  // Database check
  try {
    await database.raw('SELECT 1');
    checks.database = { status: 'healthy' };
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error.message };
  }
  
  // Cache check
  try {
    await cache.ping();
    checks.cache = { status: 'healthy' };
  } catch (error) {
    checks.cache = { status: 'unhealthy', error: error.message };
  }
  
  // Memory check
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: memUsage.heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 1GB
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external
  };
  
  const overallStatus = Object.values(checks).every(
    check => check.status === 'healthy'
  ) ? 'healthy' : 'unhealthy';
  
  return { status: overallStatus, checks };
}
```

### Logging Configuration

```typescript
// logging/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development'
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      : logFormat
  })
];

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: logFormat
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: logFormat
    })
  );
}

// Add Elasticsearch transport if configured
if (process.env.ELASTICSEARCH_URL) {
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME!,
          password: process.env.ELASTICSEARCH_PASSWORD!
        }
      },
      index: 'ixp-server-logs',
      indexTemplate: {
        name: 'ixp-server-logs',
        body: {
          index_patterns: ['ixp-server-logs-*'],
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              '@timestamp': { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text' },
              meta: { type: 'object' }
            }
          }
        }
      }
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Request logging middleware
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      });
    });
    
    next();
  };
}

// Error logging
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
}

// Intent logging
export function logIntent(
  intentType: string,
  query: string,
  response: any,
  duration: number,
  success: boolean,
  userId?: string
) {
  logger.info('Intent Processed', {
    intentType,
    query,
    response: success ? 'success' : 'error',
    duration,
    success,
    userId
  });
}
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "IXP Server Monitoring",
    "tags": ["ixp-server"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "HTTP Request Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "id": 4,
        "title": "Active Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "active_connections",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "id": 5,
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connection_pool_size",
            "legendFormat": "{{state}}"
          }
        ]
      },
      {
        "id": 6,
        "title": "Intent Processing Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(intent_processing_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

## Security Considerations

### SSL/TLS Configuration

```nginx
# nginx/ssl.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Security Hardening

```typescript
// security/hardening.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Security middleware configuration
export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }),
  
  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready';
    }
  }),
  
  // Slow down repeated requests
  slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: 500 // add 500ms delay per request after delayAfter
  })
];

// Input validation middleware
export function validateInput(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
}

// SQL injection prevention
export function sanitizeQuery(query: string): string {
  // Remove potentially dangerous SQL keywords
  const dangerous = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', ';'
  ];
  
  let sanitized = query;
  dangerous.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
}
```

### Secrets Management

```typescript
// security/secrets.ts
import { SecretsManager } from 'aws-sdk';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

class SecretsService {
  private awsSecrets?: SecretsManager;
  private gcpSecrets?: SecretManagerServiceClient;
  
  constructor() {
    if (process.env.AWS_REGION) {
      this.awsSecrets = new SecretsManager({
        region: process.env.AWS_REGION
      });
    }
    
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      this.gcpSecrets = new SecretManagerServiceClient();
    }
  }
  
  async getSecret(secretName: string): Promise<string> {
    // Try environment variable first
    const envValue = process.env[secretName];
    if (envValue) {
      return envValue;
    }
    
    // Try AWS Secrets Manager
    if (this.awsSecrets) {
      try {
        const result = await this.awsSecrets.getSecretValue({
          SecretId: secretName
        }).promise();
        
        return result.SecretString || '';
      } catch (error) {
        console.warn(`Failed to get secret from AWS: ${error.message}`);
      }
    }
    
    // Try Google Secret Manager
    if (this.gcpSecrets) {
      try {
        const [version] = await this.gcpSecrets.accessSecretVersion({
          name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${secretName}/versions/latest`
        });
        
        return version.payload?.data?.toString() || '';
      } catch (error) {
        console.warn(`Failed to get secret from GCP: ${error.message}`);
      }
    }
    
    throw new Error(`Secret ${secretName} not found`);
  }
}

export const secretsService = new SecretsService();
```

## Performance Optimization

### Caching Strategy

```typescript
// performance/caching.ts
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

// Multi-level caching
class CacheService {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.memoryCache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5 // 5 minutes
    });
  }
  
  async get(key: string): Promise<any> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult !== undefined) {
      return memoryResult;
    }
    
    // Try Redis cache
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      // Store in memory cache for faster access
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redis.del(key);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    // Clear memory cache entries matching pattern
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear Redis entries matching pattern
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export const cacheService = new CacheService();

// Caching decorator
export function cached(ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}
```

### Database Optimization

```typescript
// performance/database.ts
import { Knex } from 'knex';

// Connection pooling configuration
export const databaseConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 20,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  },
  acquireConnectionTimeout: 60000,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

// Query optimization utilities
export class QueryOptimizer {
  static addIndexHints(query: Knex.QueryBuilder, indexes: string[]): Knex.QueryBuilder {
    // Add index hints for PostgreSQL
    indexes.forEach(index => {
      query.hint(`USE INDEX (${index})`);
    });
    return query;
  }
  
  static optimizeSelect(query: Knex.QueryBuilder, columns: string[]): Knex.QueryBuilder {
    // Only select needed columns
    return query.select(columns);
  }
  
  static addPagination(
    query: Knex.QueryBuilder,
    page: number = 1,
    limit: number = 20
  ): Knex.QueryBuilder {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }
}

// Database monitoring
export class DatabaseMonitor {
  static async getPoolStats(db: Knex): Promise<any> {
    const pool = (db as any).client.pool;
    
    return {
      used: pool.numUsed(),
      free: pool.numFree(),
      pending: pool.numPendingAcquires(),
      size: pool.size
    };
  }
  
  static async getSlowQueries(db: Knex): Promise<any[]> {
    // Get slow queries from PostgreSQL
    const result = await db.raw(`
      SELECT query, mean_time, calls, total_time
      FROM pg_stat_statements
      WHERE mean_time > 1000
      ORDER BY mean_time DESC
      LIMIT 10
    `);
    
    return result.rows;
  }
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://api.yourdomain.com
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment commands here
          # Examples:
          # - kubectl apply -f k8s/
          # - helm upgrade ixp-server ./helm/ixp-server
          # - docker-compose -f docker-compose.prod.yml up -d
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG }}
      
      - name: Run smoke tests
        run: |
          # Wait for deployment to be ready
          sleep 30
          
          # Run smoke tests
          curl -f https://api.yourdomain.com/health || exit 1
          
          # Run additional smoke tests
          npm run test:smoke
        env:
          API_URL: https://api.yourdomain.com
      
      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

services:
  - postgres:15
  - redis:7

variables:
  POSTGRES_DB: test_db
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test_db
  REDIS_URL: redis://redis:6379

test:
  stage: test
  image: node:20
  cache:
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run lint
    - npm run type-check
    - npm test
    - npm run test:integration
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  image: alpine/helm:latest
  before_script:
    - kubectl config use-context staging
  script:
    - helm upgrade --install ixp-server-staging ./helm/ixp-server \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=staging \
        --namespace staging
  environment:
    name: staging
    url: https://staging-api.yourdomain.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine/helm:latest
  before_script:
    - kubectl config use-context production
  script:
    - helm upgrade --install ixp-server ./helm/ixp-server \
        --set image.tag=$CI_COMMIT_SHA \
        --set environment=production \
        --namespace production
  environment:
    name: production
    url: https://api.yourdomain.com
  when: manual
  only:
    - main
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool status
echo "SELECT * FROM pg_stat_activity;" | psql $DATABASE_URL

# Check for long-running queries
echo "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';" | psql $DATABASE_URL
```

#### Redis Connection Issues

```bash
# Test Redis connectivity
redis-cli -u $REDIS_URL ping

# Check Redis memory usage
redis-cli -u $REDIS_URL info memory

# Monitor Redis commands
redis-cli -u $REDIS_URL monitor
```

#### Performance Issues

```bash
# Check application metrics
curl http://localhost:3000/metrics

# Monitor resource usage
top -p $(pgrep -f "node.*server.js")

# Check disk space
df -h

# Monitor network connections
netstat -tulpn | grep :3000
```

### Debugging Tools

```typescript
// debugging/profiler.ts
import { performance } from 'perf_hooks';

// Performance profiler
export class Profiler {
  private static timers: Map<string, number> = new Map();
  
  static start(label: string): void {
    this.timers.set(label, performance.now());
  }
  
  static end(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      throw new Error(`Timer ${label} not found`);
    }
    
    const duration = performance.now() - start;
    this.timers.delete(label);
    
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  static async profile<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

// Memory usage monitor
export function logMemoryUsage(): void {
  const usage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  });
}

// Request tracing
export function traceRequest() {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = req.headers['x-trace-id'] || generateTraceId();
    req.traceId = traceId;
    
    res.setHeader('x-trace-id', traceId);
    
    console.log(`[${traceId}] ${req.method} ${req.path}`);
    
    next();
  };
}

function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
```

## Best Practices

### Deployment Checklist

- [ ] **Environment Configuration**
  - [ ] All environment variables are set
  - [ ] Secrets are properly managed
  - [ ] Configuration is validated

- [ ] **Security**
  - [ ] SSL/TLS certificates are configured
  - [ ] Security headers are enabled
  - [ ] Rate limiting is configured
  - [ ] Input validation is implemented

- [ ] **Database**
  - [ ] Migrations are applied
  - [ ] Connection pooling is configured
  - [ ] Backups are scheduled
  - [ ] Monitoring is enabled

- [ ] **Caching**
  - [ ] Redis is configured and accessible
  - [ ] Cache invalidation strategies are implemented
  - [ ] Cache monitoring is enabled

- [ ] **Monitoring**
  - [ ] Health checks are configured
  - [ ] Metrics collection is enabled
  - [ ] Logging is properly configured
  - [ ] Alerting is set up

- [ ] **Performance**
  - [ ] Load testing is completed
  - [ ] Resource limits are configured
  - [ ] Auto-scaling is enabled

- [ ] **Backup and Recovery**
  - [ ] Database backups are automated
  - [ ] Disaster recovery plan is documented
  - [ ] Recovery procedures are tested

### Production Readiness

1. **Scalability**: Ensure the application can handle expected load
2. **Reliability**: Implement proper error handling and recovery
3. **Security**: Follow security best practices and regular audits
4. **Monitoring**: Comprehensive monitoring and alerting
5. **Documentation**: Keep deployment and operational documentation updated
6. **Testing**: Thorough testing including load and security testing
7. **Backup**: Regular backups and tested recovery procedures

### Maintenance

- **Regular Updates**: Keep dependencies and base images updated
- **Security Patches**: Apply security patches promptly
- **Performance Monitoring**: Continuously monitor and optimize performance
- **Capacity Planning**: Plan for growth and scale accordingly
- **Documentation**: Keep documentation current with changes

This deployment guide provides a comprehensive foundation for deploying IXP Server applications in production environments. Adapt the configurations and strategies based on your specific requirements and infrastructure.