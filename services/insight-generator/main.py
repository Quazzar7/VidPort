import os
import json
import time
import schedule
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DB_DSN         = os.getenv("DB_DSN")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.k3d.internal:11434")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL", "llama3")


# ── Database ──────────────────────────────────────────────────────────────────

def connect_db(retries: int = 10, delay: int = 5):
    if not DB_DSN:
        raise ValueError("DB_DSN not set")
    for attempt in range(retries):
        try:
            return psycopg2.connect(DB_DSN)
        except psycopg2.OperationalError as e:
            if attempt < retries - 1:
                print(f"[insight-gen] DB not ready, retrying in {delay}s... ({e})", flush=True)
                time.sleep(delay)
            else:
                raise


# ── Ollama ────────────────────────────────────────────────────────────────────

def ask_ollama(prompt: str) -> str | None:
    """
    Send a prompt to Ollama and return the text response.
    Uses the /api/chat endpoint (OpenAI-compatible shape).
    Returns None if Ollama is unreachable or times out.
    """
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {
                    "temperature": 0.7,   # some creativity but not hallucination-prone
                    "num_predict": 512,   # max tokens in response
                },
            },
            timeout=120,  # llama3 on CPU can be slow — give it 2 min
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()
    except Exception as e:
        print(f"[insight-gen] Ollama error: {e}", flush=True)
        return None


def parse_insights_json(raw: str) -> list[dict] | None:
    """
    Ollama sometimes wraps JSON in markdown fences (```json ... ```).
    Strip them and parse.
    """
    try:
        # Strip markdown fences if present
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception:
        return None


# ── Insight generation ────────────────────────────────────────────────────────

def build_prompt(total_jobs: int, top_skills: list, india_jobs: int,
                 top_locations: list, top_companies: list) -> str:
    skills_str    = ", ".join(f"{s[0]} ({s[1]} jobs)" for s in top_skills[:8])
    locations_str = ", ".join(f"{l[0]} ({l[1]})" for l in top_locations[:5]) if top_locations else "N/A"
    companies_str = ", ".join(f"{c[0]} ({c[1]})" for c in top_companies[:5]) if top_companies else "N/A"

    return f"""You are a senior job market analyst for VidPort, a tech hiring platform focused on India.

Here is real job market data from the past 7 days:
- Total job postings analyzed: {total_jobs}
- Jobs in India: {india_jobs}
- Top skills in demand: {skills_str}
- Top hiring locations: {locations_str}
- Top hiring companies: {companies_str}

Generate exactly 3 actionable job market insights for tech professionals in India.
You MUST respond with ONLY a valid JSON array — no explanation, no markdown, no preamble.

Format:
[
  {{
    "type": "trend",
    "title": "<short title under 8 words>",
    "body": "<2-3 sentences, specific and actionable, under 120 words>"
  }},
  {{
    "type": "recommendation",
    "title": "<short title under 8 words>",
    "body": "<2-3 sentences, specific and actionable, under 120 words>"
  }},
  {{
    "type": "alert",
    "title": "<short title under 8 words>",
    "body": "<2-3 sentences, specific and actionable, under 120 words>"
  }}
]"""


def fallback_insights(total_jobs: int, top_skills: list) -> list[dict]:
    """Used when Ollama is unavailable — simple template strings."""
    skills_str = ", ".join(f"{s[0]} ({s[1]})" for s in top_skills[:5])
    top_skill  = top_skills[0][0] if top_skills else "Python"
    top_count  = top_skills[0][1] if top_skills else 0
    return [
        {
            "type": "trend",
            "title": "Top In-Demand Skills This Week",
            "body": f"Based on {total_jobs} jobs analyzed, top skills are: {skills_str}. "
                    f"Prioritize these in your portfolio and profile.",
        },
        {
            "type": "recommendation",
            "title": f"Highlight {top_skill} Prominently",
            "body": f"{top_skill} appears in {top_count} postings this week — "
                    f"the highest demand of any skill. Make sure your VidPort profile "
                    f"and resume video showcase {top_skill} work.",
        },
        {
            "type": "alert",
            "title": "Weekly Market Snapshot",
            "body": f"{total_jobs} new job postings tracked across {len(top_skills)} "
                    f"distinct skill areas this week.",
        },
    ]


