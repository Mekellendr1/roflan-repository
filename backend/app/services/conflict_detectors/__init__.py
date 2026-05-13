"""Реестр детекторов — единая точка для всех правил."""

from app.services.conflict_detectors.back_to_back import detect_back_to_back
from app.services.conflict_detectors.base import ConflictResult, Detector
from app.services.conflict_detectors.double_booking import detect_double_booking
from app.services.conflict_detectors.hr_mismatch import detect_hr_mismatch
from app.services.conflict_detectors.out_of_hours import detect_out_of_hours
from app.services.conflict_detectors.overload import detect_overload
from app.services.conflict_detectors.stale_schedule import detect_stale_schedule


# Порядок не важен — каждый детектор независим
DETECTORS: list[Detector] = [
    detect_out_of_hours,
    detect_double_booking,
    detect_hr_mismatch,
    detect_overload,
    detect_back_to_back,
    detect_stale_schedule,
]


__all__ = ["DETECTORS", "ConflictResult", "Detector"]
