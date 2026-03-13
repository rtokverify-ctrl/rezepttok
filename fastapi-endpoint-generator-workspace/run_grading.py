import json
import os

evals = [
    {
        "id": 1,
        "name": "shopping-list-note",
        "assertions": [
            { "name": "uses_get_db", "logic": lambda txt: "Depends(get_db)" in txt, "desc": "Router endpoint uses the get_db dependency injection." },
            { "name": "uses_pydantic_schema", "logic": lambda txt: "schemas.ShoppingItem" in txt, "desc": "Endpoint strictly uses predefined Pydantic schemas for IO." }
        ]
    },
    {
        "id": 2,
        "name": "video-deeplink",
        "assertions": [
            { "name": "has_test_client", "logic": lambda txt: "TestClient(app)" in txt, "desc": "Verification test was generated using TestClient." },
            { "name": "router_not_main", "logic": lambda txt: "APIRouter(" in txt, "desc": "Endpoints are put into a router instead of directly into the main app." }
        ]
    },
    {
        "id": 3,
        "name": "healthcheck",
        "assertions": [
            { "name": "uses_db_query", "logic": lambda txt: "db.execute(" in txt, "desc": "Healthcheck touches the DB via SQLAlchemy to prove connection." },
            { "name": "returns_ok", "logic": lambda txt: "\"status\": \"ok\"" in txt, "desc": "Healthcheck returns valid OK status." }
        ]
    }
]

workspace = "iteration-1"
for eval_case in evals:
    for variant in ["with_skill", "without_skill"]:
        router_path = f"{workspace}/eval-{eval_case['id']}/{variant}/outputs/routers"
        test_path = f"{workspace}/eval-{eval_case['id']}/{variant}/outputs/tests"
        
        # Read the generated output files (we combine router and test content for simple text checking)
        text_content = ""
        for path in [router_path, test_path]:
            if os.path.exists(path):
                for file in os.listdir(path):
                    if file.endswith('.py'):
                        with open(os.path.join(path, file), 'r', encoding='utf-8') as f:
                            text_content += f.read() + "\n"

        grading_results = []
        for assertion in eval_case["assertions"]:
            passed = assertion["logic"](text_content)
            grading_results.append({
                "text": assertion["desc"],
                "passed": passed,
                "evidence": "Found in code syntax" if passed else "Missing from syntax"
            })
        
        grade_path = f"{workspace}/eval-{eval_case['id']}/{variant}/grading.json"
        os.makedirs(os.path.dirname(grade_path), exist_ok=True)
        
        with open(grade_path, 'w', encoding='utf-8') as f:
            json.dump({ "expectations": grading_results }, f, indent=2)

print("Grading complete.")
