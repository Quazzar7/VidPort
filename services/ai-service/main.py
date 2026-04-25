"""
VidPort AI Service — FastAPI wrapper around Ollama/llama3.
Provides three endpoints consumed by the .NET backend:
  POST /ai/analyze-job      → structured job analysis
  POST /ai/cover-letter     → tailored cover letter
  POST /ai/interview-prep   → interview questions + model answers
"""

import os, json, re
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.k3d.internal:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3")
TIMEOUT         = 180  # seconds – llama3 on CPU can be slow

app = FastAPI(title="VidPort AI Service")


# ── Pydantic models ───────────────────────────────────────────────────────────

class JobDetails(BaseModel):
    title: str
    company: str
    location: str | None = None
    skills: list[str] = []
    description: str | None = None
    source: str | None = None

class UserProfile(BaseModel):
    role: str
    experienceLevel: str
    skills: list[str] = []

class AnalyzeJobRequest(BaseModel):
    job: JobDetails

class CoverLetterRequest(BaseModel):
    job: JobDetails
    profile: UserProfile

class InterviewPrepRequest(BaseModel):
    job: JobDetails
    profile: UserProfile


# ── Ollama helper ─────────────────────────────────────────────────────────────

def call_ollama(prompt: str) -> str:
    try:
        resp = httpx.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.6, "num_predict": 800},
            },
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")


def extract_json(raw: str):
    """Strip markdown fences and parse JSON."""
    text = raw.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.post("/ai/analyze-job")
def analyze_job(req: AnalyzeJobRequest):
    j = req.job
    skills_str = ", ".join(j.skills) if j.skills else "not specified"

    prompt = f"""You are a senior tech recruiter and career coach specializing in the Indian job market.

Analyze this job posting and give a structured, honest, actionable assessment:

Job Title : {j.title}
Company   : {j.company}
Location  : {j.location or 'Not specified'}
Skills    : {skills_str}
Description: {j.description or 'Not provided'}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{{
  "verdict": "Strong Apply | Apply | Consider | Skip",
  "verdictReason": "<one sentence explaining the verdict>",
  "keyRequirements": ["<skill or requirement 1>", "<skill or requirement 2>", "<skill or requirement 3>"],
  "redFlags": ["<red flag or concern, or empty list if none>"],
  "applicationTips": ["<specific tip 1>", "<specific tip 2>", "<specific tip 3>"],
  "estimatedSalary": "<salary range in INR LPA, e.g. 12-18 LPA>",
  "difficultyLevel": "Easy | Medium | Competitive | Highly Competitive",
  "whyApply": "<2 sentences on what makes this role valuable for career growth>"
}}"""

    raw = call_ollama(prompt)
    try:
        return extract_json(raw)
    except Exception:
        # Graceful fallback if JSON parse fails
        return {
            "verdict": "Apply",
            "verdictReason": "Based on the job details, this appears to be a relevant opportunity.",
            "keyRequirements": j.skills[:3],
            "redFlags": [],
            "applicationTips": [
                f"Highlight your {j.skills[0]} experience if you have it.",
                "Research the company before applying.",
                "Tailor your resume to match the job description.",
            ] if j.skills else ["Tailor your resume to the job description."],
            "estimatedSalary": "Market rate",
            "difficultyLevel": "Medium",
            "whyApply": f"This {j.title} role at {j.company} could be a strong next step in your career.",
        }


@app.post("/ai/cover-letter")
def cover_letter(req: CoverLetterRequest):
    j, p = req.job, req.profile
    user_skills = ", ".join(p.skills) if p.skills else "various technologies"
    job_skills  = ", ".join(j.skills) if j.skills else "relevant technologies"

    prompt = f"""You are an expert career coach writing a professional cover letter for a tech professional in India.

Candidate Profile:
- Role: {p.role}
- Experience Level: {p.experienceLevel}
- Core Skills: {user_skills}

Job Being Applied For:
- Title: {j.title}
- Company: {j.company}
- Location: {j.location or 'Not specified'}
- Required Skills: {job_skills}

Write a compelling, professional cover letter. It must be:
- 3 paragraphs: Opening (hook + position), Middle (skills match + value), Closing (call to action)
- Specific to THIS job and company — no generic filler
- Confident but not arrogant
- Under 250 words
- Professional Indian English

Respond ONLY with a valid JSON object:
{{
  "subject": "<email subject line>",
  "body": "<full cover letter text with \\n for line breaks>"
}}"""

    raw = call_ollama(prompt)
    try:
        return extract_json(raw)
    except Exception:
        return {
            "subject": f"Application for {j.title} at {j.company}",
            "body": (
                f"Dear Hiring Manager,\n\n"
                f"I am writing to express my strong interest in the {j.title} position at {j.company}. "
                f"As a {p.experienceLevel} {p.role} with expertise in {user_skills}, "
                f"I am confident in my ability to contribute meaningfully to your team.\n\n"
                f"My experience with {user_skills} aligns well with the requirements of this role. "
                f"I have consistently delivered high-quality results and am eager to bring this same commitment to {j.company}.\n\n"
                f"I would welcome the opportunity to discuss how my background can benefit your team. "
                f"Thank you for considering my application.\n\nSincerely"
            ),
        }


@app.post("/ai/interview-prep")
def interview_prep(req: InterviewPrepRequest):
    j, p = req.job, req.profile
    user_skills = ", ".join(p.skills) if p.skills else "software development"
    job_skills  = ", ".join(j.skills) if j.skills else "relevant technologies"

    prompt = f"""You are a senior technical interviewer preparing a candidate for a job interview.

Candidate: {p.experienceLevel} {p.role}, skilled in {user_skills}
Job: {j.title} at {j.company} (requires: {job_skills})

Generate exactly 5 interview questions this company is VERY LIKELY to ask for this specific role,
along with a concise model answer for each.

Mix of: 2 technical, 1 system design / architecture, 1 behavioral, 1 company/role-specific.

Respond ONLY with a valid JSON array:
[
  {{
    "type": "Technical | System Design | Behavioral | Role-Specific",
    "question": "<the interview question>",
    "modelAnswer": "<a strong 3-5 sentence model answer>",
    "tip": "<one quick tip to deliver this answer well>"
  }}
]"""

    raw = call_ollama(prompt)
    try:
        result = extract_json(raw)
        return {"questions": result}
    except Exception:
        return {"questions": [
            {
                "type": "Technical",
                "question": f"Walk me through how you would approach building a scalable {j.title.split()[0]} system.",
                "modelAnswer": "I would start by clarifying requirements, then design the data model, choose appropriate technologies based on constraints, and plan for horizontal scaling from the start.",
                "tip": "Use the STAR method and be specific about technologies you've used.",
            }
        ]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
