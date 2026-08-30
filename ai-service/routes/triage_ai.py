from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()

SYMPTOM_RULES = {
    "chest_pain": {"category": "RED", "specialty": "cardiology"},
    "fever": {"category": "AMBER", "specialty": "general"},
    "headache": {"category": "GREEN", "specialty": "general"},
    "breathlessness": {"category": "RED", "specialty": "pulmonology"},
    "pregnancy_complication": {"category": "RED", "specialty": "obgyn"},
}

class TriageRequest(BaseModel):
    symptoms: list[str]
    vitals: dict | None = None
    age: int | None = None
    is_pregnant: bool = False

class TriageResponse(BaseModel):
    category: str
    recommended_specialty: str
    confidence: float
    advice: str

@router.post("/triage", response_model=TriageResponse)
def assess_triage(req: TriageRequest):
    category = "GREEN"
    specialty = "general"
    confidence = 0.75

    for symptom in req.symptoms:
        rule = SYMPTOM_RULES.get(symptom.lower().replace(" ", "_"))
        if rule:
            if rule["category"] == "RED":
                category = "RED"
                specialty = rule["specialty"]
                confidence = 0.92
                break
            elif rule["category"] == "AMBER" and category != "RED":
                category = "AMBER"
                specialty = rule["specialty"]
                confidence = 0.85

    if req.is_pregnant and category == "RED":
        specialty = "obgyn"

    advice_map = {
        "RED": "Seek immediate medical attention. Use SOS if needed.",
        "AMBER": "Consult a healthcare provider within 24 hours.",
        "GREEN": "Self-care advised. Monitor symptoms.",
    }

    return TriageResponse(
        category=category,
        recommended_specialty=specialty,
        confidence=confidence,
        advice=advice_map[category],
    )
