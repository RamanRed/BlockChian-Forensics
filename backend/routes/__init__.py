"""DIRS Routes Package"""
from .auth_routes        import router as auth_router
from .fir_routes         import router as fir_router
from .case_diary_routes  import router as diary_router
from .seizure_routes     import router as seizure_router
from .custody_routes     import router as custody_router
from .person_routes      import router as person_router
from .chargesheet_routes import router as chargesheet_router
from .court_routes       import router as court_router
from .verification_routes import router as verification_router
from .admin_routes       import router as admin_router
