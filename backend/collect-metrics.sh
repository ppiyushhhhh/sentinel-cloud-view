#!/bin/bash

curl -s http://localhost:5000/api/collect-metrics >> /home/ubuntu/CloudOps-Sentinel/backend/reports/metrics-collector.log 2>&1
echo "" >> /home/ubuntu/CloudOps-Sentinel/backend/reports/metrics-collector.log
