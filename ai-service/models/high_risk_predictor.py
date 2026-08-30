# Placeholder for high-risk predictor (Phase 5)
class HighRiskPredictor:
    def predict(self, patient_data: dict) -> bool:
        return patient_data.get("is_diabetic", False) and patient_data.get("is_hypertensive", False)
