from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from utilisateurs    import router as utilisateurs_router
from missions        import router as missions_router
from rapports        import router as rapports_router
from recommandations import router as recommandations_router
from volets          import router as volets_router
from validation      import router as validations_router

app = FastAPI(
    title       = "DSFD API",
    description = "Backend plateforme DSFD",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["http://localhost:5501", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

os.makedirs("static/reports", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(utilisateurs_router)
app.include_router(missions_router)
app.include_router(rapports_router)
app.include_router(recommandations_router)
app.include_router(volets_router)
app.include_router(validations_router)  # ← ici, avant le @app.get

@app.get("/")
def accueil():
    return {
        "message"  : "Bienvenue sur l'API DSFD 🏦",
        "status"   : "En ligne",
        "endpoints": ["/missions", "/rapports", "/recommandations", "/volets", "/utilisateurs", "/validations"]
    }