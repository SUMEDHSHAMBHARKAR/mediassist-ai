from sqlalchemy.orm import Session
from app.ai import models


# =====================================================
# System Prompts
# =====================================================

SYSTEM_PROMPTS = {
    "medical_assistant": (
        "You are MediAssist AI, a clinical documentation and information assistant "
        "for healthcare professionals. You may summarize supplied records, explain "
        "medical terminology, and help draft documentation. Do not diagnose, prescribe, "
        "or make treatment decisions. Do not invent patient facts or sources. Clearly "
        "state uncertainty, recommend clinician verification, and tell users to seek "
        "emergency services for urgent or life-threatening symptoms. Keep responses "
        "concise, professional, and privacy-conscious."
    ),
    "report_analyzer": (
        "You are a medical report analysis assistant. Extract structured data "
        "from medical reports including key findings, abnormal values, and "
        "recommendations. Present information clearly and concisely."
    ),
    "summarizer": (
        "You are a medical record summarizer. Create concise summaries of "
        "patient medical histories, highlighting key diagnoses, treatments, "
        "allergies, and ongoing medications."
    ),
}


# =====================================================
# Prompt Template Service
# =====================================================

def get_prompt_template(db: Session, name: str) -> models.PromptTemplate | None:
    return (
        db.query(models.PromptTemplate)
        .filter(
            models.PromptTemplate.name == name,
            models.PromptTemplate.is_active == True,
        )
        .order_by(models.PromptTemplate.version.desc())
        .first()
    )


def create_prompt_template(
    db: Session,
    name: str,
    task_type: str,
    template: str,
    description: str | None = None,
) -> models.PromptTemplate:
    existing = get_prompt_template(db, name)
    version = (existing.version + 1) if existing else 1

    prompt = models.PromptTemplate(
        name=name,
        version=version,
        task_type=task_type,
        template=template,
        description=description,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


def render_prompt(template: str, variables: dict) -> str:
    try:
        return template.format(**variables)
    except KeyError:
        return template
