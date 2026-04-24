import json
import os
import time
from dotenv import load_dotenv

import psycopg2
from confluent_kafka import Consumer, KafkaException

# Load environment variables from .env file if it exists
load_dotenv()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP")
TOPIC = os.getenv("KAFKA_TOPIC", "jobs.raw")
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "job-processor")
DB_DSN = os.getenv("DB_DSN")


def connect_db(retries: int = 10, delay: int = 5):
    if not DB_DSN:
        raise ValueError("DB_DSN not found in environment or .env file")
    for attempt in range(retries):
        try:
            return psycopg2.connect(DB_DSN)
        except psycopg2.OperationalError as e:
            if attempt < retries - 1:
                print(f"[processor] DB not ready, retrying in {delay}s... ({e})", flush=True)
                time.sleep(delay)
            else:
                raise


def upsert_job(conn, event: dict) -> bool:
    job = event["job"]
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id FROM raw_jobs WHERE external_id = %s AND source = %s',
            (job["external_id"], event["source"]),
        )
        if cur.fetchone():
            return False

        cur.execute(
            """
            INSERT INTO raw_jobs
                (id, external_id, source, title, company, location, description,
                 skills, salary_min, salary_max, posted_at, created_at, is_processed)
            VALUES
                (gen_random_uuid(), %s, %s, %s, %s, %s, %s,
                 %s::text[], %s, %s, %s::timestamptz, NOW(), false)
            """,
            (
                job["external_id"],
                event["source"],
                job["title"],
                job["company"],
                job.get("location"),
                job.get("description", ""),
                job.get("skills") or [],
                job.get("salary_min"),
                job.get("salary_max"),
                job["posted_at"],
            ),
        )

        for skill in job.get("skills") or []:
            cur.execute(
                """
                INSERT INTO skill_aggregates
                    (id, skill_name, job_count, week_over_week_change,
                     period_start, period_end, computed_at)
                VALUES
                    (gen_random_uuid(), %s, 1, 0,
                     date_trunc('week', NOW()),
                     date_trunc('week', NOW()) + INTERVAL '7 days',
                     NOW())
                ON CONFLICT (skill_name, period_start)
                DO UPDATE SET
                    job_count = skill_aggregates.job_count + 1,
                    computed_at = NOW()
                """,
                (skill,),
            )

    conn.commit()
    return True


def main():
    time.sleep(15)  # Wait for Kafka + DB to be ready

    conf = {
        "bootstrap.servers": KAFKA_BOOTSTRAP,
        "group.id": GROUP_ID,
        "auto.offset.reset": "earliest",
        "enable.auto.commit": True,
    }
    consumer = Consumer(conf)
    consumer.subscribe([TOPIC])

    conn = connect_db()
    print(f"[processor] Consuming from topic '{TOPIC}'...", flush=True)

    try:
        while True:
            msg = consumer.poll(timeout=2.0)
            if msg is None:
                continue
            if msg.error():
                raise KafkaException(msg.error())

            try:
                event = json.loads(msg.value().decode("utf-8"))
                inserted = upsert_job(conn, event)
                status = "stored" if inserted else "skipped (duplicate)"
                print(f"[processor] {status}: {event['job']['title']} @ {event['job']['company']}", flush=True)
            except Exception as e:
                conn.rollback()
                print(f"[processor] Error processing message: {e}", flush=True)

    except KeyboardInterrupt:
        pass
    finally:
        consumer.close()
        conn.close()


if __name__ == "__main__":
    main()
