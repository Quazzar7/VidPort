import hashlib
import html
import json
import os
import re
import schedule
import time
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

import requests
from confluent_kafka import Producer

# Load environment variables from .env file if it exists
load_dotenv()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP")
TOPIC = os.getenv("KAFKA_TOPIC", "jobs.raw")
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

if not KAFKA_BOOTSTRAP:
    # We'll let it fail later or provide a warning here
    print("[scraper] WARNING: KAFKA_BOOTSTRAP not set", flush=True)

HEADERS = {"User-Agent": "VidPort-JobIntelligence/1.0 (private research tool)"}

# Canonical tech skill vocabulary — used both as a whitelist for tags
# and for keyword extraction from job descriptions.
TECH_SKILLS: set[str] = {
    # Languages
    "python", "javascript", "typescript", "java", "c#", ".net", "go", "golang",
    "rust", "kotlin", "swift", "ruby", "php", "scala", "c++", "elixir", "r",
    "bash", "shell", "powershell", "haskell", "clojure", "perl",
    # Frontend
    "react", "vue", "angular", "next.js", "nuxt", "svelte", "htmx",
    "tailwindcss", "sass", "webpack", "vite", "graphql",
    # Backend / frameworks
    "node.js", "express", "django", "flask", "fastapi", "spring", "laravel",
    "rails", "asp.net", "fastify", "nestjs", "gin", "fiber",
    # Databases
    "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "neo4j", "clickhouse", "snowflake", "bigquery",
    "sql server", "oracle", "supabase", "planetscale",
    # Cloud / Infra
    "aws", "azure", "gcp", "cloudflare", "vercel", "netlify", "heroku",
    "kubernetes", "docker", "terraform", "ansible", "pulumi", "helm",
    "argocd", "flux", "vagrant",
    # Messaging / streaming
    "kafka", "rabbitmq", "nats", "sqs", "pubsub", "celery",
    # DevOps / CI
    "github actions", "jenkins", "gitlab ci", "circleci", "travis ci",
    "ci/cd", "linux", "git", "nginx", "traefik", "prometheus", "grafana",
    "datadog", "sentry", "opentelemetry",
    # AI / ML
    "machine learning", "deep learning", "pytorch", "tensorflow", "keras",
    "scikit-learn", "langchain", "openai", "huggingface",
    "spark", "airflow", "dbt", "mlflow",
    # Mobile
    "ios", "android", "flutter", "react native", "swift", "kotlin",
    # Protocols / patterns
    "rest", "grpc", "websocket", "microservices", "ddd", "cqrs", "event sourcing",
    # .NET ecosystem
    "ef core", "blazor", "maui", "signalr", "hangfire",
}

# Lowercase → canonical skill name for consistent storage ("REST" → "rest", "MySQL" → "mysql")
_SKILL_CANONICAL: dict[str, str] = {s.lower(): s for s in TECH_SKILLS}


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    return " ".join(text.split())[:800]


def clean_tags(tags: list) -> list:
    """
    Whitelist + normalise: keep only tags that match a known tech skill
    and return the canonical (consistent) name. Drops generic role/category
    words like 'support', 'management', 'growth' that RemoteOK attaches to
    non-tech listings.
    """
    seen: set[str] = set()
    result: list[str] = []
    for t in (tags or []):
        canonical = _SKILL_CANONICAL.get(t.lower())
        if canonical and canonical not in seen:
            seen.add(canonical)
            result.append(canonical)
    return result[:15]


# Short common words that are also language names — safe in tags, unreliable in prose
_TEXT_AMBIGUOUS = {"go", "r", "c"}

def extract_skills_from_text(description: str) -> list:
    lower = description.lower()
    return [
        s for s in TECH_SKILLS
        if s not in _TEXT_AMBIGUOUS
        and re.search(r"\b" + re.escape(s) + r"\b", lower)
    ][:12]


def make_external_id(source: str, job_id: str) -> str:
    return hashlib.md5(f"{source}|{job_id}".encode()).hexdigest()


def delivery_report(err, _msg):
    if err:
        print(f"[scraper] Delivery failed: {err}", flush=True)


def publish_jobs(producer: Producer, jobs: list) -> int:
    for job in jobs:
        event = {
            "event_id": str(uuid.uuid4()),
            "source": job["source"],
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "job": {
                "external_id": job["external_id"],
                "title": job["title"],
                "company": job["company"],
                "location": job.get("location"),
                "description": job.get("description", ""),
                "skills": job.get("skills", []),
                "salary_min": job.get("salary_min"),
                "salary_max": job.get("salary_max"),
                "posted_at": job.get("posted_at", datetime.now(timezone.utc).isoformat()),
            },
        }
        producer.produce(TOPIC, json.dumps(event).encode("utf-8"), callback=delivery_report)
    return len(jobs)


# ── Sources ───────────────────────────────────────────────────────────────────

