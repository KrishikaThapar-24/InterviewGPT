
from pydantic import BaseModel, Field


class ResumeProject(BaseModel):
    name: str = ""
    description: str = ""
    technologies: list[str] = Field(default_factory=list)
    key_concepts: list[str] = Field(default_factory=list)


class ResumeAnalysis(BaseModel):
    professional_summary: str = ""

    skills: list[str] = Field(default_factory=list)

    projects: list[ResumeProject] = Field(default_factory=list)

    experience: list[str] = Field(default_factory=list)

    education: list[str] = Field(default_factory=list)

    strengths: list[str] = Field(default_factory=list)

    improvement_areas: list[str] = Field(default_factory=list)