def generate_insights():
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            # Top skills from skill_aggregates
            cur.execute("""
                SELECT skill_name, SUM(job_count) AS total
                FROM skill_aggregates
                WHERE period_start >= NOW() - INTERVAL '7 days'
                GROUP BY skill_name
                ORDER BY total DESC
                LIMIT 10
            """)
            top_skills = cur.fetchall()

            # Total jobs this week
            cur.execute("""
                SELECT COUNT(*) FROM raw_jobs
                WHERE created_at >= NOW() - INTERVAL '7 days'
            """)
            total_jobs = cur.fetchone()[0]

            # India-specific job count
            cur.execute("""
                SELECT COUNT(*) FROM raw_jobs
                WHERE created_at >= NOW() - INTERVAL '7 days'
                  AND (
                    LOWER(location) LIKE '%india%'
                    OR LOWER(location) LIKE '%bengaluru%'
                    OR LOWER(location) LIKE '%mumbai%'
                    OR LOWER(location) LIKE '%hyderabad%'
                    OR LOWER(location) LIKE '%delhi%'
                    OR LOWER(location) LIKE '%pune%'
                    OR LOWER(location) LIKE '%chennai%'
                    OR LOWER(location) LIKE '%kochi%'
                    OR LOWER(location) LIKE '%kerala%'
                  )
            """)
            india_jobs = cur.fetchone()[0]

            # Top locations
            cur.execute("""
                SELECT location, COUNT(*) AS cnt
                FROM raw_jobs
                WHERE created_at >= NOW() - INTERVAL '7 days'
                  AND location IS NOT NULL AND location != ''
                GROUP BY location
                ORDER BY cnt DESC
                LIMIT 5
            """)
            top_locations = cur.fetchall()

            # Top hiring companies
            cur.execute("""
                SELECT company, COUNT(*) AS cnt
                FROM raw_jobs
                WHERE created_at >= NOW() - INTERVAL '7 days'
                  AND company IS NOT NULL AND company != ''
                GROUP BY company
                ORDER BY cnt DESC
                LIMIT 5
            """)
            top_companies = cur.fetchall()

        if not top_skills and total_jobs == 0:
            print("[insight-gen] No data yet, skipping.", flush=True)
            return

        # ── Ask Ollama ────────────────────────────────────────────────────────
        insights = None
        print(f"[insight-gen] Sending prompt to Ollama ({OLLAMA_MODEL}) at {OLLAMA_BASE_URL}...", flush=True)

        prompt   = build_prompt(total_jobs, top_skills, india_jobs, top_locations, top_companies)
        raw      = ask_ollama(prompt)

        if raw:
            insights = parse_insights_json(raw)
            if not insights:
                print(f"[insight-gen] Could not parse Ollama response, using fallback.\nRaw: {raw[:300]}", flush=True)

        if not insights:
            print("[insight-gen] Using fallback template insights.", flush=True)
            insights = fallback_insights(total_jobs, top_skills)

        # ── Write to DB ───────────────────────────────────────────────────────
        with conn.cursor() as cur:
            cur.execute("UPDATE job_insights SET is_active = false")
            for ins in insights:
                cur.execute("""
                    INSERT INTO job_insights (id, type, title, body, generated_at, is_active)
                    VALUES (gen_random_uuid(), %s, %s, %s, NOW(), true)
                """, (ins.get("type", "trend"), ins["title"], ins["body"]))

        conn.commit()
        source = "Ollama/llama3" if raw and insights else "fallback"
        print(
            f"[insight-gen] {len(insights)} insights written at "
            f"{datetime.now(timezone.utc).isoformat()} [{source}]",
            flush=True,
        )

    except Exception as e:
        conn.rollback()
        print(f"[insight-gen] Error: {e}", flush=True)
    finally:
        conn.close()


# ── Entry point ───────────────────────────────────────────────────────────────

schedule.every(1).hours.do(generate_insights)

if __name__ == "__main__":
    time.sleep(20)   # Wait for DB and processor to populate data
    generate_insights()
    while True:
        schedule.run_pending()
        time.sleep(60)
