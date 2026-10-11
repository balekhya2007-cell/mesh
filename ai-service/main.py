
import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

app = FastAPI(title="MESH AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProjectRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=5000)


@app.get("/")
def home():
    return {"message": "MESH AI service is running"}


@app.get("/health")
def health():
    return {
        "service": "MESH AI",
        "api_key_configured": client is not None
    }


@app.post("/analyze-project")
def analyze_project(request: ProjectRequest):
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is missing from ai-service/.env"
        )

    prompt = f"""
You are the AI project analyst for MESH, a university
interdisciplinary project collaboration platform.

Analyze this student project.

Title: {request.title}
Description: {request.description}

Return a JSON object with exactly these fields:
- domain: string
- required_skills: array of strings
- suggested_roles: array of strings
- difficulty: Beginner, Intermediate, or Advanced
- feasibility: concise realistic assessment
- suggestions: array of strings

Identify the skills and complementary roles genuinely
needed for the project. Be concise and practical.
Do not claim that the project has already been built.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        result = json.loads(response.text)

        required_fields = [
            "domain",
            "required_skills",
            "suggested_roles",
            "difficulty",
            "feasibility",
            "suggestions"
        ]

        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing field: {field}")

        return result

    except Exception as error:
        print("Gemini analysis error:", str(error))
        raise HTTPException(
            status_code=502,
            detail="Gemini analysis failed. Check the API key, model availability, and quota."
        )
