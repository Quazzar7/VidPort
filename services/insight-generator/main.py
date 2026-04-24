import os
import schedule
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

import psycopg2

# Load environment variables from .env file if it exists
load_dotenv()

DB_DSN = os.getenv("DB_DSN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def connect_db(retries: int = 10, delay: int = 5):
    if not DB_DSN:
        raise ValueError("DB_DSN not found in environment or .env file")
    for attempt in range(retries):
        try:
            return psycopg2.connect(DB_DSN)
        except psycopg2.OperationalError as e:
            if attempt < retries - 1:
                print(f"[insight-gen] DB not ready, retrying in {delay}s... ({e})", flush=True)
                time.sleep(delay)
            else:
                raise


def generate_insights():
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT skill_name, SUM(job_count) AS total
                FROM skill_aggregates
                WHERE period_start >= NOW() - INTERVAL '7 days'
                GROUP BY skill_name
                ORDER BY total DESC
                LIMIT 10
                """
            )
            top_skills = cur.fetchall()

            cur.execute(
                "SELECT COUNT(*) FROM raw_jobs WHERE created_at >= NOW() - INTERVAL '7 days'"
            )
            total_jobs = cur.fetchone()[0]

        if not top_skills:
            print("[insight-gen] No skill data yet, skipping.", flush=True)
            return

        # Deactivate old insights before inserting fresh ones
        with conn.cursor() as cur:
            cur.execute("UPDATE job_insights SET is_active = false")

            # Insight 1: Top skills trend
            skills_str = ", ".join(f"{s[0]} ({s[1]})" for s in top_skills[:5])
            cur.execute(
                """
                INSERT INTO job_insights (id, type, title, body, generated_at, is_active)
                VALUES (gen_random_uuid(), 'trend', %s, %s, NOW(), true)
                """,
                (
                    "Top In-Demand Skills This Week",
                    f"Based on {total_jobs} jobs analyzed, top skills are: {skills_str}. "
                    f"Prioritize these in your portfolio and profile.",
                ),
            )

            # Insight 2: Personalised recommendation
            if top_skills:
                top_skill, top_count = top_skills[0]
                cur.execute(
                    """
                    INSERT INTO job_insights (id, type, title, body, generated_at, is_active)
                    VALUES (gen_random_uuid(), 'recommendation', %s, %s, NOW(), true)
                    """,
                    (
                        f"Highlight {top_skill} Prominently",
                        f"{top_skill} appears in {top_count} postings this week — "
                        f"the highest demand of any skill. Make sure your VidPort profile "
                        f"and resume video showcase {top_skill} work.",
                    ),
                )

            # Insight 3: Market overview alert
            cur.execute(
                """
                INSERT INTO job_insights (id, type, title, body, generated_at, is_active)
                VALUES (gen_random_uuid(), 'alert', %s, %s, NOW(), true)
                """,
                (
                    "Weekly Market Snapshot",
                    f"{total_jobs} new job postings tracked across {len(top_skills)} "
                    f"distinct skill areas this week.",
                ),
            )

        conn.commit()
        print(
            f"[insight-gen] Insights generated at {datetime.now(timezone.utc).isoformat()}",
            flush=True,
        )
    except Exception as e:
        conn.rollback()
        print(f"[insight-gen] Error: {e}", flush=True)
    finally:
        conn.close()


schedule.every(1).hours.do(generate_insights)

if __name__ == "__main__":
    time.sleep(20)  # Wait for DB + processor to populate data
    generate_insights()
    while True:
        schedule.run_pending()
        time.sleep(60)
