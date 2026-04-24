import hashlib
import json
import os
import schedule
import time
import uuid
from datetime import datetime, date, timezone

from confluent_kafka import Producer

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
TOPIC = "jobs.raw"

MOCK_JOBS = [
    {"title": "Senior .NET Developer", "company": "TechCorp", "location": "Remote", "skills": ["C#", ".NET", "Azure", "Docker", "Kubernetes"]},
    {"title": "Full Stack Engineer", "company": "StartupXYZ", "location": "London, UK", "skills": ["React", "Node.js", "PostgreSQL", "TypeScript", "Docker"]},
    {"title": "Platform Engineer", "company": "FinTechPro", "location": "Remote", "skills": ["Kubernetes", "Terraform", "AWS", "Python", "Go"]},
    {"title": "Backend Engineer (.NET)", "company": "EnterpriseIO", "location": "Berlin, Germany", "skills": ["C#", ".NET", "SQL Server", "RabbitMQ", "Redis"]},
    {"title": "DevOps Engineer", "company": "CloudBase", "location": "Remote", "skills": ["Kubernetes", "ArgoCD", "Helm", "Prometheus", "Grafana"]},
    {"title": "Software Architect", "company": "ArchSystems", "location": "Amsterdam, NL", "skills": ["C#", ".NET", "Microservices", "Kafka", "DDD"]},
    {"title": "Python Data Engineer", "company": "DataStream", "location": "Remote", "skills": ["Python", "Kafka", "Spark", "PostgreSQL", "Airflow"]},
    {"title": "React Frontend Engineer", "company": "UIStudio", "location": "Remote", "skills": ["React", "TypeScript", "Next.js", "TailwindCSS", "GraphQL"]},
    {"title": "Site Reliability Engineer", "company": "ScaleOps", "location": "Remote", "skills": ["Kubernetes", "Go", "Prometheus", "Terraform", "Linux"]},
    {"title": "Lead .NET Engineer", "company": "CorpSoft", "location": "Dublin, Ireland", "skills": ["C#", ".NET", "EF Core", "Azure", "CQRS"]},
]


def make_external_id(job: dict) -> str:
    key = f"{date.today().isoformat()}|{job['title']}|{job['company']}"
    return hashlib.md5(key.encode()).hexdigest()


def delivery_report(err, msg):
    if err:
        print(f"[scraper] Delivery failed: {err}", flush=True)


def scrape_and_publish():
    conf = {"bootstrap.servers": KAFKA_BOOTSTRAP}
    producer = Producer(conf)

    published = 0
    for job in MOCK_JOBS:
        event = {
            "event_id": str(uuid.uuid4()),
            "source": "mock",
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "job": {
                "external_id": make_external_id(job),
                "title": job["title"],
                "company": job["company"],
                "location": job.get("location"),
                "description": f"We are looking for a {job['title']} to join {job['company']}.",
                "skills": job.get("skills", []),
                "salary_min": None,
                "salary_max": None,
                "posted_at": datetime.now(timezone.utc).isoformat(),
            },
        }
        producer.produce(TOPIC, json.dumps(event).encode("utf-8"), callback=delivery_report)
        published += 1

    producer.flush()
    print(f"[scraper] Published {published} jobs at {datetime.now(timezone.utc).isoformat()}", flush=True)


schedule.every(1).hours.do(scrape_and_publish)

if __name__ == "__main__":
    # Wait briefly for Kafka to be ready
    time.sleep(10)
    scrape_and_publish()
    while True:
        schedule.run_pending()
        time.sleep(60)