def scrape_remoteok() -> list:
    """
    RemoteOK public API — no auth required.
    https://remoteok.com/api
    """
    try:
        resp = requests.get("https://remoteok.com/api", headers=HEADERS, timeout=15)
        resp.raise_for_status()
        items = resp.json()[1:]  # index 0 is metadata
        jobs = []
        for item in items:
            description = strip_html(item.get("description"))
            skills = clean_tags(item.get("tags") or [])
            if not skills:
                skills = extract_skills_from_text(description)
            if not skills:
                continue  # skip non-tech jobs (bookkeeper, account executive, etc.)
            jobs.append({
                "source": "remoteok",
                "external_id": make_external_id("remoteok", str(item.get("id", uuid.uuid4()))),
                "title": item.get("position", ""),
                "company": item.get("company", ""),
                "location": item.get("location") or "Remote",
                "description": description,
                "skills": skills,
                "salary_min": item.get("salary_min"),
                "salary_max": item.get("salary_max"),
                "posted_at": item.get("date", datetime.now(timezone.utc).isoformat()),
            })
        return jobs
    except Exception as e:
        print(f"[scraper] RemoteOK failed: {e}", flush=True)
        return []


def scrape_remotive() -> list:
    """
    Remotive public API — no auth required.
    https://remotive.com/api/remote-jobs
    """
    try:
        resp = requests.get(
            "https://remotive.com/api/remote-jobs",
            params={"category": "software-dev", "limit": 50},
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        items = resp.json().get("jobs", [])
        jobs = []
        for item in items:
            description = strip_html(item.get("description"))
            skills = clean_tags(item.get("tags") or [])
            if not skills:
                skills = extract_skills_from_text(description)
            if not skills:
                continue  # skip non-tech listings
            # Remotive dates omit timezone — treat as UTC
            pub_date = item.get("publication_date", "")
            if pub_date and not pub_date.endswith("Z") and "+" not in pub_date:
                pub_date += "Z"
            jobs.append({
                "source": "remotive",
                "external_id": make_external_id("remotive", str(item.get("id", uuid.uuid4()))),
                "title": item.get("title", ""),
                "company": item.get("company_name", ""),
                "location": item.get("candidate_required_location") or "Remote",
                "description": description,
                "skills": skills,
                "salary_min": None,
                "salary_max": None,
                "posted_at": pub_date or datetime.now(timezone.utc).isoformat(),
            })
        return jobs
    except Exception as e:
        print(f"[scraper] Remotive failed: {e}", flush=True)
        return []


def scrape_adzuna(country: str) -> list:
    """
    Adzuna API — free tier (250 req/day).
    Set ADZUNA_APP_ID and ADZUNA_APP_KEY env vars to enable.
    Register at: https://developer.adzuna.com/
    """
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []
    try:
        resp = requests.get(
            f"https://api.adzuna.com/v1/api/jobs/{country}/search/1",
            params={
                "app_id": ADZUNA_APP_ID,
                "app_key": ADZUNA_APP_KEY,
                "results_per_page": 50,
                "what": "software engineer developer",
                "content-type": "application/json",
            },
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        items = resp.json().get("results", [])
        jobs = []
        for item in items:
            description = strip_html(item.get("description"))
            skills = extract_skills_from_text(description)
            if not skills:
                continue
            s_min = item.get("salary_min")
            s_max = item.get("salary_max")
            jobs.append({
                "source": f"adzuna_{country}",
                "external_id": make_external_id(f"adzuna_{country}", str(item.get("id", uuid.uuid4()))),
                "title": item.get("title", ""),
                "company": item.get("company", {}).get("display_name", ""),
                "location": item.get("location", {}).get("display_name", ""),
                "description": description,
                "skills": skills,
                "salary_min": float(s_min) if s_min else None,
                "salary_max": float(s_max) if s_max else None,
                "posted_at": item.get("created", datetime.now(timezone.utc).isoformat()),
            })
        return jobs
    except Exception as e:
        print(f"[scraper] Adzuna ({country}) failed: {e}", flush=True)
        return []


# ── Main loop ─────────────────────────────────────────────────────────────────

def scrape_and_publish():
    conf = {"bootstrap.servers": KAFKA_BOOTSTRAP}
    producer = Producer(conf)
    total = 0

    sources = [
        ("RemoteOK", lambda: scrape_remoteok()),
        ("Remotive", lambda: scrape_remotive()),
        ("Adzuna GB", lambda: scrape_adzuna("gb")),
        ("Adzuna US", lambda: scrape_adzuna("us")),
        ("Adzuna IN", lambda: scrape_adzuna("in")),
    ]

    for name, fn in sources:
        jobs = fn()
        if jobs:
            n = publish_jobs(producer, jobs)
            print(f"[scraper] {name}: fetched {len(jobs)}, queued {n}", flush=True)
            total += n
        else:
            print(f"[scraper] {name}: no jobs (skipped or failed)", flush=True)

    producer.flush()
    print(f"[scraper] Done — {total} jobs published at {datetime.now(timezone.utc).isoformat()}", flush=True)


schedule.every(1).hours.do(scrape_and_publish)

if __name__ == "__main__":
    time.sleep(10)
    scrape_and_publish()
    while True:
        schedule.run_pending()
        time.sleep(60)
